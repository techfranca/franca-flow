'use client'

import { useState } from 'react'

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

interface UploadMetadata {
  clienteNome: string
  categoria: string
  tipo: 'Anúncios' | 'Materiais'
}

interface UseDirectUploadReturn {
  upload: (file: File, metadata: UploadMetadata) => Promise<string>
  progress: UploadProgress | null
  isUploading: boolean
  error: string | null
  cancelUpload: () => void
}

const CHUNK_SIZE = 5 * 1024 * 1024 // 5MB

export function useDirectUpload(): UseDirectUploadReturn {
  const [progress, setProgress] = useState<UploadProgress | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)

  const cancelUpload = () => {
    if (abortController) {
      abortController.abort()
      setIsUploading(false)
      setProgress(null)
    }
  }

  const upload = async (file: File, metadata: UploadMetadata): Promise<string> => {
    setIsUploading(true)
    setError(null)
    setProgress({ loaded: 0, total: file.size, percentage: 0 })

    const controller = new AbortController()
    setAbortController(controller)

    try {
      // 1. Gera URL de upload
      const urlResponse = await fetch('/api/generate-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          clienteNome: metadata.clienteNome,
          categoria: metadata.categoria,
          tipo: metadata.tipo,
        }),
        signal: controller.signal,
      })

      if (!urlResponse.ok) {
        throw new Error('Falha ao gerar URL de upload')
      }

      const { uploadUrl, fileId } = await urlResponse.json()

      // 2. Upload em chunks via PROXY
      await uploadInChunksViaProxy(file, uploadUrl, controller.signal, (loaded, total) => {
        const percentage = Math.round((loaded / total) * 100)
        setProgress({ loaded, total, percentage })
      })

      setIsUploading(false)
      return fileId

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Upload cancelado')
      } else {
        setError(err.message || 'Erro no upload')
      }
      setIsUploading(false)
      throw err
    }
  }

  return { upload, progress, isUploading, error, cancelUpload }
}

// Upload via proxy (evita CORS)
async function uploadInChunksViaProxy(
  file: File,
  uploadUrl: string,
  signal: AbortSignal,
  onProgress: (loaded: number, total: number) => void
): Promise<void> {
  const totalSize = file.size
  let uploadedBytes = 0

  while (uploadedBytes < totalSize) {
    const chunk = file.slice(uploadedBytes, uploadedBytes + CHUNK_SIZE)
    const chunkSize = chunk.size

    // Envia chunk via PROXY (nosso servidor)
    const response = await fetch('/api/upload-chunk', {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes ${uploadedBytes}-${uploadedBytes + chunkSize - 1}/${totalSize}`,
        'X-Upload-Url': uploadUrl, // Passa a URL do Google para o proxy
      },
      body: chunk,
      signal,
    })

    const data = await response.json()

    if (data.status !== 308 && data.status !== 200 && data.status !== 201) {
      // Retry: verifica onde parou
      const rangeResponse = await fetch('/api/upload-chunk', {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes */${totalSize}`,
          'X-Upload-Url': uploadUrl,
        },
        body: new Blob([]),
        signal,
      })

      const rangeData = await rangeResponse.json()
      
      if (rangeData.range) {
        const match = rangeData.range.match(/bytes=0-(\d+)/)
        if (match) {
          uploadedBytes = parseInt(match[1]) + 1
          onProgress(uploadedBytes, totalSize)
          continue
        }
      }

      throw new Error(`Erro no upload: ${data.status}`)
    }

    uploadedBytes += chunkSize
    onProgress(uploadedBytes, totalSize)

    if (uploadedBytes >= totalSize && (data.status === 200 || data.status === 201)) {
      return
    }
  }
}
``