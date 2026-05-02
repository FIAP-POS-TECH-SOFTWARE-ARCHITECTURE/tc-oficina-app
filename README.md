# Sistema da Oficina — API REST

## Comandos rápidos

### 1) Subir a aplicação com Docker

```bash
# Linux/macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env

docker compose up -d --build
```

API em: `http://localhost:3000`

### 2) Subir localmente sem Docker

Pré-requisito: PostgreSQL instalado e rodando localmente.

```bash
npm install

# Linux/macOS
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

No arquivo `.env`, ajuste `DATABASE_URL` para o Postgres local:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/oficina"
```

Depois:

```bash
npx prisma migrate dev
npm run db:seed
npm run start:dev
```

### 3) Rodar testes

```bash
# unitários
npm test

# unitários com cobertura
npm run test:cov

# e2e
# Linux/macOS: cp .env.test.example .env.test
# Windows PowerShell: Copy-Item .env.test.example .env.test
npm run test:e2e
```

---

## Bruno (cliente de API)

Baixe o Bruno em: **<https://www.usebruno.com/downloads>**

### Como abrir a coleção deste projeto

1. Instale e abra o Bruno.
2. Clique em **Open Collection**.
3. Selecione a pasta: `bruno\Oficina-API`.
4. No seletor de ambiente, escolha **Local** (`bruno\Oficina-API\environments\Local.yml`).

### Como usar

1. Execute `Auth > Login` para obter o JWT (o script da requisição salva o token automaticamente na variável `token`).
2. Execute as demais requisições da coleção (Clientes, Veículos, Serviços, Insumos, OS etc.).
3. Se necessário, ajuste `url` no ambiente Local (padrão: `http://localhost:3000`).

---

## Sobre o projeto

API REST para gestão de oficina mecânica, cobrindo:

- autenticação e usuários internos
- clientes e veículos
- catálogo de serviços
- estoque de insumos e compras
- ordens de serviço (incluindo fluxo completo, consulta pública e métricas)

### Stack atual

| Camada         | Tecnologia           |
| -------------- | -------------------- |
| Runtime        | Node.js + TypeScript |
| Framework      | NestJS 11            |
| Banco          | PostgreSQL 18        |
| ORM            | Prisma 6             |
| Autenticação   | JWT + Argon2         |
| Testes         | Jest + Supertest     |
| Cliente de API | Bruno                |

---

## Arquitetura

Módulos principais em `src/modules`:

- `auth`
- `usuarios`
- `clientes`
- `veiculos`
- `servicos`
- `insumos` (incluindo compras)
- `ordens-servico`

A aplicação usa Prisma para persistência, guards globais para autenticação/autorização e interceptor global para padronização de resposta.

---

## Banco de dados e Prisma

O schema Prisma é multi-arquivo dentro de `prisma/` e as migrations ficam em `prisma/migrations/`.

Comandos úteis:

```bash
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev --name nome_da_migration
npx prisma migrate deploy
npx prisma studio
```

---

## Dados iniciais (seed)

`npm run db:seed` popula:

- usuários: atendente, mecânico, estoquista
- clientes, veículos, serviços e insumos

Usuário administrador é criado automaticamente no bootstrap da aplicação quando não existe administrador ativo, usando:

- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`

---

## Variáveis de ambiente

Base para desenvolvimento em `.env.example`.

Campos obrigatórios:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`

Também usados:

- `JWT_EXPIRES_IN`
- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_PASSWORD`

---

## SonarQube local (opcional)

Token do SonarQube:

1. Acesse `http://localhost:9000` e faça login.
2. Vá em **My Account** > **Security**.
3. Em **Generate Tokens**, crie um token (**User Token**) e copie o valor.

Java (pré-requisito do scanner): JDK 17+ instalado e `java` disponível no PATH.

```bash
npm run sonar:up
npm run test:cov

# Linux/macOS
export SONAR_TOKEN=SEU_TOKEN

# Windows PowerShell
$env:SONAR_TOKEN="SEU_TOKEN"

npm run sonar:scan
```

Painel: `http://localhost:9000`
