import { cpSync, existsSync, mkdirSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const raizFront = join(__dirname, "..");
const dist = join(raizFront, "dist");
const destino = join(raizFront, "..", "servidor-go", "assets");

if (!existsSync(dist)) {
  console.error("Execute npm run build antes (pasta dist/ ausente).");
  process.exit(1);
}

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });
cpSync(dist, destino, { recursive: true });
console.log(`Painel copiado: ${dist} -> ${destino}`);
console.log("Suba o servidor Go a partir de servidor-go/ para servir GET / e /assets/...");
