"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useDirectUpload } from "@/hooks/useDirectUpload";

// Limites
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB
const MAX_TOTAL_SIZE = 10 * 1024 * 1024 * 1024; // 10GB

export default function HomePage() {
  const searchParams = useSearchParams();
  const codigoCliente = searchParams.get('c');
  
  const [clienteSelecionado, setClienteSelecionado] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState<"Anúncios" | "Materiais" | "">("");
  const [descricao, setDescricao] = useState("");
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
  const [progressoTotal, setProgressoTotal] = useState<{ loaded: number; total: number; percentage: number } | null>(null);
  
  const { upload: directUpload } = useDirectUpload();

  // 1. Detectar cliente pela URL
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

  // 2. NOVA PROTEÇÃO: Impede fechar a aba durante upload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (uploading) {
        e.preventDefault();
        // O texto padrão do navegador será exibido
        e.returnValue = ""; 
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [uploading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      adicionarArquivos(Array.from(e.target.files));
    }
  };

  const adicionarArquivos = (novosArquivos: File[]) => {
    const arquivosGrandes = novosArquivos.filter(f => f.size > MAX_FILE_SIZE);
    if (arquivosGrandes.length > 0) {
      setMensagem({
        tipo: "erro",
        texto: `Alguns arquivos são muito grandes (máximo 5GB): ${arquivosGrandes.map(f => f.name).join(", ")}`,
      });
      return;
    }

    const tamanhoAtual = arquivos.reduce((sum, f) => sum + f.size, 0);
    const tamanhoNovos = novosArquivos.reduce((sum, f) => sum + f.size, 0);
    
    if (tamanhoAtual + tamanhoNovos > MAX_TOTAL_SIZE) {
      setMensagem({
        tipo: "erro",
        texto: `Limite de 10GB excedido.`,
      });
      return;
    }

    setArquivos((prev) => [...prev, ...novosArquivos]);
    setMensagem(null);
  };

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      adicionarArquivos(Array.from(e.dataTransfer.files));
    }
  };

  const removerArquivo = (index: number) => {
    setArquivos((prev) => prev.filter((_, i) => i !== index));
  };

  // Carousel handlers
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
  const handleMouseUp = () => setIsDraggingCarousel(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    if (!clienteSelecionado || !tipoSelecionado || arquivos.length === 0) {
      setMensagem({ tipo: "erro", texto: "Preencha todos os campos e anexe arquivos." });
      return;
    }

    setUploading(true);

    try {
      const tamanhoTotal = arquivos.reduce((sum, f) => sum + f.size, 0);
      const LIMITE_SERVIDOR = 50 * 1024 * 1024; // 50MB

      if (tamanhoTotal <= LIMITE_SERVIDOR) {
        // Upload Pequeno (via Server Action/API direta)
        const formData = new FormData();
        formData.append("clienteNome", clienteSelecionado);
        formData.append("categoria", categoriaSelecionada);
        formData.append("tipo", tipoSelecionado);
        formData.append("descricao", descricao);
        arquivos.forEach((arq, i) => formData.append(`file_${i}`, arq));

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        
        if (res.ok) {
          limparFormulario(data.message);
        } else {
          throw new Error(data.error);
        }
      } else {
        // Upload Grande (Direct Upload)
        let folderId = '';
        let bytesEnviados = 0;
        setProgressoTotal({ loaded: 0, total: tamanhoTotal, percentage: 0 });

        for (let i = 0; i < arquivos.length; i++) {
          const result = await directUpload(arquivos[i], { clienteNome: clienteSelecionado, categoria: categoriaSelecionada, tipo: tipoSelecionado }, 
            (loaded) => {
              const total = bytesEnviados + loaded;
              setProgressoTotal({ loaded: total, total: tamanhoTotal, percentage: Math.min(Math.round((total/tamanhoTotal)*100), 100) });
            }
          );
          if (i === 0) folderId = result.folderId;
          bytesEnviados += arquivos[i].size;
        }

        await fetch('/api/notify-after-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clienteNome: clienteSelecionado, categoria: categoriaSelecionada, tipo: tipoSelecionado,
            quantidade: arquivos.length, descricao, driveLink: folderId ? `https://drive.google.com/drive/folders/${folderId}` : undefined
          }),
        });
        limparFormulario(`${arquivos.length} arquivos enviados com sucesso!`);
      }
    } catch (error: any) {
      setMensagem({ tipo: "erro", texto: error.message || "Erro no envio." });
    } finally {
      setUploading(false);
      setProgressoTotal(null);
    }
  };

  const limparFormulario = (msg: string) => {
    setMensagem({ tipo: "sucesso", texto: msg });
    if (!modoCliente) { setClienteSelecionado(""); setCategoriaSelecionada(""); }
    setTipoSelecionado(""); setDescricao(""); setArquivos([]);
  };

  const tamanhoTotal = arquivos.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="page-container min-h-screen flex items-center justify-center relative bg-gradient-to-br from-franca-green via-white to-franca-green-dark px-4 py-8 lg:py-0 overflow-y-auto lg:overflow-hidden">
      {/* Background Shapes */}
      <div className="geometric-circle w-64 h-64 md:w-96 md:h-96 top-0 -left-32 md:-left-48 animate-float"></div>
      <div className="geometric-circle w-56 h-56 md:w-80 md:h-80 bottom-0 -right-28 md:-right-40 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="geometric-circle w-48 h-48 md:w-64 md:h-64 top-1/2 left-1/8 md:left-1/4 animate-float" style={{ animationDelay: '4s' }}></div>

      {/* CONTAINER GRID PRINCIPAL (3 COLUNAS NO DESKTOP) */}
      <div className="w-full max-w-[1400px] flex flex-col lg:flex-row items-center lg:items-center justify-center gap-6 relative z-10">

        {/* --- COLUNA ESQUERDA: DICAS (Só Desktop) --- */}
        <div className="hidden lg:flex flex-col gap-4 w-72 animate-slide-in">
          <div className="glass-effect rounded-2xl p-6 shadow-franca border border-white/50">
            <h3 className="text-franca-blue font-bold mb-3 flex items-center gap-2">
              <span className="text-xl">💡</span> Dicas Importantes
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="text-franca-green font-bold">•</span>
                <span>Não esqueça de adicionar a descrição detalhada dos seus arquivos.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-franca-green font-bold">•</span>
                <span>Isso agiliza o processo da nossa equipe.</span>
              </li>
            </ul>
          </div>

          <div className="glass-effect rounded-2xl p-6 shadow-franca border border-white/50">
             <h3 className="text-franca-blue font-bold mb-3 text-sm uppercase tracking-wide">
              Qual tipo selecionar?
            </h3>
            <div className="space-y-2 text-sm">
              <div className="bg-white/60 p-2 rounded-lg border-l-4 border-franca-blue">
                <p className="font-bold text-xs text-gray-500 uppercase">Material Editado</p>
                <p className="text-franca-blue font-semibold">Selecione ANÚNCIO</p>
              </div>
              <div className="bg-white/60 p-2 rounded-lg border-l-4 border-yellow-500">
                <p className="font-bold text-xs text-gray-500 uppercase">Material Bruto</p>
                <p className="text-franca-blue font-semibold">Selecione MATERIAL</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- CARD PRINCIPAL (CENTRO) --- */}
        <div className="glass-effect rounded-3xl shadow-franca-lg w-full max-w-2xl animate-fade-in my-4 lg:my-0 flex flex-col justify-center transform transition-all">
          
          {/* HEADER */}
          <div className="p-8 md:p-10 lg:p-8 lg:pb-4">
            <div className="flex justify-center mb-6 lg:mb-4">
              <div className="text-center">
                <div className="mb-4 lg:mb-2 relative">
                  <div className="w-20 h-20 lg:w-16 lg:h-16 mx-auto bg-gradient-to-br from-franca-green to-franca-green-dark rounded-2xl flex items-center justify-center shadow-franca transform hover:scale-105 transition-transform duration-300">
                    <Image
                      src="/logo.png"
                      alt="Franca Logo"
                      width={50}
                      height={50}
                      className="w-[30px] h-[30px] lg:w-[28px] lg:h-[28px]"
                    />
                  </div>
                </div>
                <h1 className="text-4xl lg:text-3xl font-bold text-franca-blue mb-1">
                  FRANCA<span className="text-franca-green">.</span>
                </h1>
                <p className="text-franca-blue text-sm font-medium tracking-wider uppercase">
                  Flow • Upload de Materiais
                </p>
              </div>
            </div>

            {modoCliente && clienteSelecionado && (
              <div className="bg-gradient-to-r from-franca-green to-franca-green-dark bg-opacity-10 border-l-4 border-franca-green p-4 rounded-xl">
                <p className="text-franca-blue text-lg lg:text-base font-bold">
                  Olá, {clienteSelecionado}! 👋
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Envie seus materiais de forma rápida e prática.
                </p>
              </div>
            )}
          </div>

          {/* FORMULÁRIO */}
          <div className="px-8 md:px-10 lg:px-8 pb-6 lg:pb-4">
            <form id="upload-form" onSubmit={handleSubmit} className="space-y-6 lg:space-y-4">
              {!modoCliente && (
                 <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-xl">
                   <p className="text-yellow-800 text-xs font-semibold">⚠️ Modo de teste ativo</p>
                 </div>
              )}

              {/* TIPO */}
              <div>
                <label className="block text-franca-blue font-semibold mb-2 text-sm lg:text-xs uppercase tracking-wide">
                  Tipo de Material
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {["Anúncios", "Materiais"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTipoSelecionado(type as any)}
                      className={`p-3 rounded-xl border-2 transition-all font-semibold text-sm ${
                        tipoSelecionado === type
                          ? "border-franca-green bg-franca-green bg-opacity-10 text-franca-blue"
                          : "border-gray-200 hover:border-franca-green text-gray-600"
                      }`}
                    >
                      {type === "Anúncios" ? "📢 Anúncios" : "📁 Materiais"}
                    </button>
                  ))}
                </div>
              </div>

              {/* DESCRIÇÃO */}
              <div>
                <label className="block text-franca-blue font-semibold mb-2 text-sm lg:text-xs uppercase tracking-wide">
                  Descrição (Opcional)
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Ex: Artes para feed de janeiro..."
                  className="w-full px-4 py-3 bg-white border-2 border-gray-100 rounded-xl focus:border-franca-green focus:ring-4 focus:ring-franca-green focus:ring-opacity-10 outline-none transition-all text-franca-blue resize-none text-sm"
                  rows={2}
                  maxLength={500}
                />
              </div>

              {/* UPLOAD */}
              <div>
                <label className="block text-franca-blue font-semibold mb-2 text-sm lg:text-xs uppercase tracking-wide">
                  Arquivos
                </label>
                <div
                  className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                    dragActive ? "border-franca-green bg-franca-green bg-opacity-5" : "border-gray-300 hover:border-franca-green"
                  }`}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                >
                  <input ref={inputRef} type="file" multiple accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
                  <svg className="w-8 h-8 mx-auto mb-2 text-franca-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-franca-blue font-semibold text-sm">Clique ou arraste arquivos</p>
                  <p className="text-gray-400 text-[10px]">até 5GB</p>
                </div>

                {/* Lista de Arquivos (Carousel) */}
                {arquivos.length > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-700 font-semibold">Selecionados:</span>
                      <span className={`text-[10px] font-bold ${tamanhoTotal > MAX_TOTAL_SIZE ? "text-red-600" : "text-franca-green"}`}>
                        {(tamanhoTotal / 1024 / 1024).toFixed(1)} MB / 10 GB
                      </span>
                    </div>
                    <div ref={scrollContainerRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                      className="flex gap-2 overflow-x-auto pb-2 carousel-container cursor-grab active:cursor-grabbing scrollbar-hide">
                      {arquivos.map((arquivo, index) => (
                        <div key={index} className="flex-shrink-0 w-40 bg-white p-2 rounded-lg border border-gray-200 shadow-sm relative group">
                          <div className="flex justify-between items-start">
                             <span className="text-[10px] text-gray-700 font-medium truncate w-32">{arquivo.name}</span>
                             <button type="button" onClick={() => removerArquivo(index)} className="text-red-400 hover:text-red-600"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Bar & Mensagens */}
              {uploading && progressoTotal && (
                 <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-franca-green h-2 rounded-full transition-all duration-300" style={{ width: `${progressoTotal.percentage}%` }} />
                 </div>
              )}

              {mensagem && (
                 <div className={`p-3 rounded-lg text-sm text-center font-medium ${mensagem.tipo === "sucesso" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                   {mensagem.texto}
                 </div>
              )}
            </form>
          </div>

          {/* FOOTER */}
          <div className="p-8 md:p-10 lg:p-6 border-t border-gray-100">
            <button
              type="submit"
              form="upload-form"
              disabled={uploading || tamanhoTotal > MAX_TOTAL_SIZE}
              className="w-full bg-gradient-to-r from-franca-green to-franca-green-dark hover:from-franca-green-dark hover:to-franca-green text-franca-blue font-bold py-4 lg:py-3.5 rounded-xl border-2 border-franca-green transition-all shadow-franca hover:shadow-franca-lg disabled:opacity-50 transform hover:scale-[1.01]"
            >
              {uploading ? "Enviando..." : "Enviar Arquivos"}
            </button>
            <p className="text-gray-400 text-[10px] text-center mt-3">Sistema exclusivo para clientes Franca</p>
          </div>
        </div>

        {/* --- COLUNA DIREITA: SUPORTE (Só Desktop) --- */}
        <div className="hidden lg:flex flex-col gap-4 w-72 animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <div className="glass-effect rounded-2xl p-6 shadow-franca border border-white/50 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🛠️</span>
            </div>
            <h3 className="text-franca-blue font-bold mb-2">Precisa de Ajuda?</h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Problemas, dicas ou dúvidas, chame o responsável pelo TI.
            </p>
            
            <a 
              href="https://wa.me/5521990268273?text=Ol%C3%A1%2C%20vim%20atrav%C3%A9s%20do%20Franca%20Flow%2C%20preciso%20de%20ajuda%21"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-1"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              WhatsApp TI
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}