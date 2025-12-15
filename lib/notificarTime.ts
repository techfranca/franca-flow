export async function notificarTime({
  clienteNome,
  categoria,
  tipo,
  quantidade,
}: {
  clienteNome: string;
  categoria: string;
  tipo: string;
  quantidade: number;
}) {
  if (!process.env.UAIZAP_WEBHOOK_URL) {
    console.warn('UAIZAP_WEBHOOK_URL não configurado');
    return;
  }

  await fetch(process.env.UAIZAP_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.UAIZAP_TOKEN}`,
    },
    body: JSON.stringify({
      message: `📥 *Novo upload recebido!*\n\n👤 Cliente: ${clienteNome}\n📂 Categoria: ${categoria}\n📁 Tipo: ${tipo}\n📎 Arquivos: ${quantidade}\n🕒 Data: ${new Date().toLocaleString('pt-BR')}`,
      groupId: process.env.UAIZAP_GROUP_ID,
    }),
  });
}
