# JoinIn · People Intelligence Platform

Sistema de Employee Experience, Onboarding Analytics e Gestão de Riscos Psicossociais (NR-1).

---

## Deploy em 5 passos

### 1. Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) → New Project
2. Anote a **URL do projeto** e a **service_role key** (Settings → API)
3. Abra o **SQL Editor** e cole o conteúdo de `supabase-schema.sql` → Run
4. Em Authentication → Settings: desative "Enable email confirmations" (para facilitar os testes iniciais)

### 2. Subir o código no GitHub

```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/joinin-people.git
git push -u origin main
```

### 3. Deploy no Netlify

1. Acesse [app.netlify.com](https://app.netlify.com) → Add new site → Import from Git
2. Conecte seu repositório GitHub
3. Configurações de build:
   - **Base directory:** (vazio)
   - **Build command:** (vazio — não há build)
   - **Publish directory:** `public`
4. Clique em **Deploy site**

### 4. Configurar variáveis de ambiente no Netlify

Site Settings → Environment variables → Add variable:

| Chave | Valor |
|-------|-------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | `eyJ...` (service_role key) |

Após adicionar, clique em **Trigger redeploy**.

### 5. Criar a primeira conta

Acesse a URL do seu site Netlify → clique em **Criar conta** → preencha nome, e-mail e senha.

---

## Estrutura do projeto

```
joinin-app/
├── netlify.toml              # Configuração de deploy e redirects
├── package.json              # Dependências das functions
├── supabase-schema.sql       # SQL para criar as tabelas
├── public/
│   └── index.html            # Frontend completo (SPA)
└── netlify/
    └── functions/
        ├── auth.js           # Login, cadastro, verificar token
        ├── gestores.js       # CRUD gestores
        ├── colaboradores.js  # CRUD colaboradores
        └── checkins.js       # CRUD checkins
```

## Segurança

- Autenticação via Supabase Auth (JWT)
- Row Level Security (RLS) ativo — cada usuário acessa apenas seus dados
- Variáveis sensíveis nunca expostas no frontend
- LGPD: dados tratados conforme descrito no formulário

## Suporte

ana.meyer@joinin.com.br
