import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { clienteNome, categoria, tipo, quantidade, driveLink } = await request.json()

    const token = process.env.UAIZAP_TOKEN
    const groupId = process.env.UAIZAP_GROUP_ID

    if (!token || !groupId) {
      console.warn('⚠️ UAIZAP env não configurado')
      return NextResponse.json({ success: true }) // Não falha
    }

    const dataHoraBrasil = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      dateStyle: 'short',
      timeStyle: 'short',
    })

    const res = await fetch('https://francaassessoria.uazapi.com/send/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: token,
      },
      body: JSON.stringify({
        number: groupId,
        text: `📥 *Novo upload recebido!*

👤 Cliente: ${clienteNome}
📂 Categoria: ${categoria}
📁 Tipo: ${tipo}
📎 Arquivos: ${quantidade}
${driveLink ? `📂 Pasta no Drive:\n${driveLink}` : ''}
🕒 Data: ${dataHoraBrasil}`,
      }),
    })

    if (!res.ok) {
      console.error('❌ Erro UAIZAP:', res.status)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Falha na notificação:', error)
    return NextResponse.json({ success: true }) // Não falha o upload
  }
}