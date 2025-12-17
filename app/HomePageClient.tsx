"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { getMesAtual, getAnoAtual } from "@/lib/clientes";
import { useSearchParams } from "next/navigation";
import { useDirectUpload } from "@/hooks/useDirectUpload";

// Limites atualizados para suportar arquivos grandes
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB por arquivo
const MAX_TOTAL_SIZE = 10 * 1024 * 1024 * 1024; // 10GB total

export default function HomePage() {
  const searchParams = useSearchParams();
  const codigoCliente = searchParams.get('c');
  
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState<"Anúncios" | "Materiais" | "">("");
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [modoCliente, setModoCliente] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingCarousel, setIsDraggingCarousel] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
  // 🔥 PROGRESSO TOTAL MANUAL (acumulado de todos os arquivos)
  const [progressoTotal, setProgressoTotal] = useState<{ loaded: number; total: number; percentage: number } | null>(null);
  
  // Hook para upload direto de arquivos grandes
  const { upload: directUpload, progress: uploadProgress } = useDirectUpload();

  // Detectar cliente pela URL
  useEffect(() => {
    if (!codigoCliente) {
      setModoCliente(false);
      return;
    }

    fetch(`/api/clientes/${codigoCliente}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Cliente não encontrado");
        return res.json();
      })
      .then((clienteInfo) => {
        setClienteSelecionado(clienteInfo.nome);
        setCategoriaSelecionada(clienteInfo.categoria);
        setModoCliente(true);
      })
      .catch(() => {
        setModoCliente(false);
      });
  }, [codigoCliente]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const novosArquivos = Array.from(e.target.files);
      adicionarArquivos(novosArquivos);
    }
  };

  const adicionarArquivos = (novosArquivos: File[]) => {
    // Validar tamanho de cada arquivo (máximo 5GB)
    const arquivosGrandes = novosArquivos.filter(f => f.size > MAX_FILE_SIZE);
    if (arquivosGrandes.length > 0) {
      setMensagem({
        tipo: "erro",
        texto: `Alguns arquivos são muito grandes (máximo 5GB por arquivo): ${arquivosGrandes.map(f => f.name).join(", ")}`,
      });
      return;
    }

    // Validar tamanho total (máximo 10GB)
    const tamanhoAtual = arquivos.reduce((sum, f) => sum + f.size, 0);
    const tamanhoNovos = novosArquivos.reduce((sum, f) => sum + f.size, 0);
    
    if (tamanhoAtual + tamanhoNovos > MAX_TOTAL_SIZE) {
      setMensagem({
        tipo: "erro",
        texto: `O tamanho total dos arquivos não pode ultrapassar 10GB. Atual: ${((tamanhoAtual + tamanhoNovos) / 1024 / 1024 / 1024).toFixed(2)}GB`,
      });
      return;
    }

    setArquivos((prev) => [...prev, ...novosArquivos]);
    setMensagem(null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const novosArquivos = Array.from(e.dataTransfer.files);
      adicionarArquivos(novosArquivos);
    }
  };

  const removerArquivo = (index: number) => {
    setArquivos((prev) => prev.filter((_, i) => i !== index));
  };

  // Funções para drag do carrossel (desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDraggingCarousel(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingCarousel || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDraggingCarousel(false);
  };

  const handleMouseLeave = () => {
    setIsDraggingCarousel(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    if (!clienteSelecionado || !tipoSelecionado || arquivos.length === 0) {
      setMensagem({
        tipo: "erro",
        texto: "Por favor, preencha todos os campos e selecione pelo menos um arquivo.",
      });
      return;
    }

    setUploading(true);

    try {
      // Detecta tamanho total
      const tamanhoTotal = arquivos.reduce((sum, f) => sum + f.size, 0);
      const LIMITE_SERVIDOR = 50 * 1024 * 1024; // 50MB

      if (tamanhoTotal <= LIMITE_SERVIDOR) {
        // ==========================================
        // ARQUIVOS PEQUENOS: USA ROTA ATUAL
        // ==========================================
        const formData = new FormData();
        formData.append("clienteNome", clienteSelecionado);
        formData.append("categoria", categoriaSelecionada);
        formData.append("tipo", tipoSelecionado);

        arquivos.forEach((arquivo, index) => {
          formData.append(`file_${index}`, arquivo);
        });

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          setMensagem({
            tipo: "sucesso",
            texto: data.message,
          });
          if (!modoCliente) {
            setClienteSelecionado("");
            setCategoriaSelecionada("");
          }
          setTipoSelecionado("");
          setArquivos([]);
        } else {
          setMensagem({
            tipo: "erro",
            texto: data.error || "Erro ao fazer upload.",
          });
        }
      } else {
        // ==========================================
        // ARQUIVOS GRANDES: PROGRESSO EM TEMPO REAL
        // ==========================================
        const uploadedFileIds: string[] = [];
        let folderId = '';
        
        // 🔥 Calcula progresso total
        const totalSize = arquivos.reduce((sum, f) => sum + f.size, 0);
        let bytesJaEnviados = 0; // Bytes dos arquivos COMPLETOS
        
        setProgressoTotal({ loaded: 0, total: totalSize, percentage: 0 });

        // 🔥 Loop com callback de progresso em tempo real
        for (let i = 0; i < arquivos.length; i++) {
          const arquivo = arquivos[i];
          
          // ✅ Passa callback para atualizar progresso em tempo real
          const result = await directUpload(
            arquivo,
            {
              clienteNome: clienteSelecionado,
              categoria: categoriaSelecionada,
              tipo: tipoSelecionado,
            },
            (loadedArquivoAtual, totalArquivoAtual) => {
              // ✅ PROGRESSO EM TEMPO REAL!
              const totalLoaded = bytesJaEnviados + loadedArquivoAtual;
              const percentage = Math.round((totalLoaded / totalSize) * 100);
              
              setProgressoTotal({
                loaded: totalLoaded,
                total: totalSize,
                percentage: Math.min(percentage, 100)
              });
            }
          );
          
          uploadedFileIds.push(result.fileId);
          
          if (i === 0) {
            folderId = result.folderId;
          }
          
          // ✅ Atualiza bytes completos
          bytesJaEnviados += arquivo.size;
        }

        // Notifica após todos uploads
        await fetch('/api/notify-after-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteNome: clienteSelecionado,
            categoria: categoriaSelecionada,
            tipo: tipoSelecionado,
            quantidade: arquivos.length,
            driveLink: folderId 
              ? `https://drive.google.com/drive/folders/${folderId}`
              : undefined,
          }),
        });

        setMensagem({
          tipo: "sucesso",
          texto: `${arquivos.length} arquivo(s) enviados com sucesso!`,
        });

        if (!modoCliente) {
          setClienteSelecionado("");
          setCategoriaSelecionada("");
        }
        setTipoSelecionado("");
        setArquivos([]);
        setProgressoTotal(null);
      }
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto: "Erro ao conectar com o servidor.",
      });
    } finally {
      setUploading(false);
    }
  };

  const tamanhoTotal = arquivos.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="page-container h-screen flex items-center justify-center relative bg-gradient-to-br from-franca-green via-white to-franca-green-dark px-4 py-8 overflow-y-auto">
      {/* Elementos decorativos - AJUSTADOS */}
      <div className="geometric-circle w-64 h-64 md:w-96 md:h-96 top-0 -left-32 md:-left-48 animate-float"></div>
      <div className="geometric-circle w-56 h-56 md:w-80 md:h-80 bottom-0 -right-28 md:-right-40 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="geometric-circle w-48 h-48 md:w-64 md:h-64 top-1/2 left-1/8 md:left-1/4 animate-float" style={{ animationDelay: '4s' }}></div>

      {/* Card principal - MARGEM ADICIONADA */}
      <div className="glass-effect rounded-3xl shadow-franca-lg w-full max-w-2xl relative z-10 animate-fade-in my-4 md:my-0">
        {/* HEADER */}
        <div className="p-8 md:p-10">
          <div className="flex justify-center mb-6">
            <div className="text-center">
              <div className="mb-4 relative">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-franca-green to-franca-green-dark rounded-2xl flex items-center justify-center shadow-franca transform hover:scale-105 transition-transform duration-300">
                  <Image
                    src="/logo.png"
                    alt="Franca Logo"
                    width={50}
                    height={50}
                  />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-franca-blue mb-1">
                FRANCA<span className="text-franca-green">.</span>
              </h1>
              <p className="text-franca-blue text-sm font-medium tracking-wider uppercase">
                Flow • Upload de Materiais
              </p>
            </div>
          </div>

          {/* Mensagem personalizada para cliente */}
          {modoCliente && clienteSelecionado && (
            <div className="bg-gradient-to-r from-franca-green to-franca-green-dark bg-opacity-10 border-l-4 border-franca-green p-4 rounded-xl">
              <p className="text-franca-blue text-lg font-bold">
                Olá, {clienteSelecionado}! 👋
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Envie seus materiais de forma rápida e prática.
              </p>
            </div>
          )}
        </div>

        {/* CONTEÚDO */}
        <div className="px-8 md:px-10 pb-6">
          <form id="upload-form" onSubmit={handleSubmit} className="space-y-6">
            {!modoCliente && (
              <div className="animate-slide-in">
                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-xl">
                  <p className="text-yellow-800 text-sm font-semibold">
                    ⚠️ Modo de teste ativo
                  </p>
                  <p className="text-yellow-700 text-xs mt-1">
                    Para uso do cliente, acesse via link com código (?c=codigo)
                  </p>
                </div>
              </div>
            )}

            {/* Tipo de Material */}
            <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
              <label className="block text-franca-blue font-semibold mb-3 text-sm uppercase tracking-wide">
                Tipo de Material
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTipoSelecionado("Anúncios")}
                  className={`p-4 rounded-xl border-2 transition-all font-semibold ${
                    tipoSelecionado === "Anúncios"
                      ? "border-franca-green bg-franca-green bg-opacity-10 text-franca-blue"
                      : "border-gray-200 hover:border-franca-green text-gray-600"
                  }`}
                >
                  📢 Anúncios
                </button>
                <button
                  type="button"
                  onClick={() => setTipoSelecionado("Materiais")}
                  className={`p-4 rounded-xl border-2 transition-all font-semibold ${
                    tipoSelecionado === "Materiais"
                      ? "border-franca-green bg-franca-green bg-opacity-10 text-franca-blue"
                      : "border-gray-200 hover:border-franca-green text-gray-600"
                  }`}
                >
                  📁 Materiais
                </button>
              </div>
            </div>

            {/* Upload de Arquivos - ÁREA REDUZIDA */}
            <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
              <label className="block text-franca-blue font-semibold mb-3 text-sm uppercase tracking-wide">
                Arquivos
              </label>
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                  dragActive
                    ? "border-franca-green bg-franca-green bg-opacity-5"
                    : "border-gray-300 hover:border-franca-green"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <svg
                  className="w-10 h-10 mx-auto mb-3 text-franca-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="text-franca-blue font-semibold mb-1 text-sm">
                  Clique ou arraste arquivos
                </p>
                <p className="text-gray-500 text-xs">
                  Fotos e vídeos • até 5GB
                </p>
              </div>

              {/* 🔥 CARROSSEL HORIZONTAL */}
              {arquivos.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700 font-semibold">
                      Arquivos selecionados →
                    </span>
                    <span className={`text-xs font-bold ${
                      tamanhoTotal > MAX_TOTAL_SIZE ? "text-red-600" : "text-franca-green"
                    }`}>
                      {tamanhoTotal >= 1024 * 1024 * 1024 
                        ? `${(tamanhoTotal / 1024 / 1024 / 1024).toFixed(2)} GB`
                        : `${(tamanhoTotal / 1024 / 1024).toFixed(1)} MB`
                      } / 10 GB
                    </span>
                  </div>

                  <div
                    ref={scrollContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    className="flex gap-3 overflow-x-auto pb-2 carousel-container"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      cursor: isDraggingCarousel ? 'grabbing' : 'grab',
                      userSelect: 'none'
                    }}
                  >
                    {arquivos.map((arquivo, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 w-48 bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                        style={{ pointerEvents: isDraggingCarousel ? 'none' : 'auto' }}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs text-gray-700 font-medium truncate flex-1">
                              {arquivo.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removerArquivo(index)}
                              className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <span className="text-xs text-gray-500">
                            {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 🔥 Barra de progresso TOTAL (acumulada em tempo real) */}
            {uploading && progressoTotal && tamanhoTotal > 50 * 1024 * 1024 && (
              <div className="space-y-2 animate-slide-in">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-franca-blue">
                    Enviando arquivos... {progressoTotal.percentage}%
                  </span>
                  <span className="text-gray-600">
                    {progressoTotal.loaded >= 1024 * 1024 * 1024
                      ? `${(progressoTotal.loaded / 1024 / 1024 / 1024).toFixed(2)} GB`
                      : `${(progressoTotal.loaded / 1024 / 1024).toFixed(1)} MB`
                    } / {progressoTotal.total >= 1024 * 1024 * 1024
                      ? `${(progressoTotal.total / 1024 / 1024 / 1024).toFixed(2)} GB`
                      : `${(progressoTotal.total / 1024 / 1024).toFixed(1)} MB`
                    }
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-franca-green to-franca-green-dark h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progressoTotal.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Mensagens */}
            {mensagem && (
              <div
                className={`border-l-4 p-4 rounded-xl animate-slide-in ${
                  mensagem.tipo === "sucesso"
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border-franca-green"
                    : "bg-red-50 border-red-500"
                }`}
              >
                <div className="flex items-start gap-3">
                  <svg
                    className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      mensagem.tipo === "sucesso" ? "text-franca-green" : "text-red-500"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    {mensagem.tipo === "sucesso" ? (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    ) : (
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    )}
                  </svg>
                  <p
                    className={`font-semibold text-sm ${
                      mensagem.tipo === "sucesso" ? "text-franca-green-dark" : "text-red-700"
                    }`}
                  >
                    {mensagem.texto}
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* FOOTER COM BOTÃO FIXO - ✅ BORDA VERDE */}
        <div className="p-8 md:p-10 pt-6 border-t border-gray-100">
          <button
            type="submit"
            form="upload-form"
            disabled={uploading || tamanhoTotal > MAX_TOTAL_SIZE}
            className="w-full bg-gradient-to-r from-franca-green to-franca-green-dark hover:from-franca-green-dark hover:to-franca-green text-franca-blue font-bold py-4 px-6 rounded-xl border-2 border-franca-green transition-all duration-300 shadow-franca hover:shadow-franca-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-franca-blue"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Enviando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                Enviar Arquivos
              </span>
            )}
          </button>

          <div className="mt-4 text-center">
            <p className="text-gray-500 text-xs">
              Sistema exclusivo para clientes Franca
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}