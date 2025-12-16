// Funções utilitárias (mantidas)
export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

export function getMesAtual(): string {
  return MESES[new Date().getMonth()];
}

export function getAnoAtual(): number {
  return new Date().getFullYear();
}

// ============================================
// NOTA: Clientes agora são gerenciados via KV
// Ver: lib/kv.ts
// ============================================

// Mantido apenas como referência/backup
export const CATEGORIAS = ['Negócio Local', 'Infoproduto', 'Inside Sales', 'E-commerce'];

// Esta função ainda existe mas agora usa KV
// A implementação real está em lib/kv.ts
export function getClientePorCodigo(codigo: string): { nome: string; categoria: string } | null {
  // Apenas para compatibilidade - use getClientePorCodigo de lib/kv.ts
  console.warn('Use getClientePorCodigo de lib/kv.ts ao invés desta função');
  return null;
}
``