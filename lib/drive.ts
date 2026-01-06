import { google } from 'googleapis'
import { Readable } from 'stream'
import { getAnoAtual } from './clientes'

// ========================
// CONFIGURAÇÕES FIXAS
// ========================

const SHARED_DRIVE_ID = '0ABUaieLcZITFUk9PVA'
const MARKETING_FOLDER_ID = '16c0xHvw61PeXuUAbY_pCC9Kvtk_7EYQF'

// ========================
// GOOGLE DRIVE (LAZY + SAFE)
// ========================

function getDrive() {
  const rawCreds = process.env.GOOGLE_CREDENTIALS_JSON

  if (!rawCreds) {
    throw new Error('GOOGLE_CREDENTIALS_JSON não definida')
  }

  const credentials = JSON.parse(rawCreds)

  // 🔥 CORREÇÃO CRÍTICA PARA VERCEL / OAUTH
  credentials.private_key = credentials.private_key.replace(/\\n/g, '\n')

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  return google.drive({
    version: 'v3',
    auth,
  })
}

// ========================
// TYPES
// ========================

interface UploadParams {
  clienteNome: string
  categoria: string
  tipo: 'Anúncios' | 'Materiais'
  descricao?: string // 🆕 Campo opcional adicionado
  files: Array<{
    name: string
    buffer: Buffer
    mimeType: string
  }>
}

// ========================
// HELPERS
// ========================

function getMesFormatado(): string {
  const now = new Date()

  const mesNumero = String(now.getMonth() + 1).padStart(2, '0')
  const mesNome = now.toLocaleString('pt-BR', { month: 'long' })

  return `${mesNumero} - ${mesNome.charAt(0).toUpperCase() + mesNome.slice(1)}`
}

async function findOrCreateFolder(
  drive: ReturnType<typeof getDrive>,
  name: string,
  parentId: string
): Promise<string> {
  // Escapa aspas simples para evitar erro na query do Drive
  const safeName = name.replace(/'/g, "\\'")

  const res = await drive.files.list({
    corpora: 'drive',
    driveId: SHARED_DRIVE_ID,
    q: `name='${safeName}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  if (res.data.files?.length) {
    return res.data.files[0].id!
  }

  const created = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  })

  return created.data.id!
}

async function navigateToFinalFolder(
  drive: ReturnType<typeof getDrive>,
  {
    clienteNome,
    categoria,
    tipo,
    descricao,
  }: {
    clienteNome: string
    categoria: string
    tipo: 'Anúncios' | 'Materiais'
    descricao?: string
  }
): Promise<string> {
  const clientesId = await findOrCreateFolder(drive, 'Clientes', MARKETING_FOLDER_ID)
  const categoriaId = await findOrCreateFolder(drive, categoria, clientesId)
  const clienteId = await findOrCreateFolder(drive, clienteNome, categoriaId)
  const designCriativosId = await findOrCreateFolder(drive, 'Design / Criativos', clienteId)
  const tipoId = await findOrCreateFolder(drive, tipo, designCriativosId)
  const anoId = await findOrCreateFolder(drive, getAnoAtual().toString(), tipoId)
  const mesId = await findOrCreateFolder(drive, getMesFormatado(), anoId)

  // 🆕 LÓGICA NOVA: Cria subpasta com a descrição se houver
  if (descricao && descricao.trim().length > 0) {
    // Sanitiza: remove caracteres inválidos de path e limita tamanho
    const nomePasta = descricao.substring(0, 60).replace(/[/\\]/g, '-').trim()
    const descricaoId = await findOrCreateFolder(drive, nomePasta, mesId)
    return descricaoId
  }

  return mesId
}

// ========================
// UPLOAD
// ========================

export async function uploadFilesToDrive({
  clienteNome,
  categoria,
  tipo,
  descricao,
  files,
}: UploadParams): Promise<{ success: boolean; message: string; folderId?: string }> {
  try {
    const drive = getDrive()

    const finalFolderId = await navigateToFinalFolder(drive, {
      clienteNome,
      categoria,
      tipo,
      descricao, // Passa a descrição para a navegação
    })

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
    )

    return {
      success: true,
      message: `${files.length} arquivo(s) enviados com sucesso!`,
      folderId: finalFolderId,
    }
  } catch (error) {
    console.error('Erro no upload:', error)
    return {
      success: false,
      message: 'Erro ao fazer upload dos arquivos.',
    }
  }
}