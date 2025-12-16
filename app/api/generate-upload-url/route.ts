import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getAnoAtual } from '@/lib/clientes'

const SHARED_DRIVE_ID = '0ABUaieLcZITFUk9PVA'
const MARKETING_FOLDER_ID = '16c0xHvw61PeXuUAbY_pCC9Kvtk_7EYQF'

export const runtime = 'nodejs'
export const maxDuration = 10

function getDrive() {
  const rawCreds = process.env.GOOGLE_CREDENTIALS_JSON
  if (!rawCreds) {
    throw new Error('GOOGLE_CREDENTIALS_JSON não definida')
  }

  const credentials = JSON.parse(rawCreds)
  credentials.private_key = credentials.private_key.replace(/\\n/g, '\n')

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  return google.drive({ version: 'v3', auth })
}

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
  clienteNome: string,
  categoria: string,
  tipo: 'Anúncios' | 'Materiais'
): Promise<string> {
  const clientesId = await findOrCreateFolder(drive, 'Clientes', MARKETING_FOLDER_ID)
  const categoriaId = await findOrCreateFolder(drive, categoria, clientesId)
  const clienteId = await findOrCreateFolder(drive, clienteNome, categoriaId)
  const designCriativosId = await findOrCreateFolder(drive, 'Design / Criativos', clienteId)
  const tipoId = await findOrCreateFolder(drive, tipo, designCriativosId)
  const anoId = await findOrCreateFolder(drive, getAnoAtual().toString(), tipoId)
  const mesId = await findOrCreateFolder(drive, getMesFormatado(), anoId)

  return mesId
}

async function getAuthToken(drive: ReturnType<typeof getDrive>): Promise<string> {
  const auth = drive.context._options.auth as any
  
  if (!auth) {
    throw new Error('Auth não configurado')
  }

  // Tenta obter o cliente de autenticação
  let authClient
  if (typeof auth.getClient === 'function') {
    authClient = await auth.getClient()
  } else {
    authClient = auth
  }

  // Obtém o token
  const tokenResponse = await authClient.getAccessToken()
  
  if (!tokenResponse.token) {
    throw new Error('Falha ao obter token de acesso')
  }

  return tokenResponse.token
}

export async function POST(request: NextRequest) {
  try {
    const { fileName, mimeType, fileSize, clienteNome, categoria, tipo } = await request.json()

    const drive = getDrive()

    // Cria estrutura de pastas (reutiliza sua lógica)
    const finalFolderId = await navigateToFinalFolder(drive, clienteNome, categoria, tipo)

    // Cria arquivo vazio
    const file = await drive.files.create({
      supportsAllDrives: true,
      requestBody: {
        name: fileName,
        parents: [finalFolderId],
      },
      fields: 'id,webViewLink',
    })

    const fileId = file.data.id!

    // Obtém token de autenticação
    const token = await getAuthToken(drive)

    // Inicia sessão de upload resumível
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=resumable&supportsAllDrives=true`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Type': mimeType,
          'X-Upload-Content-Length': fileSize.toString(),
        },
      }
    )

    const uploadUrl = response.headers.get('Location')
    if (!uploadUrl) {
      throw new Error('Falha ao obter URL de upload')
    }

    return NextResponse.json({
      success: true,
      fileId,
      uploadUrl,
      folderId: finalFolderId,
      webViewLink: file.data.webViewLink,
    })
  } catch (error: any) {
    console.error('Erro ao gerar URL:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}