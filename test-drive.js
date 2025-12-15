// Script de teste - Verificar conexão com Google Drive
// Execute com: node test-drive.js

const { google } = require('googleapis');
const credentials = require('./lib/google-credentials.json');

async function testarConexao() {
  try {
    console.log('🔍 Testando conexão com Google Drive...\n');

    // Autenticar
    const auth = new google.auth.GoogleAuth({
      credentials: credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    const drive = google.drive({ version: 'v3', auth });

    // Tentar acessar a pasta
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '15bCLGcICIToaRyIK_iClIFNGM6gW72BQ';
    
    console.log(`📂 Tentando acessar pasta: ${folderId}\n`);

    const response = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, mimeType, permissions',
    });

    console.log('✅ SUCESSO! Pasta encontrada:');
    console.log(`   Nome: ${response.data.name}`);
    console.log(`   ID: ${response.data.id}`);
    console.log(`   Tipo: ${response.data.mimeType}\n`);

    // Tentar listar conteúdo
    console.log('📋 Listando conteúdo da pasta...\n');
    
    const files = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType)',
      pageSize: 10,
    });

    if (files.data.files && files.data.files.length > 0) {
      console.log('✅ Arquivos/pastas encontrados:');
      files.data.files.forEach(file => {
        const tipo = file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄';
        console.log(`   ${tipo} ${file.name}`);
      });
    } else {
      console.log('⚠️  Pasta vazia ou sem conteúdo visível.');
    }

    console.log('\n🎉 Teste concluído com sucesso! A conexão está funcionando!');
    
  } catch (error) {
    console.error('\n❌ ERRO ao acessar o Drive:');
    console.error(`   Código: ${error.code}`);
    console.error(`   Mensagem: ${error.message}\n`);
    
    if (error.code === 404) {
      console.log('💡 SOLUÇÃO:');
      console.log('   1. Verifique se o ID da pasta está correto no .env.local');
      console.log('   2. Certifique-se de que a pasta foi compartilhada com:');
      console.log(`      ${credentials.client_email}`);
      console.log('   3. A permissão deve ser "Editor", não "Visualizador"');
      console.log('   4. Aguarde 2-3 minutos após compartilhar e tente novamente\n');
    }
  }
}

testarConexao();