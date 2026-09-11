# RFC-003: Estratégia de autenticação do cliente

- **Status:** Aprovada
- **Autores:** Lucas Gardini Dias (RM 372237), Thiago Aio (RM 372238)
- **Data:** 2026-09-10

## Contexto e problema

O enunciado da Fase 3 exige que o cliente se autentique **por CPF**, através de uma
**função serverless** que consulta a base de clientes da oficina e emite uma credencial de
acesso. Essa credencial precisa ser exigida pelo API Gateway nas rotas sensíveis do cliente
e validada também pela API da oficina, que continua atendendo usuários internos com o
mecanismo de usuário/senha da Fase 2.

## Opções consideradas

- **Amazon Cognito** (user pool + trigger Lambda)
- **Auth0** (ou outro IdP gerenciado externo)
- **Lambda própria emitindo JWT HS256 + Lambda Authorizer no API Gateway**

## Comparação

| Critério | Cognito | Auth0 | Lambda própria + JWT HS256 |
| --- | --- | --- | --- |
| "Function serverless que consulta a tabela `clientes`" | Não nativo; exigiria triggers e sincronização de diretório | Não; base de identidade externa | É exatamente isso |
| Login só por CPF (sem senha) | Fluxo fora do padrão; exigiria custom auth challenge | Custom database connection | Trivial: valida dígitos + `SELECT` |
| Disponibilidade no AWS Academy | Restrito | Serviço externo, conta à parte | Sem dependência extra |
| Validação idêntica no gateway e no app | Precisa de JWKS/RS256 nos dois lados | Idem | Segredo HS256 único compartilhado via SSM |
| Custo | Free tier, mas com limites de MAU | Free tier limitado | Zero |

## Decisão

**Lambda própria** (`oficina-auth-token`) que normaliza e valida o CPF, consulta
`clientes` no RDS e, se houver cliente **ativo**, assina um **JWT HS256** com
`{ sub, cpf, type: "cliente", exp: +1h }`. As rotas sensíveis do cliente no API Gateway são
protegidas por um **Lambda REQUEST authorizer** (`oficina-auth-authorizer`) que revalida o
token. A API da oficina revalida o mesmo JWT no `JwtAuthGuard` e usa o claim `type` para
separar rota de cliente (`@ClienteAuth()`) de rota interna.

O segredo HS256 é único por ambiente, compartilhado entre Lambda e app via SSM Parameter
Store (`/oficina/<env>/jwt-secret`).

## Consequências e riscos

- **Positivo:** implementação mínima e alinhada 1:1 ao requisito; validação idêntica em
  três pontos (authorizer, guard do app) sem infraestrutura de chave pública; sem serviço
  ou conta externa.
- **Trade-off — HS256 com segredo compartilhado:** qualquer serviço que valida também
  poderia assinar. Aceitável porque ambos os validadores são do mesmo grupo; a evolução
  natural é RS256 com JWKS. Registrado em
  [ADR-003](../adrs/adr-003-jwt-hs256-segredo-compartilhado.md).
- **Rotação de segredo:** trocar o parâmetro SSM + `rollout` do app + `terraform apply` da
  Lambda. Tokens em circulação (exp 1h) continuam válidos até expirar.
- **Latência do authorizer:** mitigada pelo TTL de cache de 300s no API Gateway
  ([ADR-002](../adrs/adr-002-api-gateway-http-com-lambda-authorizer.md)).
- **Fluxo completo** em
  [sequencia-autenticacao.md](../sequencia-autenticacao.md).
