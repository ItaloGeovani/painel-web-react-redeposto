import { apiFetch } from "./apiFetch";

export async function obterResumoDashboardAdmin() {
  const dados = await apiFetch("/v1/admin/dashboard/resumo", {
    method: "GET"
  });
  return dados?.resumo || null;
}
