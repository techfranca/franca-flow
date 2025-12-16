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
    if (!confirm(`Tem certeza que deseja remover "${nome}"?`)) return

    try {
      const response = await fetch('/api/admin/clientes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (response.ok) {
        await carregarClientes()
      }
    } catch (err) {
      alert('Erro ao remover cliente')
    }
  }

  const copiarLink = (codigo: string) => {
    const link = `${window.location.origin}/?c=${codigo}`
    navigator.clipboard.writeText(link)
    
    // Feedback visual
    const btn = document.getElementById(`copy-${codigo}`)
    if (btn) {
      const originalText = btn.innerHTML
      btn.innerHTML = '✓ Copiado!'
      setTimeout(() => {
        btn.innerHTML = originalText
      }, 2000)
    }
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
    <div className="min-h-screen bg-gradient-to-br from-franca-green via-white to-franca-green-dark px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="glass-effect rounded-3xl shadow-franca-lg p-8 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-franca-green to-franca-green-dark rounded-xl flex items-center justify-center shadow-franca">
                  <Image src="/logo.png" alt="Franca Logo" width={30} height={30} />
                </div>
                <h1 className="text-3xl font-bold text-franca-blue">
                  PAINEL ADMIN
                </h1>
              </div>
              <p className="text-gray-600 text-sm">
                Gerenciamento de clientes • {clientes.length} cadastrados
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-franca-green transition-all text-franca-blue font-semibold"
            >
              🧪 Testar Upload
            </button>
          </div>
        </div>

        {/* Ações principais */}
        <div className="glass-effect rounded-3xl shadow-franca-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex-1 min-w-[200px] bg-gradient-to-r from-franca-green to-franca-green-dark hover:from-franca-green-dark hover:to-franca-green text-franca-blue font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-franca hover:shadow-franca-lg"
            >
              {showAddForm ? '✕ Cancelar' : '+ Adicionar Cliente'}
            </button>
          </div>

          {/* Formulário de adicionar */}
          {showAddForm && (
            <form onSubmit={handleAdicionarCliente} className="mt-6 space-y-4 bg-white p-6 rounded-xl border-2 border-franca-green border-opacity-20">
              <h3 className="text-xl font-bold text-franca-blue mb-4">
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
        <div className="glass-effect rounded-3xl shadow-franca-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <input
                type="text"
                placeholder="🔍 Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-franca-green focus:ring-4 focus:ring-franca-green focus:ring-opacity-10 outline-none transition-all text-franca-blue"
              />
            </div>
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-franca-green outline-none transition-all text-franca-blue font-medium"
            >
              <option value="all">Todas Categorias</option>
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Lista de clientes */}
        <div className="glass-effect rounded-3xl shadow-franca-lg p-6">
          <h2 className="text-2xl font-bold text-franca-blue mb-6">
            📋 Clientes ({clientesFiltrados.length})
          </h2>

          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm || selectedCategoria !== 'all' 
                  ? 'Nenhum cliente encontrado com esses filtros'
                  : 'Nenhum cliente cadastrado ainda'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {clientesFiltrados.map((cliente) => (
                <div
                  key={cliente.id}
                  className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:border-franca-green transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-franca-blue mb-1">
                        {cliente.nome}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        📂 {cliente.categoria}
                      </p>
                      <div className="bg-gray-50 px-3 py-2 rounded-lg inline-flex items-center gap-2">
                        <span className="text-xs text-gray-500">Link:</span>
                        <code className="text-sm font-mono text-franca-blue">
                          {window.location.origin}/?c={cliente.codigo}
                        </code>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        id={`copy-${cliente.codigo}`}
                        onClick={() => copiarLink(cliente.codigo)}
                        className="px-4 py-2 bg-franca-green hover:bg-franca-green-dark text-franca-blue font-semibold rounded-lg transition-all text-sm"
                        title="Copiar link"
                      >
                        📋 Copiar
                      </button>
                      <button
                        onClick={() => handleRemoverCliente(cliente.id, cliente.nome)}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg transition-all text-sm"
                        title="Remover cliente"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}