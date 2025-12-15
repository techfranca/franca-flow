// TESTE DIRETO - Shared Drive
// Execute: node test-direto.js

const { google } = require('googleapis');
const credentials = require('./lib/google-credentials.json');

async function testeSimples() {
  try {
    console.log('🔍 TESTE DIRETO - Verificando credenciais e acesso\n');

    // Mostrar info da service account
    console.log('📧 Service Account Email:');
    console.log(`   ${credentials.client_email}\n`);

    // Autenticar
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // 🔹 ID da pasta Marketing (Shared Drive)
    const folderId = '16c0xHvw61PeXuUAbY_pCC9Kvtk_7EYQF';

    console.log(`📂 Testando acesso à pasta: ${folderId}\n`);

    // 🔹 Buscar info da pasta + driveId
    const response = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType, driveId',
      supportsAllDrives: true,
    });

    const driveId = response.data.driveId;

    console.log('✅ ✅ ✅ SUCESSO! ✅ ✅ ✅\n');
    console.log(`   📁 Nome da pasta: ${response.data.name}`);
    console.log(`   🆔 ID confirmado: ${response.data.id}`);
    console.log(`   📋 Tipo: ${response.data.mimeType}`);
    console.log(`   🗄️ Drive ID: ${driveId}\n`);

    // 🔹 Listar conteúdo (FORMA CORRETA PARA SHARED DRIVE)
    console.log('📋 Conteúdo da pasta:\n');

    const files = await drive.files.list({
      corpora: 'drive',
      driveId: driveId,
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    if (files.data.files && files.data.files.length > 0) {
      files.data.files.forEach(file => {
        const icon = file.mimeType === 'application/vnd.google-apps.folder'
          ? '📁'
          : '📄';
        console.log(`   ${icon} ${file.name}`);
      });
    } else {
      console.log('   (Pasta vazia)');
    }

    console.log('\n🎉 TESTE FINALIZADO COM SUCESSO!\n');

  } catch (error) {
    console.error('\n❌ ❌ ❌ ERRO! ❌ ❌ ❌\n');
    console.error(`Código: ${error.code}`);
    console.error(`Status: ${error.status}`);
    console.error(`Mensagem: ${error.message}\n`);
  }
}

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║        TESTE DE CONEXÃO - GOOGLE DRIVE (SHARED)       ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

testeSimples();
