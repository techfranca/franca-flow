import { google } from 'googleapis';
import { Readable } from 'stream';
import { getAnoAtual } from './clientes';

// ========================
// CONFIGURAÇÕES FIXAS
// ========================

// ID do Shared Drive
const SHARED_DRIVE_ID = '0ABUaieLcZITFUk9PVA';

// ID da pasta Marketing
const MARKETING_FOLDER_ID = '16c0xHvw61PeXuUAbY_pCC9Kvtk_7EYQF';

// ========================
// GOOGLE AUTH (ENV)
// ========================

// ⚠️ O JSON COMPLETO da service account vem do .env
const credentials = JSON.parse(
  process.env.GOOGLE_CREDENTIALS_JSON as string
);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive'],
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

  const mesNome = now.toLocaleString('pt-BR', { month: 'long' });

  const mesCapitalizado =
    mesNome.charAt(0).toUpperCase() + mesNome.slice(1);

  return `${mesNumero} - ${mesCapitalizado}`;
}

/**
 * Busca ou cria pasta (Shared Drive safe)
 */
async function findOrCreateFolder(
  name: string,
  parentId: string
): Promise<string> {
  const safeName = name.replace(/'/g, "\\'");

  const res = await drive.files.list({
    corpora: 'drive',
    driveId: SHARED_DRIVE_ID,
    q: `
      name='${safeName}'
      and mimeType='application/vnd.google-apps.folder'
      and '${parentId}' in parents
      and trashed=false
    `,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (res.data.files?.length) {
    return res.data.files[0].id!;
  }

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
 * Resolve o caminho final (estrutura legada)
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
  const clientesId = await findOrCreateFolder(
    'Clientes',
    MARKETING_FOLDER_ID
  );

  const categoriaId = await findOrCreateFolder(categoria, clientesId);

  const clienteId = await findOrCreateFolder(clienteNome, categoriaId);

  const designCriativosId = await findOrCreateFolder(
    'Design / Criativos',
    clienteId
  );

  const tipoId = await findOrCreateFolder(tipo, designCriativosId);

  const anoId = await findOrCreateFolder(
    getAnoAtual().toString(),
    tipoId
  );

  const mesId = await findOrCreateFolder(
    getMesFormatado(),
    anoId
  );

  return mesId;
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
    const finalFolderId = await navigateToFinalFolder({
      clienteNome,
      categoria,
      tipo,
    });

    await Promise.all(
      files.map((file) =>
        drive.files.create({
          supportsAllDrives: true,
          requestBody: {
            name: file.name,
            parents: [finalFolderId],
          },
          media: {
            mimeType: file.mimeType,
            body: Readable.from(file.buffer),
          },
          fields: 'id',
        })
      )
    );

    return {
      success: true,
      message: `${files.length} arquivo(s) enviados com sucesso para ${clienteNome}/${tipo}/${getMesFormatado()}!`,
    };
  } catch (error) {
    console.error('Erro no upload:', error);
    return {
      success: false,
      message: 'Erro ao fazer upload dos arquivos.',
    };
  }
}
