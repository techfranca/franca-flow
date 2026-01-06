import { useState } from 'react';

interface DirectUploadOptions {
  clienteNome: string;
  categoria: string;
  tipo: string;
  descricao?: string; // 🆕 Campo opcional
}

export function useDirectUpload() {
  const [progress, setProgress] = useState(0);

  const upload = async (
    file: File,
    options: DirectUploadOptions,
    onProgress?: (loaded: number, total: number) => void
  ) => {
    try {
      // 1. Obter URL de upload assinada
      const initRes = await fetch('/api/generate-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          clienteNome: options.clienteNome,
          categoria: options.categoria,
          tipo: options.tipo,
          descricao: options.descricao, // 🆕 Envia a descrição
        }),
      });

      if (!initRes.ok) throw new Error('Falha ao iniciar upload');
      const { uploadUrl, fileId, folderId } = await initRes.json();

      // 2. Fazer upload em chunks
      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
      let start = 0;

      while (start < file.size) {
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        const res = await fetch('/api/upload-chunk', {
          method: 'PUT',
          headers: {
            'X-Upload-Url': uploadUrl,
            'Content-Range': `bytes ${start}-${end - 1}/${file.size}`,
          },
          body: chunk,
        });

        if (!res.ok && res.status !== 308) throw new Error('Erro no upload do chunk');

        start = end;
        if (onProgress) onProgress(start, file.size);
      }

      return { success: true, fileId, folderId };
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  return { upload, progress };
}