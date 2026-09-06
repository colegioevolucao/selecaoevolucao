# Seleção 2027 — Colégio Evolução

Projeto inicial do site público de inscrição + área administrativa invisível.

## Estrutura

- `index.html` — formulário público
- `admin.html` — área administrativa
- `styles.css` — identidade visual
- `app.js` — lógica do formulário
- `admin.js` — login e dashboard
- `supabase.sql` — banco de dados + políticas RLS
- `assets/logo-evolucao.png` — logomarca

## 1. Supabase

Crie um projeto no Supabase.

No SQL Editor, execute `supabase.sql`.

Em **Authentication > Users**, crie o usuário administrativo.
Não coloque a senha no código.

## 2. Configuração do frontend

No Supabase, copie:

- Project URL
- anon public key

Cole em `app.js` e `admin.js` nestas constantes:

```js
const SUPABASE_URL = '...';
const SUPABASE_ANON_KEY = '...';
```

## 3. Credencial da gestão

O layout aceita login por e-mail e senha usando Supabase Auth.

Se você quiser que visualmente o login seja `CRM.Evolucao`, o caminho mais seguro é:
- criar um e-mail técnico para o usuário administrativo no Supabase Auth;
- ou depois adaptar o backend para mapear um identificador amigável para esse e-mail.

Não coloque `evolucao2026` hardcoded no navegador.

## 4. Área administrativa

A área administrativa fica em:

`/admin.html`

Não existe botão público de gestão na experiência da família.

Segurança real vem do Supabase Auth + RLS, não do fato de o link estar escondido.

## 5. Educação Infantil

O fluxo da Educação Infantil não mostra série nem data de prova.
Ele registra `application_type = visit` e status `Visita a agendar`.

## 6. Próxima etapa recomendada

- trocar o logo pelo arquivo final;
- revisar identidade visual responsiva;
- adicionar máscaras de CPF/telefone;
- adicionar exportação Excel/PDF na gestão;
- criar edição de candidatos;
- criar controle Presente/Ausente;
- adicionar CAPTCHA/anti-spam;
- publicar em hospedagem HTTPS.
