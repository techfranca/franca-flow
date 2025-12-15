import { google } from 'googleapis';
import { Readable } from 'stream';
import { getAnoAtual } from './clientes';
import credentials from './google-credentials.json';

// ========================
// CONFIGURAÇÕES FIXAS
// ========================

// ID do Shared Drive
const SHARED_DRIVE_ID = '0ABUaieLcZITFUk9PVA';

// ID da pasta Marketing (raiz controlada)
const MARKETING_FOLDER_ID = '16c0xHvw61PeXuUAbY_pCC9Kvtk_7EYQF';

// ========================
// GOOGLE DRIVE CLIENT
// ========================

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive'], // scope completo
});

const drive = google.drive({ version: 'v3', auth });

// ========================
// TYPES
// ========================

interface UploadParams {
  clienteNome: string;
  categoria: string;
  tipo: 'Anúncios' | 'Materiais';
  files: Array<{
    name: string;
    buffer: Buffer;
    mimeType: string;
  }>;
}

// ========================
// HELPERS
// ========================

/**
 * Retorna o mês no formato:
 * "09 - Setembro"
 */
function getMesFormatado(): string {
  const now = new Date();

  const mesNumero = String(now.getMonth() + 1).padStart(2, '0');

  const mesNome = now.toLocaleString('pt-BR', {
    month: 'long',
  });

  const mesNomeCapitalizado =
    mesNome.charAt(0).toUpperCase() + mesNome.slice(1);

  return `${mesNumero} - ${mesNomeCapitalizado}`;
}

/**
 * Busca ou cria uma pasta no Google Drive
 * (Shared Drive safe + evita duplicação)
 */
async function findOrCreateFolder(
  name: string,
  parentId: string
): Promise<string> {
  const safeName = name.replace(/'/g, "\\'");

  // 1️⃣ Buscar pasta existente
  const res = await drive.files.list({
    corpora: 'drive',
    driveId: SHARED_DRIVE_ID,
    q: `
      name='${safeName}'
      and mimeType='application/vnd.google-apps.folder'
      and '${parentId}' in parents
      and trashed=false
    `,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (res.data.files && res.data.files.length > 0) {
    return res.data.files[0].id!;
  }

  // 2️⃣ Criar se não existir
  const created = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });

  return created.data.id!;
}

/**
 * Resolve o caminho FINAL respeitando
 * a estrutura LEGADA: "Design / Criativos"
 */
async function navigateToFinalFolder({
  clienteNome,
  categoria,
  tipo,
}: {
  clienteNome: string;
  categoria: string;
  tipo: 'Anúncios' | 'Materiais';
}): Promise<string> {
  // Marketing > Clientes
  const clientesFolderId = await findOrCreateFolder(
    'Clientes',
    MARKETING_FOLDER_ID
  );

  // Clientes > Categoria
  const categoriaFolderId = await findOrCreateFolder(
    categoria,
    clientesFolderId
  );

  // Categoria > Cliente
  const clienteFolderId = await findOrCreateFolder(
    clienteNome,
    categoriaFolderId
  );

  // Cliente > Design / Criativos (LEGADO)
  const designCriativosFolderId = await findOrCreateFolder(
    'Design / Criativos',
    clienteFolderId
  );

  // Design / Criativos > Anúncios | Materiais
  const tipoFolderId = await findOrCreateFolder(
    tipo,
    designCriativosFolderId
  );

  // Ano
  const anoFolderId = await findOrCreateFolder(
    getAnoAtual().toString(),
    tipoFolderId
  );

  // Mês (FORMATO NOVO)
  const mesFolderId = await findOrCreateFolder(
    getMesFormatado(),
    anoFolderId
  );

  return mesFolderId;
}

// ========================
// UPLOAD
// ========================

export async function uploadFilesToDrive({
  clienteNome,
  categoria,
  tipo,
  files,
}: UploadParams): Promise<{ success: boolean; message: string }> {
  try {
    // Resolver pasta final
    const finalFolderId = await navigateToFinalFolder({
      clienteNome,
      categoria,
      tipo,
    });

    // Upload dos arquivos
    await Promise.all(
      files.map(async (file) => {
        await drive.files.create({
          supportsAllDrives: true,
          requestBody: {
            name: file.name,
            parents: [finalFolderId],
          },
          media: {
            mimeType: file.mimeType,
            body: Readable.from(file.buffer),
          },
          fields: 'id, name',
        });
      })
    );

    return {
      success: true,
      message: `${files.length} arquivo(s) enviado(s) com sucesso para ${clienteNome}/${tipo}/${getMesFormatado()}!`,
    };
  } catch (error) {
    console.error('Erro no upload:', error);
    return {
      success: false,
      message: 'Erro ao fazer upload dos arquivos. Tente novamente.',
    };
  }
}
