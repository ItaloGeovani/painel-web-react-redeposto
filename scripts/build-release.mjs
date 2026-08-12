import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONT_ROOT = path.resolve(__dirname, "..");
const PLACEHOLDER_PUBKEY = "REPLACE_WITH_TAURI_SIGNER_PUBLIC_KEY";

function applyEnvFile(name, { overwrite = false } = {}) {
  const p = path.join(FRONT_ROOT, name);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (overwrite || process.env[key] == null || process.env[key] === "") {
      process.env[key] = val;
    }
  }
}

function loadEnvFiles() {
  applyEnvFile(".env");
  applyEnvFile(".env.desktop");
  applyEnvFile(".env.production", { overwrite: true });
}

function bumpPatch(v) {
  const parts = String(v)
    .trim()
    .split(".")
    .map((n) => parseInt(n, 10));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Versão inválida: ${v}`);
  }
  parts[2] += 1;
  return parts.join(".");
}

function askEnter(msg) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(msg, () => {
      rl.close();
      resolve();
    });
  });
}

function setJsonVersion(file, version) {
  const raw = fs.readFileSync(file, "utf8");
  const data = JSON.parse(raw);
  data.version = version;
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function setCargoVersion(file, version) {
  let text = fs.readFileSync(file, "utf8");
  text = text.replace(/^version\s*=\s*"[^"]*"/m, `version = "${version}"`);
  fs.writeFileSync(file, text, "utf8");
}

function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    cwd: FRONT_ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
    ...opts
  });
  if (r.status !== 0) {
    process.exit(r.status || 1);
  }
}

function defaultKeyPath() {
  const inRepo = path.join(FRONT_ROOT, "src-tauri", "signing", "gaspass-pdv.key");
  const inHome = path.join(
    process.env.USERPROFILE || process.env.HOME || "",
    ".tauri",
    "gaspass-pdv.key"
  );
  if (process.env.TAURI_SIGNING_PRIVATE_KEY_PATH) {
    return process.env.TAURI_SIGNING_PRIVATE_KEY_PATH;
  }
  if (fs.existsSync(inRepo)) return inRepo;
  return inHome;
}

function loadPrivateKey(keyPath) {
  if (!process.env.TAURI_SIGNING_PRIVATE_KEY && fs.existsSync(keyPath)) {
    // Prefer path: CLI lê o arquivo; conteúdo no env às vezes falha no Windows
    process.env.TAURI_SIGNING_PRIVATE_KEY_PATH = keyPath;
    process.env.TAURI_SIGNING_PRIVATE_KEY = fs.readFileSync(keyPath, "utf8");
  }
  if (!process.env.TAURI_SIGNING_PRIVATE_KEY && !process.env.TAURI_SIGNING_PRIVATE_KEY_PATH) {
    return false;
  }
  // Chave gerada com --ci (sem senha): precisa existir a var, senão o Tauri pede Password:
  if (process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD == null) {
    process.env.TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "";
  }
  return true;
}

function syncPubkeyFromPubFile(tauriConf, keyPath) {
  const pubPath = `${keyPath}.pub`;
  if (!fs.existsSync(pubPath)) return false;
  const pub = fs.readFileSync(pubPath, "utf8").trim();
  if (!pub) return false;
  const data = JSON.parse(fs.readFileSync(tauriConf, "utf8"));
  if (!data.plugins) data.plugins = {};
  if (!data.plugins.updater) data.plugins.updater = {};
  data.plugins.updater.pubkey = pub;
  fs.writeFileSync(tauriConf, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`pubkey sincronizada de ${pubPath}`);
  return true;
}

function configureSigning(tauriConf, hasPrivateKey) {
  const data = JSON.parse(fs.readFileSync(tauriConf, "utf8"));
  const pubkey = data?.plugins?.updater?.pubkey || "";
  const isPlaceholder = !pubkey || pubkey === PLACEHOLDER_PUBKEY;

  if (hasPrivateKey && !isPlaceholder) {
    data.bundle = data.bundle || {};
    data.bundle.createUpdaterArtifacts = true;
    fs.writeFileSync(tauriConf, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    return { signed: true };
  }

  // Sem chave: gera só o .exe (sem .nsis.zip/.sig) — senão o tauri build aborta
  data.bundle = data.bundle || {};
  data.bundle.createUpdaterArtifacts = false;
  if (data.plugins?.updater && isPlaceholder) {
    data.plugins.updater.pubkey = "";
  }
  fs.writeFileSync(tauriConf, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return { signed: false };
}

async function main() {
  loadEnvFiles();

  const pkgPath = path.join(FRONT_ROOT, "package.json");
  const tauriConf = path.join(FRONT_ROOT, "src-tauri", "tauri.conf.json");
  const cargoToml = path.join(FRONT_ROOT, "src-tauri", "Cargo.toml");
  const current = JSON.parse(fs.readFileSync(pkgPath, "utf8")).version;

  const argVer = process.argv[2]?.trim();
  let version = process.env.RELEASE_VERSION?.trim() || argVer || "";
  if (!version) {
    version = bumpPatch(current);
    await askEnter(`Versão atual ${current} → ${version}. Enter para confirmar (ou Ctrl+C)... `);
  }

  const apiUrl = process.env.VITE_API_URL || "(não definido)";
  const releasesUrl = process.env.RELEASES_URL || "https://gaspassapp.com.br/releases/";
  console.log(`Release GasPass PDV ${version}`);
  console.log(`VITE_API_URL=${apiUrl}`);
  console.log(`RELEASES_URL=${releasesUrl}`);
  process.env.RELEASES_URL = releasesUrl;

  setJsonVersion(pkgPath, version);
  setJsonVersion(tauriConf, version);
  setCargoVersion(cargoToml, version);

  const keyPath = defaultKeyPath();
  let hasKey = loadPrivateKey(keyPath);
  if (hasKey) {
    syncPubkeyFromPubFile(tauriConf, keyPath);
  }

  const { signed } = configureSigning(tauriConf, hasKey);
  if (!signed) {
    console.warn(`
AVISO: sem chave de assinatura — o build gera só o instalador (.exe).
Auto-update NÃO funciona até existir a chave em:
  front/src-tauri/signing/gaspass-pdv.key
(ou %USERPROFILE%\\.tauri\\gaspass-pdv.key)

Gerar:
  npx tauri signer generate -w src-tauri/signing/gaspass-pdv.key --ci
  npm run build:release
`);
  } else {
    console.log("Assinatura updater: OK");
  }

  run("npm", ["run", "tauri", "--", "build"]);
  run("node", ["scripts/copy-tauri-to-releases.mjs"], {
    env: {
      ...process.env,
      RELEASE_VERSION: version,
      RELEASE_ALLOW_UNSIGNED: signed ? "0" : "1"
    }
  });

  console.log("Release concluído.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
