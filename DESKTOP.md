# GasPass PDV (Tauri)

Aplicativo desktop Windows para frentistas, sobre o mesmo React do painel web.

## Pré-requisitos

- Node.js, Rust (`rustup`), WebView2, Visual Studio Build Tools (C++)

## Comandos

```bash
# Web (inalterado)
npm run dev
npm run build

# Desktop
npm run desktop:dev      # Tauri + Vite mode desktop
npm run desktop:build    # gera instalador NSIS
npm run build:release    # bump versão + build assinado + copia para servidor-go/releases
# ou
npm run build:release -- 0.1.5
```

- Dev: [`.env.desktop`](.env.desktop) → `http://localhost:8080`
- Release: [`.env.production`](.env.production) → `https://gaspassapp.com.br` (o `build:release` sobrescreve a API)

Identifier: `br.com.gaspass.pdv`.

## Auto-update

### 1. Chaves de assinatura

Ficam em `src-tauri/signing/` (versionadas neste repo privado):

- `gaspass-pdv.key` / `gaspass-pdv.key.pub`
- A pubkey também está em `tauri.conf.json` (obrigatório no app instalado)

```bash
# só se ainda não existirem
npx tauri signer generate -w src-tauri/signing/gaspass-pdv.key --ci
```

### 2. Build de release

```bash
cd front
npm run build:release
```

Isso:

1. Incrementa o patch (ou usa a versão passada)
2. Alinha versão em `package.json`, `tauri.conf.json`, `Cargo.toml`
3. Roda `tauri build` com `createUpdaterArtifacts`
4. Copia `.nsis.zip` + `.sig` para `servidor-go/releases/`
5. Atualiza `servidor-go/releases/latest.json` se `RELEASES_URL` for absoluto (padrão: `https://gaspassapp.com.br/releases/`)

### 3. Deploy

Envie a pasta `servidor-go/releases/` junto com a API (ou defina `RELEASES_DIR`). O Go serve:

- `GET /releases/latest.json`
- `GET /releases/*.nsis.zip`

O app instalado consulta o endpoint fixo em `tauri.conf.json` (`plugins.updater.endpoints`). Trocar o domínio exige **novo build**.

### 4. No cliente

- Primeira instalação: use o `.exe` NSIS
- Updates seguintes: o PDV baixa o `.nsis.zip` assinado, valida e reinstala (modo passive)

No app: verificação ao entrar + a cada 1 hora; botão no rodapé “Atualizar”.
