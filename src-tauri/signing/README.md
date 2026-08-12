# Chaves de assinatura do GasPass PDV (Tauri updater)

- `gaspass-pdv.key` — privada (assina releases). Não perca.
- `gaspass-pdv.key.pub` — pública (também fica em `tauri.conf.json`).

O `npm run build:release` lê a privada desta pasta primeiro.
Em repo privado/só seu, versionar aqui evita perder após formatar o PC.
