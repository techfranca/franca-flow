export async function notificarTime({
  clienteNome,
  categoria,
  tipo,
  quantidade,
  driveLink, // Adiciona o driveLink aqui
}: {
  clienteNome: string
  categoria: string
  tipo: string
  quantidade: number
  driveLink?: string
}) {
  const token = process.env.UAIZAP_TOKEN
  const groupId = process.env.UAIZAP_GROUP_ID

  // Validação das variáveis de ambiente
  if (!token || !groupId) {
    console.warn('⚠️ UAIZAP env não configurado corretamente')
    return
  }

  // Data/hora correta do Brasil (São Paulo)
  const dataHoraBrasil = new Date().toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'short',
    timeStyle: 'short',
  })

  try {
    const res = await fetch(
      'https://francaassessoria.uazapi.com/send/text',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          token: token, // 🔑 UAIZAP usa token nesse header
        },
        body: JSON.stringify({
          number: groupId, // ID do grupo (@g.us)
          text: `📥 *Novo upload recebido!*

👤 Cliente: ${clienteNome}
📂 Categoria: ${categoria}
📁 Tipo: ${tipo}
📎 Arquivos: ${quantidade}
${driveLink ? `📂 Pasta no Drive:\n${driveLink}` : ""}
🕒 Data: ${dataHoraBrasil}`,
        }),
      }
    )

    // Log de erro caso a API não responda OK
    if (!res.ok) {
      const error = await res.text()
      console.error('❌ Erro UAIZAP:', res.status, error)
    }
  } catch (error) {
    console.error('❌ Falha ao enviar notificação UAIZAP:', error)
  }
}
