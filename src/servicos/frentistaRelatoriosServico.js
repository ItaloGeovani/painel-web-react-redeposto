import { apiFetch } from "./apiFetch";

/**
 * Relatório pessoal do frentista (código + senha no body; não troca a sessão do PC).
 * @param {{ codigo: string, senha: string, periodo?: "hoje" | "7d" }} opts
 */
export async function obterRelatorioBaixasFrentista({ codigo, senha, periodo = "hoje" }) {
  const dados = await apiFetch("/v1/frentista/dev/relatorios/meus", {
    method: "POST",
    body: JSON.stringify({
      operador_codigo: String(codigo || "").trim(),
      operador_senha: String(senha || ""),
      periodo: periodo === "7d" ? "7d" : "hoje"
    })
  });
  return {
    operador: dados?.operador || null,
    periodo: dados?.periodo || null,
    totais: dados?.totais || { qtd: 0, valor: 0 },
    itens: Array.isArray(dados?.itens) ? dados.itens : []
  };
}
