import { NextRequest, NextResponse } from 'next/server'
import { uploadFilesToDrive } from '@/lib/drive'
import { notificarTime } from '@/lib/notificarTime'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const clienteNome = formData.get('clienteNome') as string
    const categoria = formData.get('categoria') as string
    const tipo = formData.get('tipo') as 'Anúncios' | 'Materiais'

    if (!clienteNome || !categoria || !tipo) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    const files: Array<{
      name: string
      buffer: Buffer
      mimeType: string
    }> = []

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file_') && value instanceof File) {
        const buffer = Buffer.from(await value.arrayBuffer())
        files.push({
          name: value.name,
          buffer,
          mimeType: value.type,
        })
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum arquivo foi enviado' },
        { status: 400 }
      )
    }

    const result = await uploadFilesToDrive({
      clienteNome,
      categoria,
      tipo,
      files,
    })

    if (result.success) {
      // Passar o folderId como parâmetro para o notificarTime
      const driveLink = result.folderId
        ? `https://drive.google.com/drive/folders/${result.folderId}`
        : undefined

      await notificarTime({
        clienteNome,
        categoria,
        tipo,
        quantidade: files.length,
        driveLink, // Passando o link da pasta para a notificação
      })

      return NextResponse.json({
        success: true,
        message: result.message,
      })
    }

    return NextResponse.json(
      { error: result.message },
      { status: 500 }
    )
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
