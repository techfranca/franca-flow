import { NextRequest, NextResponse } from 'next/server';

// ⚠️ REMOVIDO O `export const config` (deprecated no App Router)

export async function PUT(request: NextRequest) {
  try {
    const uploadUrl = request.headers.get('X-Upload-Url');
    const contentRange = request.headers.get('Content-Range');

    if (!uploadUrl) {
      return NextResponse.json(
        { error: 'URL de upload não fornecida' },
        { status: 400 }
      );
    }

    // Pega o body como blob (suporta arquivos grandes)
    const body = await request.blob();

    // Faz proxy do upload para o Google Drive
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Range': contentRange || '',
        'Content-Type': 'application/octet-stream',
      },
      body: body,
    });

    // Pega informações da resposta
    const range = response.headers.get('Range');
    const status = response.status;

    // Retorna o status para o cliente
    return NextResponse.json({
      status,
      range,
    }, { status });

  } catch (error: any) {
    console.error('Erro no proxy de upload:', error);
    return NextResponse.json(
      { error: 'Erro no upload', details: error.message },
      { status: 500 }
    );
  }
}

// 🔥 Configuração correta para App Router (se precisar aumentar limite)
export const runtime = 'nodejs'; // ou 'edge'
export const maxDuration = 60; // segundos (só funciona em planos pagos da Vercel)