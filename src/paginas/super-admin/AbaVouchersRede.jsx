export default function AbaVouchersRede({ rede }) {
  return (
    <div className="aba-vouchers">
      <p className="rede-detalhes__ajuda">
        Acompanhamento dos vouchers emitidos para clientes da rede <strong>{rede.nome_fantasia}</strong>. A listagem em
        tempo real sera ligada a API quando o modulo de consulta estiver exposto.
      </p>

      <div className="aba-vouchers__lista-vazia" aria-live="polite">
        Nenhuma listagem disponivel ainda. Aqui entrarao colunas como status, combustivel, litros, valor em moeda da
        rede, posto, validade e data de uso — filtradas por esta rede.
      </div>

      <article className="aba-vouchers__doc-card">
        <h3>O que e um voucher?</h3>
        <p>
          No GasPass, o voucher nao e um cupom de desconto solto: e o <strong>comprovante do abastecimento</strong> que o
          cliente gera no app quando vai usar o saldo da carteira na bomba.
        </p>
        <ul>
          <li>
            Concentra o pedido: tipo de combustivel, volume (litros), quanto da <strong>moeda virtual da rede</strong>{" "}
            sera consumido e validade.
          </li>
          <li>
            Vira um <strong>QR Code</strong> para o frentista validar; o servidor confirma rede, assinatura e se ainda
            esta pendente.
          </li>
          <li>
            Ao validar, o voucher passa a <strong>usado</strong> e o debito na carteira e definitivo — nao e reutilizavel.
          </li>
        </ul>
        <p className="aba-vouchers__doc-nota">
          <strong>Carteira</strong> guarda o saldo em moeda da rede; <strong>campanhas</strong> definem promocoes; o{" "}
          <strong>voucher</strong> e o passo em que esse saldo vira abastecimento concreto no posto.
        </p>
      </article>
    </div>
  );
}
