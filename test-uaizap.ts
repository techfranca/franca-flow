await fetch('https://francaassessoria.uazapi.com/message/sendText', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer SEU_INSTANCE_TOKEN_AQUI`,
  },
  body: JSON.stringify({
    phone: 'ID_DO_GRUPO@g.us',
    message: '🚨 TESTE: mensagem enviada pelo backend',
  }),
});
