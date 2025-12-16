import { NextRequest, NextResponse } from 'next/server'
import { getClientes, adicionarCliente, removerCliente } from '@/lib/kv'

// Verifica autenticação
function isAuthenticated(request: NextRequest): boolean {
  return request.cookies.get('admin-auth')?.value === 'authenticated'
}

// GET - Listar todos os clientes
export async function GET(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const clientes = await getClientes()
    return NextResponse.json({ clientes })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Adicionar cliente
export async function POST(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { nome, categoria, codigo } = await request.json()

    if (!nome || !categoria || !codigo) {
      return NextResponse.json(
        { error: 'Campos obrigatórios faltando' },
        { status: 400 }
      )
    }

    const cliente = await adicionarCliente({ nome, categoria, codigo })
    return NextResponse.json({ success: true, cliente })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Remover cliente
export async function DELETE(request: NextRequest) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'ID obrigatório' },
        { status: 400 }
      )
    }

    await removerCliente(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}