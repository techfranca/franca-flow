// Lista de clientes organizados por categoria
export const CLIENTES = {
  "Negócio Local": [
    "LF odontologia",
    "Trevo Barbearia",
    "Cara de Cão",
    "Criato",
    "CN Oftalmologia",
    "BluePack",
    "FeldHaus Cake",
    "Fox GNV",
    "Posto 13",
    "Ethiene",
    "Bistrô de Rua",
    "Ana Moura",
    "Alessandro"
  ],
  "Infoproduto": [
    "Carolina Falcão",
    "Fagori investimento",
    "Gabi Vieira",
    "Guto Engenheiro"
  ],
  "Inside Sales": [
    "Real Parque imóveis",
    "Voe Mais",
    "3Haus"
  ],
  "E-commerce": [
    "Apraioh",
    "Caminho do Surf",
    "Trevo Tabacaria",
    "GPZ",
    "Maré Aquariana"
  ]
};

// Mapeamento de códigos únicos para cada cliente
export const CODIGO_CLIENTE: { [key: string]: { nome: string; categoria: string } } = {
  // Negócio Local
  "lf-odontologia": { nome: "LF odontologia", categoria: "Negócio Local" },
  "trevo-barbearia": { nome: "Trevo Barbearia", categoria: "Negócio Local" },
  "cara-de-cao": { nome: "Cara de Cão", categoria: "Negócio Local" },
  "criato": { nome: "Criato", categoria: "Negócio Local" },
  "cn-oftalmologia": { nome: "CN Oftalmologia", categoria: "Negócio Local" },
  "bluepack": { nome: "BluePack", categoria: "Negócio Local" },
  "feldhaus-cake": { nome: "FeldHaus Cake", categoria: "Negócio Local" },
  "fox-gnv": { nome: "Fox GNV", categoria: "Negócio Local" },
  "posto-13": { nome: "Posto 13", categoria: "Negócio Local" },
  "ethiene": { nome: "Ethiene", categoria: "Negócio Local" },
  "bistro-de-rua": { nome: "Bistrô de Rua", categoria: "Negócio Local" },
  "ana-moura": { nome: "Ana Moura", categoria: "Negócio Local" },
  "alessandro": { nome: "Alessandro", categoria: "Negócio Local" },
  
  // Infoproduto
  "carolina-falcao": { nome: "Carolina Falcão", categoria: "Infoproduto" },
  "fagori-investimento": { nome: "Fagori investimento", categoria: "Infoproduto" },
  "gabi-vieira": { nome: "Gabi Vieira", categoria: "Infoproduto" },
  "guto-engenheiro": { nome: "Guto Engenheiro", categoria: "Infoproduto" },
  
  // Inside Sales
  "real-parque-imoveis": { nome: "Real Parque imóveis", categoria: "Inside Sales" },
  "voe-mais": { nome: "Voe Mais", categoria: "Inside Sales" },
  "3haus": { nome: "3Haus", categoria: "Inside Sales" },
  
  // E-commerce
  "apraioh": { nome: "Apraioh", categoria: "E-commerce" },
  "caminho-do-surf": { nome: "Caminho do Surf", categoria: "E-commerce" },
  "trevo-tabacaria": { nome: "Trevo Tabacaria", categoria: "E-commerce" },
  "gpz": { nome: "GPZ", categoria: "E-commerce" },
  "mare-aquariana": { nome: "Maré Aquariana", categoria: "E-commerce" },
};

export const CATEGORIAS = Object.keys(CLIENTES);

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

export function getClientePorCodigo(codigo: string): { nome: string; categoria: string } | null {
  return CODIGO_CLIENTE[codigo] || null;
}
