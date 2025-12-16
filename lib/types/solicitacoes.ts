export type SolicitacaoItem = {
  situacaoItem?: string
  statusNecessidade?: string
  codigoSolicitacao?: string
  sequencialItem?: number
  codigoItem?: string
  descricaoItem?: string
  especificacao?: string
  motivo?: string
  quantidadeSolicitada?: number
  codigoCotacao?: string
  usuarioAlteracao?: string
  dataAlteracao?: string
  dataEmissao?: string
  dataInclusao?: string
  dataNecessidade?: string
  unidade?: string
  usuarioSolicitante?: string
  nomeComprador?: string
  codigoContrato?: string
  filial?: string
  nomeFilial?: string
}

export type SolicitacaoItemWithSla = SolicitacaoItem & {
  dias: number
}

export type BuyerYearSummary = {
  year: number
  month?: number
  totalItens: number
  totalSolicitacoes: number
  totalCompradores: number
  totalFiliais: number
  itensPorFilial: { filial: string; itens: number }[]
  itensPorComprador: { comprador: string; itens: number }[]
  solicitacoesPorComprador: { comprador: string; solicitacoes: number }[]
  volumeSolicitacoesPorMes: { mes: number; solicitacoes: number }[]
  volumeItensPorMes: { mes: number; itens: number }[]
}
