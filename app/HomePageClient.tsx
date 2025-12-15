"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { CLIENTES, CATEGORIAS, getMesAtual, getAnoAtual, getClientePorCodigo } from "@/lib/clientes";
import { useSearchParams } from "next/navigation";

// Limite de tamanho: 50MB por arquivo, 200MB total
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_TOTAL_SIZE = 200 * 1024 * 1024; // 200MB

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

  // Detectar cliente pela URL
  useEffect(() => {
    if (codigoCliente) {
      const clienteInfo = getClientePorCodigo(codigoCliente);
      if (clienteInfo) {
        setClienteSelecionado(clienteInfo.nome);
        setCategoriaSelecionada(clienteInfo.categoria);
        setModoCliente(true);
      }
    }
  }, [codigoCliente]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const novosArquivos = Array.from(e.target.files);
      adicionarArquivos(novosArquivos);
    }
  };

  const adicionarArquivos = (novosArquivos: File[]) => {
    // Validar tamanho de cada arquivo
    const arquivosGrandes = novosArquivos.filter(f => f.size > MAX_FILE_SIZE);
    if (arquivosGrandes.length > 0) {
      setMensagem({
        tipo: "erro",
        texto: `Alguns arquivos são muito grandes (máximo 50MB por arquivo): ${arquivosGrandes.map(f => f.name).join(", ")}`,
      });
      return;
    }

    // Validar tamanho total
    const tamanhoAtual = arquivos.reduce((sum, f) => sum + f.size, 0);
    const tamanhoNovos = novosArquivos.reduce((sum, f) => sum + f.size, 0);
    
    if (tamanhoAtual + tamanhoNovos > MAX_TOTAL_SIZE) {
      setMensagem({
        tipo: "erro",
        texto: `O tamanho total dos arquivos não pode ultrapassar 200MB. Atual: ${((tamanhoAtual + tamanhoNovos) / 1024 / 1024).toFixed(1)}MB`,
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
        // Resetar formulário (mas manter cliente se vier da URL)
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
    } catch (error) {
      setMensagem({
        tipo: "erro",
        texto: "Erro ao conectar com o servidor.",
      });
    } finally {
      setUploading(false);
    }
  };

  const mesAtual = getMesAtual();
  const anoAtual = getAnoAtual();
  const tamanhoTotal = arquivos.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-franca-green via-white to-franca-green-dark px-4">

      {/* Elementos decorativos */}
      <div className="geometric-circle w-96 h-96 top-0 -left-48 animate-float"></div>
      <div className="geometric-circle w-80 h-80 bottom-0 -right-40 animate-float" style={{ animationDelay: '2s' }}></div>
      <div className="geometric-circle w-64 h-64 top-1/2 left-1/4 animate-float" style={{ animationDelay: '4s' }}></div>

      {/* Card principal */}
      <div className="glass-effect rounded-3xl shadow-franca-lg p-10 md:p-14 max-w-2xl w-full relative z-10 animate-fade-in">
        {/* Logo e Título */}
        <div className="flex justify-center mb-8">
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
              Flow - Upload de Materiais
            </p>
          </div>
        </div>

        {/* Mensagem personalizada para cliente */}
        {modoCliente && clienteSelecionado && (
          <div className="bg-gradient-to-r from-franca-green to-franca-green-dark bg-opacity-10 border-l-4 border-franca-green p-4 rounded-xl mb-6">
            <p className="text-franca-blue text-lg font-bold">
              Olá, {clienteSelecionado}! 👋
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Envie seus materiais de forma rápida e prática.
            </p>
          </div>
        )}

        {/* Informação do mês */}
        <div className="bg-franca-green bg-opacity-10 border-l-4 border-franca-green p-4 rounded-xl mb-6">
          <p className="text-franca-blue text-sm">
            <span className="font-bold">Mês atual:</span> {mesAtual} de {anoAtual}
          </p>
          <p className="text-gray-600 text-xs mt-1">
            Os arquivos serão salvos automaticamente na pasta do mês.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Seletor de Cliente (só aparece se NÃO vier da URL) */}
          {!modoCliente && (
            <div className="animate-slide-in">
              <label
                htmlFor="cliente"
                className="block text-franca-blue font-semibold mb-3 text-sm uppercase tracking-wide"
              >
                Selecione o Cliente
              </label>
              <select
                id="cliente"
                value={clienteSelecionado}
                onChange={(e) => {
                  const cliente = e.target.value;
                  setClienteSelecionado(cliente);
                  
                  // Encontrar categoria do cliente
                  for (const [cat, clientes] of Object.entries(CLIENTES)) {
                    if (clientes.includes(cliente)) {
                      setCategoriaSelecionada(cat);
                      break;
                    }
                  }
                }}
                required
                className="w-full px-5 py-4 bg-white border-2 border-gray-100 rounded-xl focus:border-franca-green focus:ring-4 focus:ring-franca-green focus:ring-opacity-10 outline-none transition-all text-franca-blue font-medium appearance-none cursor-pointer hover:border-franca-green"
              >
                <option value="">Escolha o cliente...</option>
                {CATEGORIAS.map((categoria) => (
                  <optgroup key={categoria} label={categoria}>
                    {CLIENTES[categoria as keyof typeof CLIENTES].map((cliente) => (
                      <option key={cliente} value={cliente}>
                        {cliente}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
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

          {/* Upload de Arquivos */}
          <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
            <label className="block text-franca-blue font-semibold mb-3 text-sm uppercase tracking-wide">
              Arquivos
            </label>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
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
                className="w-12 h-12 mx-auto mb-4 text-franca-green"
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
              <p className="text-franca-blue font-semibold mb-2">
                Clique ou arraste os arquivos aqui
              </p>
              <p className="text-gray-500 text-sm">
                Fotos e vídeos (máx. 50MB por arquivo)
              </p>
            </div>

            {/* Lista de arquivos */}
            {arquivos.length > 0 && (
              <div className="mt-4 space-y-2">
                {/* Indicador de tamanho total */}
                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                  <span className="text-xs text-gray-600 font-semibold">
                    {arquivos.length} arquivo(s) selecionado(s)
                  </span>
                  <span className={`text-xs font-bold ${
                    tamanhoTotal > MAX_TOTAL_SIZE ? "text-red-600" : "text-franca-green"
                  }`}>
                    {(tamanhoTotal / 1024 / 1024).toFixed(1)} MB / 200 MB
                  </span>
                </div>

                {arquivos.map((arquivo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-franca-green"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-700 font-medium truncate max-w-xs">
                        {arquivo.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(arquivo.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removerArquivo(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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

          {/* Botão Enviar */}
          <button
            type="submit"
            disabled={uploading || tamanhoTotal > MAX_TOTAL_SIZE}
            className="w-full bg-gradient-to-r from-franca-green to-franca-green-dark hover:from-franca-green-dark hover:to-franca-green text-franca-blue font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-franca hover:shadow-franca-lg disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] animate-slide-in"
            style={{ animationDelay: '0.3s' }}
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
        </form>

        {/* Footer */}
        <div className="mt-8 text-center animate-slide-in" style={{ animationDelay: '0.4s' }}>
          <p className="text-gray-500 text-xs">
            Sistema exclusivo para clientes Franca
          </p>
        </div>
      </div>
    </div>
  );
}
