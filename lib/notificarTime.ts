export async function notificarTime({
  clienteNome,
  categoria,
  tipo,
  quantidade,
}: {
  clienteNome: string
  categoria: string
  tipo: string
  quantidade: number
}) {
  const token = process.env.UAIZAP_TOKEN
  const groupId = process.env.UAIZAP_GROUP_ID

  if (!token || !groupId) {
    console.warn('UAIZAP env não configurado corretamente')
    return
  }

  const res = await fetch(
    'https://francaassessoria.uazapi.com/send/text',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        token: token, // 🔥 AQUI está a correção
      },
      body: JSON.stringify({
        number: groupId,
        text: `📥 *Novo upload recebido!*

👤 Cliente: ${clienteNome}
📂 Categoria: ${categoria}
📁 Tipo: ${tipo}
📎 Arquivos: ${quantidade}
🕒 Data: ${new Date().toLocaleString('pt-BR')}`,
      }),
    }
  )

  if (!res.ok) {
    const error = await res.text()
    console.error('Erro UAIZAP:', res.status, error)
  }
}
