# Sistema da Oficina — Tech Challenge FIAP / SOAT

API REST para gestão de uma oficina mecânica: clientes, veículos, catálogo de serviços, estoque
de peças/insumos e o ciclo completo da Ordem de Serviço (OS), incluindo consulta pública pelo
cliente e métrica de tempo médio de execução.

---

## Migrations com Prisma

O schema é **multi-arquivo**: a pasta [prisma/](prisma/) contém um arquivo `.prisma` por
bounded context (`identidade.prisma`, `clientes.prisma`, `veiculos.prisma`, `servicos.prisma`,
`insumos.prisma`, `ordens-servico.prisma`) mais `enums.prisma` para os enums compartilhados.
O `schema.prisma` carrega só o `generator` e o `datasource`. O Prisma 6 lê todos os `.prisma`
da pasta automaticamente — não há mais necessidade do flag `prismaSchemaFolder`.

A configuração da CLI fica em [prisma.config.ts](prisma.config.ts), que carrega o `.env` via
`dotenv` e aponta `schema` para a pasta `prisma/`.

### Comandos do dia a dia

```bash
npx prisma format          # formata e ordena os .prisma
npx prisma validate        # valida o schema (lê todos os arquivos)
npx prisma migrate dev --name <descricao>   # cria e aplica migration de dev
npx prisma migrate deploy  # aplica migrations em produção (sem prompt)
npx prisma generate        # regenera o Prisma Client
npx prisma studio          # GUI para inspecionar o banco
```

### Como funciona o fluxo

1. Você edita um arquivo `.prisma` (ex.: adiciona um campo em `insumos.prisma`).
2. Roda `npx prisma migrate dev --name novo_campo`. O Prisma:
   - faz o **diff** do schema atual contra o estado do banco;
   - gera um novo SQL em [prisma/migrations/](prisma/migrations/) (ex.:
     `20260501003636_movimento_usuario_optional/migration.sql`);
   - aplica o SQL no banco;
   - regenera o Prisma Client (tipos TS atualizados automaticamente).
3. O arquivo SQL fica versionado no Git — em produção você roda `prisma migrate deploy` para
   aplicar exatamente as mesmas migrations, na mesma ordem, sem regerar nada.

### Convenções desta base

- **`snake_case` no banco, `camelCase` no código.** Cada model usa `@@map("nome_tabela")` e
  cada coluna não-trivial usa `@map("nome_coluna")`. Ex.: `senhaHash` em TS vira `senha_hash`
  no Postgres.
- **UUID como id**, gerado pelo Postgres (`@default(uuid()) @db.Uuid`).
- **Timestamps padrão**: `createdAt` (`@default(now())`) + `updatedAt` (`@updatedAt`).
- **Soft-delete por `ativo: Boolean`** em entidades de catálogo (clientes, veículos, serviços,
  insumos, usuários). Inativação preserva o histórico das OS já abertas.
- **Snapshot de preço** em `OsItemServico` e `OsItemInsumo` — alterar o catálogo depois não
  muda o orçamento de uma OS já existente.
- **Auditoria** em `OsHistoricoStatus`: nunca é deletado; toda transição da OS grava uma linha.

### Migration inicial

A migration `20260501001954_init/` cria todas as tabelas:
`usuarios`, `clientes`, `veiculos`, `servicos`, `insumos`, `movimentos_estoque`,
`ordens_servico`, `os_itens_servico`, `os_itens_insumo`, `os_historico_status`, mais os enums
`Role`, `OsStatus`, `TipoMovimentoEstoque`, `TipoDocumentoCliente`.

A migration seguinte (`movimento_usuario_optional`) torna `usuario_id` opcional em
`movimentos_estoque` para permitir baixas de estoque disparadas pela aprovação pública da OS
(em que não há usuário interno logado).

---

## Stack e justificativas

| Camada       | Tecnologia                              | Por quê                                                                                         |
| ------------ | --------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Runtime      | Node.js 22 + TypeScript                 | Tipagem estática + ecossistema maduro                                                           |
| Framework    | NestJS 11                               | Injeção de dependência, módulos por bounded context, guards/interceptors globais, testabilidade |
| Banco        | PostgreSQL 18                           | Transacional, integridade referencial, `Decimal` nativo, agregações para métricas e auditoria   |
| ORM          | Prisma 6 (multi-arquivo)                | Type-safe, migrations versionadas, schema por BC                                                |
| Auth         | JWT (HS256) + argon2                    | Stateless, alinhado a APIs REST; argon2 é o vencedor do PHC                                     |
| Resposta     | `semantic-response`                     | Envelope HTTP uniforme em todos os endpoints                                                    |
| Validação    | `class-validator` + `class-transformer` | DTOs declarativos, validators custom (CPF/CNPJ com suporte a CNPJ alfanumérico, placa)          |
| Documentação | Bruno                                   | Coleção versionada em texto plano (substitui Swagger e vai pro Git)                             |
| Testes       | Jest                                    | Unitários + cobertura mínima nos domínios críticos                                              |

---

## Arquitetura

Monolito em camadas dentro do NestJS, **um módulo por bounded context**:

| BC                          | Módulo                | Pasta                                                      |
| --------------------------- | --------------------- | ---------------------------------------------------------- |
| BC1 — Ordens de Serviço     | `OrdensServicoModule` | [src/modules/ordens-servico/](src/modules/ordens-servico/) |
| BC2 — Clientes              | `ClientesModule`      | [src/modules/clientes/](src/modules/clientes/)             |
| BC2 — Veículos              | `VeiculosModule`      | [src/modules/veiculos/](src/modules/veiculos/)             |
| BC3 — Catálogo de Serviços  | `ServicosModule`      | [src/modules/servicos/](src/modules/servicos/)             |
| BC4 — Estoque (Insumos)     | `InsumosModule`       | [src/modules/insumos/](src/modules/insumos/)               |
| BC5 — Identidade e Acesso   | `AuthModule`          | [src/modules/auth/](src/modules/auth/)                     |
| Suporte — Usuários internos | `UsuariosModule`      | [src/modules/usuarios/](src/modules/usuarios/)             |

