import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { clienteNome, categoria, tipo, quantidade, descricao, driveLink } = await request.json() // 🆕 descricao

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

    // 🆕 Monta mensagem com descrição
    let mensagem = `📥 *Novo upload recebido!*

👤 Cliente: ${clienteNome}
📂 Categoria: ${categoria}
📁 Tipo: ${tipo}
📎 Arquivos: ${quantidade}`

    // 🆕 Adiciona descrição se fornecida
    if (descricao && descricao.trim()) {
      mensagem += `
📝 Descrição: ${descricao.trim()}`
    }

    // Adiciona link do Drive
    if (driveLink) {
      mensagem += `
📂 Pasta no Drive:
${driveLink}`
    }

    mensagem += `
🕒 Data: ${dataHoraBrasil}`

    const res = await fetch('https://francaassessoria.uazapi.com/send/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: token,
      },
      body: JSON.stringify({
        number: groupId,
        text: mensagem,
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