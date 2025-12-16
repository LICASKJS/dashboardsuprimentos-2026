export type LeadTimeSummary = {
  year: number
  month: number
  leadTimePorComprador: { comprador: string; leadTimeMedioDias: number }[]
  gastoPorCompradorMes: { comprador: string; valor: number }[]
  pcsEmitidosMes: number
  itensPorComprador: { comprador: string; itens: number }[]
  mapasEmAprovacao: { comprador: string; mapas: number }[]
  pcsEmAprovacao: { comprador: string; pcs: number }[]
}

export type ProcessosSummary = {
  year: number
  month?: number
  pedidosRetroativos: number
  topFornecedoresValor: { fornecedor: string; valor: number }[]
  topItensValor: { item: string; valor: number }[]
  tipoFrete: { tipo: string; quantidade: number }[]
  demandasPorItem: { item: string; quantidade: number }[]
  condicaoPagamento: { condicao: string; quantidade: number }[]
}
