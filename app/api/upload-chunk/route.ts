import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

// IMPORTANTE: Configuração para aceitar body grande
export const config = {
  api: {
    bodyParser: false, // Desabilita parser padrão
    responseLimit: false,
  },
}

export async function PUT(request: NextRequest) {
  try {
    const uploadUrl = request.headers.get('x-upload-url')
    const contentRange = request.headers.get('content-range')
    
    if (!uploadUrl || !contentRange) {
      return NextResponse.json(
        { error: 'Headers obrigatórios faltando' },
        { status: 400 }
      )
    }

    // Lê o chunk do stream
    const chunk = await request.arrayBuffer()

    // Envia o chunk para o Google Drive
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': contentRange,
        'Content-Length': chunk.byteLength.toString(),
      },
      body: chunk,
    })

    // Retorna os headers importantes
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const range = response.headers.get('Range')
    if (range) {
      headers['Range'] = range
    }

    return new NextResponse(
      JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        range: range,
      }),
      {
        status: response.status,
        headers,
      }
    )
  } catch (error: any) {
    console.error('Erro no proxy de upload:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}