Cada módulo segue: `dto/` → `controller` → `service` (retorna `IServiceResponse<T>`) → `repository`
(encapsula Prisma). Controllers nunca tocam Prisma; o `ResponseInterceptor` global converte o
envelope em status HTTP correto.

Camadas transversais ficam em [src/common/](src/common/):

- [common/decorators/](src/common/decorators/) — `@Public`, `@Roles`, `@CurrentUser`
- [common/guards/](src/common/guards/) — `JwtAuthGuard`, `RolesGuard` (registrados globalmente)
- [common/interceptors/response.interceptor.ts](src/common/interceptors/response.interceptor.ts) — semantic-response → HTTP
- [common/filters/all-exceptions.filter.ts](src/common/filters/all-exceptions.filter.ts) — captura exceções não previstas
- [common/validators/](src/common/validators/) — `@IsCpfOrCnpj`, `@IsPlacaVeiculo`

### Máquina de estados da OS

```
RECEBIDA → EM_DIAGNOSTICO → AGUARDANDO_APROVACAO → EM_EXECUCAO → FINALIZADA → ENTREGUE
                                       ↓
                                  CANCELADA (rejeição/cancelamento)
```

Toda transição roda numa transação Prisma que valida a transição, atualiza `status`, registra
`OsHistoricoStatus` e executa efeitos colaterais (aprovação baixa estoque; cancelamento de OS
aprovada estorna). A matriz completa está em
[src/modules/ordens-servico/os-state-machine.ts](src/modules/ordens-servico/os-state-machine.ts)
e é coberta integralmente nos testes.

---

## Como rodar local

### Pré-requisitos

- Node.js 22+
- Docker (para o Postgres de desenvolvimento)

### Passos

```bash
# 1. dependências
npm install

# 2. variáveis de ambiente
cp .env.example .env

# 3. banco de desenvolvimento
docker compose -f dev/docker-compose.yml up -d

# 4. migrations
npx prisma migrate dev

# 5. servidor
npm run start:dev
```

A API sobe em `http://localhost:3000`. No primeiro boot, se não houver `ADMINISTRADOR` ativo,
um admin padrão é criado a partir de `ADMIN_BOOTSTRAP_EMAIL`/`ADMIN_BOOTSTRAP_PASSWORD`.

---

## Testes

```bash
npm test          # unitários
npm run test:cov  # com cobertura
```

`coverageThreshold` no [package.json](package.json) garante **≥80%** em
`ordens-servico.service`, `insumos.service` e `auth.service` — abaixo disso o pipeline falha.
Total atual: 120 testes unitários, incluindo a matriz completa da máquina de estados da OS.

---

## Coleção Bruno

A coleção fica em [bruno/Oficina-API/](bruno/Oficina-API/), espelhando os módulos:

```
00-Auth/                # Login
01-Usuarios/            # CRUD
02-Clientes/            # CRUD + busca por documento
03-Veiculos/            # CRUD + busca por placa
04-Servicos/            # CRUD
05-Insumos/             # CRUD + entrada + movimentos + alertas
06-OrdensServico/       # Criar, Diagnóstico, Itens, Orçamento, Finalizar, Entregar, Cancelar, Consulta Pública, Métricas
environments/Local.bru  # url + variáveis (token, ids, documento)
```

**Fluxo recomendado:**

1. Selecione o environment `Local` no Bruno.
2. Rode `00-Auth → Login` (o post-response hook salva `token`).
3. `02-Clientes → Criar Cliente` (salva `clienteId` e `documentoCliente`).
4. `03-Veiculos → Criar Veiculo` (salva `veiculoId`).
5. `04-Servicos → Criar Servico` (salva `servicoId`).
6. `05-Insumos → Criar Insumo` (salva `insumoId`).
7. `06-OrdensServico` na sequência: Criar → Iniciar Diagnóstico → Adicionar Itens → Gerar
   Orçamento → Aprovar → Finalizar → Entregar. `Aprovar`, `Rejeitar` e `Consulta Publica` são
   rotas públicas que usam apenas `numero` + `documento` do cliente.

Justificativa para Bruno em vez de Swagger: o desafio pede "Swagger ou similar"; Bruno é
equivalente, é versionado em texto plano e cobre o mesmo papel.

---

## Domain Storytelling / Event Storming

Os artefatos de modelagem ficam em [.claude/](.claude/):

- [.claude/01-domain-storytelling.md](.claude/01-domain-storytelling.md)
- [.claude/02-event-storming.md](.claude/02-event-storming.md)
- [.claude/03-implementation-plan.md](.claude/03-implementation-plan.md) — plano executado nesta entrega

---

## Variáveis de ambiente

```
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/oficina"
JWT_SECRET="..."                       # 64 hex bytes
JWT_EXPIRES_IN="8h"
ADMIN_BOOTSTRAP_EMAIL="admin@oficina.local"
ADMIN_BOOTSTRAP_PASSWORD="ChangeMe!123"
```

`main.ts` falha fast se `PORT`, `DATABASE_URL` ou `JWT_SECRET` não estiverem setados.

---

## Entrega

Repositório privado com acesso ao usuário `soat-architecture` no GitHub.
