import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONT_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(FRONT_ROOT, "..");
const RELEASES_DIR = path.resolve(REPO_ROOT, "servidor-go", "releases");
const NSIS_DIR = path.resolve(FRONT_ROOT, "src-tauri", "target", "release", "bundle", "nsis");

const DEFAULT_RELEASES_URL = "https://gaspassapp.com.br/releases/";
const STABLE_INSTALLER = "GasPass-PDV-Setup.exe";

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

function listNsis() {
  if (!fs.existsSync(NSIS_DIR)) {
    throw new Error(`Pasta NSIS não encontrada: ${NSIS_DIR}`);
  }
  return fs.readdirSync(NSIS_DIR);
}

/** Prefer artefactos da versão pedida (evita copiar 0.1.1 antigo). */
function findUpdaterPackage(version) {
  const files = listNsis();

  const zipName = files.find(
    (f) =>
      f.includes(version) &&
      f.toLowerCase().endsWith(".nsis.zip") &&
      !f.toLowerCase().endsWith(".sig")
  );
  if (zipName) {
    const zipPath = path.join(NSIS_DIR, zipName);
    const sigPath = `${zipPath}.sig`;
    if (fs.existsSync(sigPath)) {
      return { kind: "zip", fileName: zipName, filePath: zipPath, sigPath };
    }
  }

  const exeName = files.find(
    (f) =>
      f.includes(version) &&
      f.toLowerCase().endsWith("-setup.exe") &&
      !f.toLowerCase().endsWith(".sig")
  );
  if (exeName) {
    const exePath = path.join(NSIS_DIR, exeName);
    const sigPath = `${exePath}.sig`;
    if (fs.existsSync(sigPath)) {
      return { kind: "exe", fileName: exeName, filePath: exePath, sigPath };
    }
    return { kind: "exe-unsigned", fileName: exeName, filePath: exePath, sigPath: null };
  }

  return null;
}

function main() {
  loadEnvFiles();
  const version =
    process.env.RELEASE_VERSION ||
    JSON.parse(fs.readFileSync(path.join(FRONT_ROOT, "package.json"), "utf8")).version;
  const allowUnsigned = process.env.RELEASE_ALLOW_UNSIGNED === "1";

  ensureDir(RELEASES_DIR);

  const pkg = findUpdaterPackage(version);
  if (!pkg) {
    throw new Error(
      `Não achei instalador da versão ${version} em ${NSIS_DIR}. Arquivos: ${listNsis().join(", ") || "(vazio)"}`
    );
  }

  if (!pkg.sigPath && !allowUnsigned) {
    throw new Error(
      `Instalador ${pkg.fileName} sem .sig. Assinatura updater incompleta.`
    );
  }

  // Copia artefacto versionado + instalador estável
  const destPkg = path.join(RELEASES_DIR, pkg.fileName);
  fs.copyFileSync(pkg.filePath, destPkg);
  console.log(`Copiado: ${destPkg}`);

  const destStable = path.join(RELEASES_DIR, STABLE_INSTALLER);
  fs.copyFileSync(pkg.filePath, destStable);
  console.log(`Copiado: ${destStable} (de ${pkg.fileName})`);

  if (pkg.sigPath) {
    const destSig = path.join(RELEASES_DIR, `${pkg.fileName}.sig`);
    fs.copyFileSync(pkg.sigPath, destSig);
    console.log(`Copiado: ${destSig}`);
  }

  const releasesUrl = String(process.env.RELEASES_URL || DEFAULT_RELEASES_URL).trim();
  if (!/^https?:\/\//i.test(releasesUrl)) {
    console.warn("RELEASES_URL não é absoluto — latest.json NÃO foi atualizado.");
    return;
  }

  const base = releasesUrl.endsWith("/") ? releasesUrl : `${releasesUrl}/`;
  const latestPath = path.join(RELEASES_DIR, "latest.json");

  const platforms = {};
  if (pkg.sigPath) {
    // Mesmo conteúdo do .exe assinado — URL estável, sem espaço no nome
    platforms["windows-x86_64"] = {
      signature: fs.readFileSync(pkg.sigPath, "utf8").trim(),
      url: `${base}${STABLE_INSTALLER}`
    };
  }

  const latest = {
    version,
    notes: pkg.sigPath
      ? `GasPass PDV ${version}`
      : `GasPass PDV ${version} (instalador manual — sem assinatura updater)`,
    pub_date: new Date().toISOString(),
    platforms,
    installer_url: `${base}${STABLE_INSTALLER}`
  };

  fs.writeFileSync(latestPath, `${JSON.stringify(latest, null, 2)}\n`, "utf8");
  console.log(`Atualizado: ${latestPath}`);
  if (pkg.sigPath) console.log(`Updater URL: ${platforms["windows-x86_64"].url}`);
  console.log(`Installer URL: ${latest.installer_url}`);
}

try {
  main();
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
