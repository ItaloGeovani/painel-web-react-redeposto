import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONT_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(FRONT_ROOT, "..");
const RELEASES_DIR = path.resolve(REPO_ROOT, "servidor-go", "releases");
const NSIS_DIR = path.resolve(FRONT_ROOT, "src-tauri", "target", "release", "bundle", "nsis");

const DEFAULT_RELEASES_URL = "https://gaspassapp.com.br/releases/";

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

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function findNsisZip(version) {
  if (!fs.existsSync(NSIS_DIR)) {
    throw new Error(`Pasta NSIS não encontrada: ${NSIS_DIR}`);
  }
  const files = fs.readdirSync(NSIS_DIR);
  const zipName = files.find(
    (f) =>
      f.toLowerCase().endsWith(".nsis.zip") &&
      !f.toLowerCase().endsWith(".nsis.zip.sig") &&
      f.includes(version)
  );
  if (!zipName) return null;
  const zipPath = path.join(NSIS_DIR, zipName);
  const sigPath = `${zipPath}.sig`;
  if (!fs.existsSync(sigPath)) return null;
  return { zipName, zipPath, sigPath };
}

function copyInstallerExe() {
  if (!fs.existsSync(NSIS_DIR)) return null;
  const exeName = fs
    .readdirSync(NSIS_DIR)
    .find((f) => f.toLowerCase().endsWith(".exe") && f.toLowerCase().includes("setup"));
  if (!exeName) return null;
  const installerName = "GasPass-PDV-Setup.exe";
  const destExe = path.join(RELEASES_DIR, installerName);
  fs.copyFileSync(path.join(NSIS_DIR, exeName), destExe);
  console.log(`Copiado: ${destExe} (de ${exeName})`);
  return installerName;
}

function main() {
  loadEnvFiles();
  const version =
    process.env.RELEASE_VERSION ||
    JSON.parse(fs.readFileSync(path.join(FRONT_ROOT, "package.json"), "utf8")).version;
  const allowUnsigned = process.env.RELEASE_ALLOW_UNSIGNED === "1";

  ensureDir(RELEASES_DIR);

  const zip = findNsisZip(version);
  const installerName = copyInstallerExe();

  if (!zip && !installerName) {
    throw new Error(`Nenhum artefacto NSIS em ${NSIS_DIR}`);
  }

  if (!zip && !allowUnsigned) {
    throw new Error(
      `Não achei .nsis.zip/.sig da versão ${version}. Gere as chaves e rode npm run build:release de novo.`
    );
  }

  if (zip) {
    const destZip = path.join(RELEASES_DIR, zip.zipName);
    const destSig = path.join(RELEASES_DIR, `${zip.zipName}.sig`);
    fs.copyFileSync(zip.zipPath, destZip);
    fs.copyFileSync(zip.sigPath, destSig);
    console.log(`Copiado: ${destZip}`);
    console.log(`Copiado: ${destSig}`);
  } else {
    console.warn("Sem .nsis.zip/.sig — latest.json sem artefacto de auto-update.");
  }

  const releasesUrl = String(process.env.RELEASES_URL || DEFAULT_RELEASES_URL).trim();
  if (!/^https?:\/\//i.test(releasesUrl)) {
    console.warn("RELEASES_URL não é absoluto — latest.json NÃO foi atualizado.");
    return;
  }

  const base = releasesUrl.endsWith("/") ? releasesUrl : `${releasesUrl}/`;
  const latestPath = path.join(RELEASES_DIR, "latest.json");
  let existing = {};
  if (fs.existsSync(latestPath)) {
    try {
      existing = JSON.parse(fs.readFileSync(latestPath, "utf8"));
    } catch {
      existing = {};
    }
  }

  const platforms = { ...(existing.platforms || {}) };
  if (zip) {
    platforms["windows-x86_64"] = {
      signature: fs.readFileSync(zip.sigPath, "utf8").trim(),
      url: `${base}${zip.zipName}`
    };
  }

  const latest = {
    version,
    notes: zip
      ? `GasPass PDV ${version}`
      : `GasPass PDV ${version} (instalador manual — auto-update pendente de chave)`,
    pub_date: new Date().toISOString(),
    platforms,
    ...(installerName ? { installer_url: `${base}${installerName}` } : {})
  };

  fs.writeFileSync(latestPath, `${JSON.stringify(latest, null, 2)}\n`, "utf8");
  console.log(`Atualizado: ${latestPath}`);
  if (zip) console.log(`Updater URL: ${base}${zip.zipName}`);
  if (installerName) console.log(`Installer URL: ${base}${installerName}`);
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
