const { google } = require('googleapis');
const credentials = require('./lib/google-credentials.json');

async function autenticarGoogleDrive() {
  const auth = new google.auth.GoogleAuth({
    credentials: credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  
  return google.drive({ version: 'v3', auth });
}

async function adicionarPermissao(folderId, email) {
  const drive = await autenticarGoogleDrive();

  try {
    // Adiciona permissão na pasta
    const permission = await drive.permissions.create({
  fileId: folderId,
  supportsAllDrives: true,
  requestBody: {
    type: 'user',
    role: 'writer',
    emailAddress: email,
  },
});


    console.log(`✔️ Permissão adicionada à pasta com ID ${folderId}`);
  } catch (error) {
    console.error(`❌ Erro ao adicionar permissão para a pasta ${folderId}: ${error.message}`);
  }
}

async function listarSubpastas(folderId) {
  const drive = await autenticarGoogleDrive();

  try {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
      supportsAllDrives: true,
    });

    return res.data.files || [];
  } catch (error) {
    console.error(`❌ Erro ao listar subpastas da pasta ${folderId}: ${error.message}`);
    return [];
  }
}

async function processarPasta(folderId, email) {
  // Adiciona permissão para a pasta atual
  await adicionarPermissao(folderId, email);

  // Listar subpastas e adicionar permissão nelas também
  const subpastas = await listarSubpastas(folderId);

  if (subpastas.length > 0) {
    for (let subpasta of subpastas) {
      console.log(`📂 Processando subpasta: ${subpasta.name} (ID: ${subpasta.id})`);
      await processarPasta(subpasta.id, email); // Recursão para subpastas
    }
  }
}

async function main() {
  const serviceAccountEmail = 'upload-service@upload-cliente-drive.iam.gserviceaccount.com';
  const pastaMarketingId = '16c0xHvw61PeXuUAbY_pCC9Kvtk_7EYQF'; // Coloque o ID da pasta Marketing aqui

  console.log('🔧 Iniciando atribuição de permissões...\n');

  // Inicia o processamento a partir da pasta Marketing
  await processarPasta(pastaMarketingId, serviceAccountEmail);

  console.log('\n🎉 Permissões atribuídas a todas as pastas!');
}

main().catch((error) => {
  console.error('❌ Erro inesperado:', error.message);
});
