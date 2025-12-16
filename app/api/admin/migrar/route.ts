import { NextRequest, NextResponse } from 'next/server'
import { migrarClientesAntigos } from '@/lib/kv'

// Aceita POST
export async function POST(request: NextRequest) {
  try {
    const clientes = await migrarClientesAntigos()
    return NextResponse.json({ 
      success: true, 
      message: `${clientes.length} clientes migrados com sucesso!`,
      clientes 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Aceita GET também (para abrir no navegador)
export async function GET(request: NextRequest) {
  try {
    const clientes = await migrarClientesAntigos()
    return NextResponse.json({ 
      success: true, 
      message: `${clientes.length} clientes migrados com sucesso!`,
      clientes 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}