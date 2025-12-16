'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

interface Cliente {
  id: string
  nome: string
  categoria: string
  codigo: string
  criadoEm: string
}

const CATEGORIAS = ['Negócio Local', 'Infoproduto', 'Inside Sales', 'E-commerce']

// Cores das categorias
const CORES_CATEGORIAS: Record<string, { bg: string; text: string; border: string }> = {
  'E-commerce': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  'Negócio Local': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Infoproduto': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Inside Sales': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
}

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Estados do painel
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nome: string } | null>(null)

  // Form de adicionar
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    categoria: CATEGORIAS[0],
    codigo: '',
  })

  // Verificar autenticação e carregar clientes
  useEffect(() => {
    if (isAuthenticated) {
      carregarClientes()
    }
  }, [isAuthenticated])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        setIsAuthenticated(true)
      } else {
        setError('Senha incorreta')
      }
    } catch (err) {
      setError('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  const carregarClientes = async () => {
    try {
      const response = await fetch('/api/admin/clientes')
      const data = await response.json()
      
      if (data.clientes) {
        setClientes(data.clientes.sort((a: Cliente, b: Cliente) => 
          a.nome.localeCompare(b.nome)
        ))
      }
    } catch (err) {
      console.error('Erro ao carregar clientes:', err)
    }
  }

  const handleAdicionarCliente = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCliente),
      })

      const data = await response.json()

      if (data.success) {
        await carregarClientes()
        setShowAddForm(false)
        setNovoCliente({ nome: '', categoria: CATEGORIAS[0], codigo: '' })
      } else {
        setError(data.error || 'Erro ao adicionar cliente')
      }
    } catch (err) {
      setError('Erro ao adicionar cliente')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoverCliente = async (id: string, nome: string) => {
    try {
      const response = await fetch('/api/admin/clientes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        await carregarClientes()
        setDeleteConfirm(null)
      }
    } catch (err) {
      alert('Erro ao remover cliente')
    }
  }

  const copiarLink = (codigo: string) => {
    const link = `${window.location.origin}/?c=${codigo}`
    navigator.clipboard.writeText(link)
    
    // Feedback visual com toast simples
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-franca-green text-franca-blue px-4 py-3 rounded-lg shadow-lg font-semibold z-50 animate-fade-in'
    toast.innerHTML = '✓ Link copiado!'
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 2000)
  }

  const gerarCodigo = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }

  const clientesFiltrados = clientes.filter(cliente => {
    const matchSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       cliente.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategoria = selectedCategoria === 'all' || cliente.categoria === selectedCategoria
    return matchSearch && matchCategoria
  })

  // Tela de login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-franca-green via-white to-franca-green-dark px-4">
        <div className="glass-effect rounded-3xl shadow-franca-lg max-w-md w-full p-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-franca-green to-franca-green-dark rounded-2xl flex items-center justify-center shadow-franca">
                  <Image src="/logo.png" alt="Franca Logo" width={50} height={50} />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-franca-blue mb-1">
                PAINEL ADMIN
              </h1>
              <p className="text-franca-blue text-sm font-medium">
                Franca Flow - Gerenciamento
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-franca-blue font-semibold mb-2 text-sm">
                Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-franca-green focus:ring-4 focus:ring-franca-green focus:ring-opacity-10 outline-none transition-all text-franca-blue font-medium"
                placeholder="Digite a senha"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-xl">
                <p className="text-red-700 text-sm font-semibold">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-franca-green to-franca-green-dark hover:from-franca-green-dark hover:to-franca-green text-franca-blue font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-franca hover:shadow-franca-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Painel admin
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-franca-green to-franca-green-dark rounded-xl flex items-center justify-center">
                  <Image src="/logo.png" alt="Franca Logo" width={24} height={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-franca-blue">
                    PAINEL ADMIN
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-600">
                      {clientes.length} clientes ativos
                    </span>
                    <span className="text-gray-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500">Sistema online</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-all text-gray-700 font-medium text-sm"
            >
              🧪 Testar Upload
            </button>
          </div>
        </div>

        {/* Ações principais */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto bg-gradient-to-r from-franca-green to-franca-green-dark hover:from-franca-green-dark hover:to-franca-green text-franca-blue font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-sm hover:shadow"
          >
            {showAddForm ? '✕ Cancelar' : '+ Novo Cliente'}
          </button>

          {/* Formulário de adicionar */}
          {showAddForm && (
            <form onSubmit={handleAdicionarCliente} className="mt-6 space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-franca-blue mb-4">
                Novo Cliente
              </h3>

              <div>
                <label className="block text-franca-blue font-semibold mb-2 text-sm">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={novoCliente.nome}
                  onChange={(e) => {
                    const nome = e.target.value
                    setNovoCliente({
                      ...novoCliente,
                      nome,
                      codigo: gerarCodigo(nome),
                    })
                  }}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-franca-green focus:ring-4 focus:ring-franca-green focus:ring-opacity-10 outline-none transition-all text-franca-blue font-medium"
                  placeholder="Ex: Coca-Cola"
                  required
                />
              </div>

              <div>
                <label className="block text-franca-blue font-semibold mb-2 text-sm">
                  Categoria
                </label>
                <select
                  value={novoCliente.categoria}
                  onChange={(e) => setNovoCliente({ ...novoCliente, categoria: e.target.value })}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-franca-green focus:ring-4 focus:ring-franca-green focus:ring-opacity-10 outline-none transition-all text-franca-blue font-medium"
                  required
                >
                  {CATEGORIAS.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-franca-blue font-semibold mb-2 text-sm">
                  Código (gerado automaticamente)
                </label>
                <input
                  type="text"
                  value={novoCliente.codigo}
                  onChange={(e) => setNovoCliente({ ...novoCliente, codigo: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-franca-blue font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Link será: {window.location.origin}/?c={novoCliente.codigo}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-xl">
                  <p className="text-red-700 text-sm font-semibold">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-franca-green hover:bg-franca-green-dark text-franca-blue font-bold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? 'Adicionando...' : 'Adicionar Cliente'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false)
                    setNovoCliente({ nome: '', categoria: CATEGORIAS[0], codigo: '' })
                    setError('')
                  }}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <input
                type="text"
                placeholder="🔍 Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-franca-green focus:ring-2 focus:ring-franca-green focus:ring-opacity-20 outline-none transition-all text-gray-900"
              />
            </div>
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-franca-green focus:ring-2 focus:ring-franca-green focus:ring-opacity-20 outline-none transition-all text-gray-900 font-medium"
            >
              <option value="all">Todas Categorias</option>
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Legenda de cores */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold text-gray-500 mb-2">LEGENDA DE CORES:</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">E-commerce</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Negócio Local</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Infoproduto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Inside Sales</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-franca-blue mb-4 flex items-center gap-2">
            <span>📋</span>
            <span>Clientes ativos</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600 font-normal">{clientesFiltrados.length}</span>
          </h2>

          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm || selectedCategoria !== 'all' 
                  ? 'Nenhum cliente encontrado'
                  : 'Nenhum cliente cadastrado'}
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {clientesFiltrados.map((cliente) => {
                const cores = CORES_CATEGORIAS[cliente.categoria] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' }
                
                return (
                  <div
                    key={cliente.id}
                    className={`group border-2 ${cores.border} ${cores.bg} rounded-lg p-4 hover:shadow-sm transition-all`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${cores.text} truncate`}>
                            {cliente.nome}
                          </h3>
                          <span className={`text-xs px-2 py-0.5 ${cores.bg} ${cores.text} border ${cores.border} rounded-full whitespace-nowrap font-medium`}>
                            {cliente.categoria}
                          </span>
                        </div>
                        <code className="text-xs text-gray-500 font-mono">
                          {window.location.origin}/?c={cliente.codigo}
                        </code>
                      </div>

                      {/* Ações sempre visíveis */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copiarLink(cliente.codigo)}
                          className="p-2 hover:bg-white/50 rounded-lg transition-all text-gray-500 hover:text-gray-700"
                          title="Copiar link"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: cliente.id, nome: cliente.nome })}
                          className="p-2 hover:bg-red-50 rounded-lg transition-all text-gray-400 hover:text-red-600"
                          title="Excluir cliente"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal de confirmação de exclusão */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Excluir cliente
              </h3>
              <p className="text-gray-600 mb-6">
                Tem certeza que deseja excluir <strong>{deleteConfirm.nome}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleRemoverCliente(deleteConfirm.id, deleteConfirm.nome)}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}