# 🚀 Franca Flow - Upload de Materiais

Sistema elegante e prático para upload de materiais dos clientes da Franca direto para o Google Drive.

## ✨ Funcionalidades

- 📁 Upload automático para pastas organizadas por cliente, tipo e mês
- 🎨 Interface moderna com identidade visual da Franca
- 📱 Responsivo (funciona em desktop e mobile)
- 🖱️ Drag & drop de arquivos
- ✅ Feedback visual do progresso
- 🗂️ Organização automática por mês

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta Google Cloud configurada
- Service Account do Google Drive criada
- Pasta "Clientes" compartilhada com a service account

## 🔧 Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Abra o arquivo `.env.local` e configure:

```env
GOOGLE_DRIVE_FOLDER_ID=SEU_ID_AQUI
```

**Como encontrar o ID da pasta:**
1. Abra a pasta "Clientes" no Google Drive
2. Copie o ID da URL
3. Exemplo: `https://drive.google.com/drive/folders/[ESTE_É_O_ID]`

### 3. Verificar credenciais

Certifique-se de que o arquivo `lib/google-credentials.json` está presente e contém as credenciais da service account.

### 4. Compartilhar pasta do Drive

1. Abra o arquivo `lib/google-credentials.json`
2. Copie o email em `client_email`
3. No Google Drive, compartilhe a pasta "Clientes" com esse email
4. Dê permissão de **Editor**

## 🚀 Executar localmente

```bash
npm run dev
```

Acesse: `http://localhost:3000`

## 📦 Deploy na Vercel

### 1. Instalar Vercel CLI (se ainda não tem)

```bash
npm install -g vercel
```

### 2. Fazer login

```bash
vercel login
```

### 3. Deploy

```bash
vercel
```

### 4. Configurar variáveis de ambiente na Vercel

No dashboard da Vercel:
1. Vá em Settings → Environment Variables
2. Adicione: `GOOGLE_DRIVE_FOLDER_ID` com o ID da pasta

### 5. Configurar credenciais do Google

Na Vercel, você tem duas opções:

**Opção A - Adicionar como variável de ambiente (recomendado):**
1. Crie uma variável chamada `GOOGLE_CREDENTIALS`
2. Cole TODO o conteúdo do arquivo `google-credentials.json` como string
3. No código, leia com: `JSON.parse(process.env.GOOGLE_CREDENTIALS)`

**Opção B - Fazer upload do arquivo:**
1. Inclua o arquivo no repositório (não recomendado por segurança)
2. Use .gitignore local para desenvolvimento

## 📁 Estrutura de Pastas no Drive

```
Clientes/
├── Negócio Local/
│   ├── LF odontologia/
│   │   └── Design / Criativos/
│   │       ├── Anúncios/
│   │       │   └── 2026/
│   │       │       └── Dezembro/
│   │       └── Materiais/
│   │           └── 2026/
│   │               └── Dezembro/
├── Infoproduto/
├── Inside Sales/
└── E-commerce/
```

## 🎨 Personalização

### Cores

As cores estão em `tailwind.config.ts`:

```ts
colors: {
  franca: {
    green: "#7DE08D",
    "green-dark": "#598F74",
    blue: "#081534",
  },
}
```

### Clientes

Para adicionar/remover clientes, edite `lib/clientes.ts`

## 🐛 Solução de Problemas

### Erro: "Pasta não encontrada"
- Verifique se o `GOOGLE_DRIVE_FOLDER_ID` está correto
- Confirme que a pasta foi compartilhada com o email da service account

### Erro: "Permissão negada"
- Certifique-se de que a service account tem permissão de **Editor**

### Arquivos não aparecem no Drive
- Aguarde alguns segundos (pode demorar um pouco)
- Verifique a estrutura de pastas
- Veja os logs no console do navegador

## 📞 Suporte

Em caso de dúvidas, entre em contato com a equipe de TI da Franca.

---

Desenvolvido com ❤️ pela Franca
