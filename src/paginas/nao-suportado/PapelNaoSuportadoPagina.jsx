import PainelLayout from "../../componentes/layout/PainelLayout";

export default function PapelNaoSuportadoPagina({ sessao, onSair }) {
  return (
    <PainelLayout
      titulo="Painel em construcao"
      subtitulo="Este tipo de usuario ainda nao possui dashboard dedicado."
      usuario={sessao?.usuario}
      itensMenu={["Inicio"]}
      onSair={onSair}
    >
      <div className="card-resumo">
        <h3>Perfil atual</h3>
        <strong>{sessao?.usuario?.papel || "-"}</strong>
        <p>
          Vamos criar dashboards especificos para cada papel usando o mesmo
          padrao de layout.
        </p>
      </div>
    </PainelLayout>
  );
}
