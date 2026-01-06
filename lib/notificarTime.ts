export async function notificarTime({
  clienteNome,
  categoria,
  tipo,
  quantidade,
  driveLink,
  descricao, // 🆕 Adicionei aqui
}: {
  clienteNome: string
  categoria: string
  tipo: string
  quantidade: number
  driveLink?: string
  descricao?: string // 🆕 Adicionei a tipagem (opcional)
}) {
  const token = process.env.UAIZAP_TOKEN
  const groupId = process.env.UAIZAP_GROUP_ID

  if (!token || !groupId) {
    console.warn('⚠️ UAIZAP env não configurado corretamente')
    return
  }

  const dataHoraBrasil = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  })

  // 🆕 Lógica para montar a mensagem com a descrição
  let mensagem = `📥 *Novo upload recebido!*

👤 Cliente: ${clienteNome}
📂 Categoria: ${categoria}
📁 Tipo: ${tipo}
📎 Arquivos: ${quantidade}`

  // Se tiver descrição, adiciona
  if (descricao && descricao.trim()) {
    mensagem += `\n📝 Descrição: ${descricao.trim()}`
  }

  // Se tiver link do drive, adiciona
  if (driveLink) {
    mensagem += `\n📂 Pasta no Drive:\n${driveLink}`
  }

  mensagem += `\n🕒 Data: ${dataHoraBrasil}`

  try {
    const res = await fetch(
      'https://francaassessoria.uazapi.com/send/text',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token,
        },
        body: JSON.stringify({
          number: groupId,
          text: mensagem, // Usa a variável mensagem montada acima
        }),
      }
    )

    if (!res.ok) {
      const error = await res.text()
      console.error('❌ Erro UAIZAP:', res.status, error)
    }
  } catch (error) {
    console.error('❌ Falha ao enviar notificação UAIZAP:', error)
  }
}