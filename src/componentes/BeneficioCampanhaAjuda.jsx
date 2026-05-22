/**
 * Explicação visível no formulário de campanha (DESCONTO vs CASHBACK).
 */
export default function BeneficioCampanhaAjuda({ tipo }) {
  const cashback = String(tipo || "").toUpperCase() === "CASHBACK";

  if (cashback) {
    return (
      <div className="beneficio-campanha-ajuda beneficio-campanha-ajuda--cashback form-rede__input-span2" role="note">
        <p className="beneficio-campanha-ajuda__titulo">Cashback (crédito na carteira)</p>
        <ul className="beneficio-campanha-ajuda__lista">
          <li>O cliente paga o <strong>valor integral</strong> no PIX.</li>
          <li>Após o pagamento confirmado, o percentual vira <strong>moeda virtual</strong> na carteira.</li>
          <li>Use percentual de <strong>1 a 100</strong> no campo Valor (ex.: 10 = 10% de cashback).</li>
        </ul>
      </div>
    );
  }

  return (
    <div className="beneficio-campanha-ajuda beneficio-campanha-ajuda--desconto form-rede__input-span2" role="note">
      <p className="beneficio-campanha-ajuda__titulo">Desconto (abatimento no PIX)</p>
      <ul className="beneficio-campanha-ajuda__lista">
        <li>O benefício <strong>reduz o valor do PIX</strong> na hora da compra.</li>
        <li>Percentual: informe de <strong>1 a 100</strong> (ex.: 5 = 5% off). Valor fixo: em R$.</li>
        <li>Não credita moeda na carteira — o desconto já aparece no valor a pagar.</li>
      </ul>
    </div>
  );
}
