import { useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import Button from "../../componentes/ui/Button";
import Card from "../../componentes/ui/Card";
import { montarUrlApi } from "../../configuracao/apiConfig";
import { APP_VERSION } from "../../configuracao/appVersion";
import { toastErro } from "../../servicos/toastServico";

function fmtData(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("pt-BR");
}

/**
 * Downloads manuais do GasPass PDV (mesmo latest.json do updater).
 */
export default function SuperAdminDownloadsSecao() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const url = montarUrlApi("/releases/latest.json");
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      setDados(json);
    } catch (err) {
      setDados(null);
      toastErro(err.message || "Falha ao carregar releases.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  const win = dados?.platforms?.["windows-x86_64"];
  const downloadUrl = dados?.installer_url || win?.url || "";

  return (
    <div className="gp-admin-downloads">
      <p className="rede-detalhes__ajuda" style={{ marginBottom: 16 }}>
        Pacotes do <strong>GasPass PDV</strong> publicados em <code>/releases</code>. Versão do painel web
        atual: <strong>{APP_VERSION}</strong>.
      </p>

      <Card padding>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ margin: "0 0 8px" }}>Última versão (Windows)</h3>
            {carregando ? (
              <p>Carregando…</p>
            ) : dados ? (
              <>
                <p style={{ margin: "0 0 4px" }}>
                  Versão: <strong>{dados.version || "—"}</strong>
                </p>
                <p style={{ margin: "0 0 4px", color: "#64748b", fontSize: 14 }}>
                  Publicada em: {fmtData(dados.pub_date)}
                </p>
                {dados.notes ? (
                  <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap", fontSize: 14 }}>{dados.notes}</p>
                ) : null}
              </>
            ) : (
              <p>Nenhum release publicado ainda. Rode <code>npm run build:release</code> no front.</p>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Button type="button" variant="outline" icon={RefreshCw} onClick={carregar} disabled={carregando}>
              Atualizar
            </Button>
            {downloadUrl ? (
              <Button
                type="button"
                variant="primary"
                icon={Download}
                onClick={() => window.open(downloadUrl, "_blank", "noopener,noreferrer")}
              >
                Baixar instalador
              </Button>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
