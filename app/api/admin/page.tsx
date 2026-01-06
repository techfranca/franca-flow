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
const CORES_CATEGORIAS: Record<string, { bg: string; text: string; dot: string }> = {
  'E-commerce': { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Negócio Local': { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Infoproduto': { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  'Inside Sales': { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
}

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Estados do painel
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; nome: string } | null>(null)

  // Form de adicionar
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    categoria: CATEGORIAS[0],
    codigo: '',
  })

  useEffect(() => {
    const session = localStorage.getItem('admin_session')
    if (session === 'true') {
      setIsAuthenticated(true)
    }
  }, [])

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
        localStorage.setItem('admin_session', 'true')
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
        setShowAddModal(false)
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
    
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-4 py-3 rounded-lg shadow-lg font-bold z-[60] flex items-center gap-2'
    toast.innerHTML = '<span>🔗</span> Link copiado!'
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 2000)
  }

  const gerarCodigo = (nome: string) => {
    return nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
  }

  const clientesFiltrados = clientes.filter(cliente => {
    const matchSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        cliente.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategoria = selectedCategoria === 'all' || cliente.categoria === selectedCategoria
    return matchSearch && matchCategoria
  })

  // Tela de Login
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-400 via-white to-emerald-600 px-4">
        <div className="glass-effect bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl max-w-md w-full p-10 border border-white">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
              <Image src="/logo.png" alt="Franca Logo" width={40} height={40} className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Acesso Restrito</h1>
            <p className="text-gray-500 text-sm">Painel Administrativo Franca Flow</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-center text-lg tracking-widest text-slate-800"
              placeholder="••••••••"
              required
            />
            {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded-lg">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? 'Verificando...' : 'Acessar Painel'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Dashboard Principal
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navbar Sticky */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
               <Image src="/logo.png" alt="Logo" width={16} height={16} />
            </div>
            <span className="font-bold text-slate-900 tracking-tight">FRANCA FLOW <span className="text-gray-400 font-normal">| ADMIN</span></span>
          </div>
          <button onClick={() => router.push('/')} className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors flex items-center gap-2">
            <span>Ir para Upload</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Header com Stats e Botão de Ação */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Gerenciar Clientes</h1>
            <p className="text-gray-500 text-sm">Visão geral de todos os parceiros ativos.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-5 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo Cliente
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Ativos</p>
              <p className="text-2xl font-bold text-slate-900">{clientes.length}</p>
           </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 mb-2 flex flex-col md:flex-row gap-2">
           <div className="relative flex-1">
             <svg className="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             <input
               type="text"
               placeholder="Buscar cliente..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2.5 bg-transparent outline-none text-gray-700 placeholder-gray-400"
             />
           </div>
           <div className="h-full w-px bg-gray-200 hidden md:block"></div>
           <select
             value={selectedCategoria}
             onChange={(e) => setSelectedCategoria(e.target.value)}
             className="px-4 py-2.5 bg-transparent outline-none text-gray-600 font-medium cursor-pointer hover:text-emerald-600 transition-colors"
           >
             <option value="all">Todas as Categorias</option>
             {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
           </select>
        </div>

        {/* LEGENDA DE CORES */}
        <div className="flex flex-wrap items-center gap-4 mb-8 px-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Legenda:</span>
            {Object.entries(CORES_CATEGORIAS).map(([cat, style]) => (
                <div key={cat} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`}></span>
                    <span className="text-xs text-gray-600 font-medium">{cat}</span>
                </div>
            ))}
        </div>

        {/* Grid de Clientes */}
        {clientesFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔍</div>
            <p className="text-gray-500 font-medium">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientesFiltrados.map((cliente) => {
              const cores = CORES_CATEGORIAS[cliente.categoria] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' }
              
              return (
                <div key={cliente.id} className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-emerald-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${cores.dot} opacity-50`}></div>

                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${cores.bg} ${cores.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cores.dot}`}></span>
                        {cliente.categoria}
                      </span>
                      
                      {/* BOTÃO DE APAGAR VISÍVEL */}
                      <div className="flex gap-1">
                         <button 
                            onClick={() => setDeleteConfirm({ id: cliente.id, nome: cliente.nome })} 
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Excluir"
                         >
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                         </button>
                      </div>
                    </div>

                    <h3 className="font-bold text-lg text-slate-800 mb-1 truncate" title={cliente.nome}>{cliente.nome}</h3>
                    <code className="text-xs text-gray-400 font-mono block mb-4 truncate">/?c={cliente.codigo}</code>
                  </div>

                  <button
                    onClick={() => copiarLink(cliente.codigo)}
                    className="w-full mt-auto flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all active:scale-[0.98]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    Copiar Link
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* MODAL Adicionar Cliente - SEM ANIMAÇÕES LENTAS */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-900 p-6 text-white">
                <h3 className="text-xl font-bold">Novo Parceiro</h3>
                <p className="text-gray-400 text-sm">Preencha os dados para criar o acesso.</p>
              </div>
              
              <form onSubmit={handleAdicionarCliente} className="p-6 space-y-4">
                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nome</label>
                   <input
                     type="text"
                     value={novoCliente.nome}
                     onChange={(e) => {
                       const nome = e.target.value
                       setNovoCliente({ ...novoCliente, nome, codigo: gerarCodigo(nome) })
                     }}
                     className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-emerald-500 focus:bg-white outline-none transition-all text-slate-800"
                     placeholder="Ex: Coca-Cola"
                     required
                   />
                </div>

                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Categoria</label>
                   <div className="grid grid-cols-2 gap-2 mt-1">
                     {CATEGORIAS.map(cat => (
                       <button
                         key={cat}
                         type="button"
                         onClick={() => setNovoCliente({...novoCliente, categoria: cat})}
                         className={`text-xs py-2 px-2 rounded-lg border transition-all ${novoCliente.categoria === cat ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                       >
                         {cat}
                       </button>
                     ))}
                   </div>
                </div>

                <div>
                   <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Código (URL)</label>
                   <input
                     type="text"
                     value={novoCliente.codigo}
                     onChange={(e) => setNovoCliente({ ...novoCliente, codigo: e.target.value })}
                     className="w-full mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-gray-600"
                     required
                   />
                </div>

                {error && <div className="text-red-500 text-xs bg-red-50 p-2 rounded">{error}</div>}

                <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 text-gray-600 font-semibold hover:bg-gray-50 rounded-lg transition-colors">Cancelar</button>
                  <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-emerald-500 text-white font-bold rounded-lg hover:brightness-105 transition-all disabled:opacity-70">
                    {loading ? 'Criando...' : 'Criar Acesso'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL Confirmação Exclusão - SEM ANIMAÇÕES LENTAS */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
             <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full border border-red-100">
               <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
                 <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
               </div>
               <h3 className="font-bold text-lg text-slate-900">Excluir cliente?</h3>
               <p className="text-gray-500 text-sm mt-1 mb-6">Você está prestes a remover <strong>{deleteConfirm.nome}</strong>. O link de upload deixará de funcionar.</p>
               <div className="flex gap-3">
                 <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 text-gray-600 font-semibold hover:bg-gray-50 rounded-lg">Cancelar</button>
                 <button onClick={() => handleRemoverCliente(deleteConfirm.id, deleteConfirm.nome)} className="flex-1 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 shadow-md">Sim, excluir</button>
               </div>
             </div>
          </div>
        )}

      </div>
    </div>
  )
}