# 🚀 Guia de Deploy no Vercel - EcoCash

Este documento contém as instruções para fazer deploy do projeto EcoCash no Vercel.

## 📋 Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Repositório Git (GitHub, GitLab ou Bitbucket)
3. API Key do Google Gemini (para funcionalidades de IA)

## 🔧 Configuração

### 1. Variáveis de Ambiente

No painel do Vercel, você precisa configurar a seguinte variável de ambiente:

- **`API_KEY`**: Sua chave de API do Google Gemini

**Como configurar:**
1. Acesse seu projeto no Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione `API_KEY` com o valor da sua chave de API do Google Gemini
4. Selecione os ambientes onde deseja usar (Production, Preview, Development)

### 2. Obter API Key do Google Gemini

1. Acesse [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada
5. Adicione no Vercel conforme instruções acima

## 🚀 Deploy

### Opção 1: Deploy via Git (Recomendado)

1. Faça commit e push do código para seu repositório Git:
```bash
git add .
git commit -m "Configuração para deploy no Vercel"
git push
```

2. No Vercel:
   - Clique em **"Add New Project"**
   - Importe seu repositório
   - O Vercel detectará automaticamente as configurações do `vercel.json`
   - Configure a variável de ambiente `API_KEY`
   - Clique em **"Deploy"**

### Opção 2: Deploy via CLI

1. Instale a CLI do Vercel:
```bash
npm i -g vercel
```

2. Faça login:
```bash
vercel login
```

3. No diretório do projeto, execute:
```bash
vercel
```

4. Siga as instruções e configure as variáveis de ambiente quando solicitado.

## 📁 Estrutura de Arquivos

Os seguintes arquivos foram criados/ajustados para o deploy:

- `vercel.json` - Configurações do Vercel (build, routing, headers)
- `.vercelignore` - Arquivos ignorados no deploy
- `.env.example` - Exemplo de variáveis de ambiente

## ⚙️ Configurações do Vercel

O projeto está configurado com:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Dev Command**: `npm run dev`
- **SPA Routing**: Todas as rotas redirecionam para `index.html`

## 🔍 Troubleshooting

### Build falha

- Verifique se todas as dependências estão no `package.json`
- Certifique-se de que a variável `API_KEY` está configurada
- Verifique os logs de build no painel do Vercel

### Aplicação não carrega

- Verifique se o `vercel.json` está configurado corretamente
- Certifique-se de que o build foi concluído com sucesso
- Verifique os logs do servidor no painel do Vercel

### Variáveis de ambiente não funcionam

- Certifique-se de que adicionou `API_KEY` nas Environment Variables
- Verifique se selecionou os ambientes corretos (Production/Preview)
- Após adicionar variáveis, faça um novo deploy

## 📝 Notas

- O projeto usa `localStorage` para armazenamento local (dados não persistem entre dispositivos)
- A API do Gemini é usada para estimativas de peso e busca de pontos de reciclagem
- O build otimiza automaticamente os assets para produção

## 🆘 Suporte

Em caso de problemas:
1. Verifique os logs no painel do Vercel
2. Teste o build localmente com `npm run build`
3. Verifique se todas as variáveis de ambiente estão configuradas

