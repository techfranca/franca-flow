import { kv } from '@vercel/kv'

export interface Cliente {
  id: string
  nome: string
  categoria: string
  codigo: string
  criadoEm: string
}

const KV_KEY = 'clientes'

// Buscar todos os clientes
export async function getClientes(): Promise<Cliente[]> {
  try {
    const clientes = await kv.get<Cliente[]>(KV_KEY)
    return clientes || []
  } catch (error) {
    console.error('Erro ao buscar clientes:', error)
    return []
  }
}

// Buscar cliente por código
export async function getClientePorCodigo(codigo: string): Promise<Cliente | null> {
  try {
    const clientes = await getClientes()
    return clientes.find(c => c.codigo === codigo) || null
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return null
  }
}

// Adicionar cliente
export async function adicionarCliente(cliente: Omit<Cliente, 'id' | 'criadoEm'>): Promise<Cliente> {
  const clientes = await getClientes()
  
  // Verifica se código já existe
  if (clientes.some(c => c.codigo === cliente.codigo)) {
    throw new Error('Código já existe')
  }
  
  const novoCliente: Cliente = {
    ...cliente,
    id: Date.now().toString(),
    criadoEm: new Date().toISOString(),
  }
  
  await kv.set(KV_KEY, [...clientes, novoCliente])
  return novoCliente
}

// Remover cliente
export async function removerCliente(id: string): Promise<void> {
  const clientes = await getClientes()
  const novosClientes = clientes.filter(c => c.id !== id)
  await kv.set(KV_KEY, novosClientes)
}

// Migrar clientes antigos do código para KV (executar uma vez)
export async function migrarClientesAntigos() {
  const CLIENTES_ANTIGOS = {
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
  }

  const CODIGOS_ANTIGOS: { [key: string]: string } = {
    "LF odontologia": "lf-odontologia",
    "Trevo Barbearia": "trevo-barbearia",
    "Cara de Cão": "cara-de-cao",
    "Criato": "criato",
    "CN Oftalmologia": "cn-oftalmologia",
    "BluePack": "bluepack",
    "FeldHaus Cake": "feldhaus-cake",
    "Fox GNV": "fox-gnv",
    "Posto 13": "posto-13",
    "Ethiene": "ethiene",
    "Bistrô de Rua": "bistro-de-rua",
    "Ana Moura": "ana-moura",
    "Alessandro": "alessandro",
    "Carolina Falcão": "carolina-falcao",
    "Fagori investimento": "fagori-investimento",
    "Gabi Vieira": "gabi-vieira",
    "Guto Engenheiro": "guto-engenheiro",
    "Real Parque imóveis": "real-parque-imoveis",
    "Voe Mais": "voe-mais",
    "3Haus": "3haus",
    "Apraioh": "apraioh",
    "Caminho do Surf": "caminho-do-surf",
    "Trevo Tabacaria": "trevo-tabacaria",
    "GPZ": "gpz",
    "Maré Aquariana": "mare-aquariana",
  }

  const clientesMigrados: Cliente[] = []
  
  for (const [categoria, nomes] of Object.entries(CLIENTES_ANTIGOS)) {
    for (const nome of nomes) {
      const codigo = CODIGOS_ANTIGOS[nome]
      if (codigo) {
        clientesMigrados.push({
          id: Date.now().toString() + Math.random(),
          nome,
          categoria,
          codigo,
          criadoEm: new Date().toISOString(),
        })
      }
    }
  }

  await kv.set(KV_KEY, clientesMigrados)
  return clientesMigrados
}