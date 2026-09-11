# ADR-003: JWT HS256 com segredo compartilhado via SSM

- **Status:** Aceita
- **Data:** 2026-09-10

## Contexto

A Lambda `oficina-auth-token` assina o token do cliente e três pontos o validam: o Lambda
authorizer do API Gateway e o `JwtAuthGuard` da API da oficina. Todos precisam concordar
sobre o algoritmo e a chave. RS256 exigiria distribuir uma chave pública (JWKS endpoint ou
arquivo versionado) e gerir o par de chaves.

## Decisão

**JWT HS256** com **um segredo por ambiente**, gerado pelo Terraform do `tc-oficina-infra-db`
(`random_password`) e publicado em `/oficina/<env>/jwt-secret` (SSM, `SecureString`). A
Lambda lê o parâmetro para assinar; authorizer e app leem o mesmo parâmetro para validar.

Payload do token: `{ sub: <clienteId>, cpf, type: "cliente", exp: now + 1h }`. O claim
`type` separa token de cliente de token de usuário interno (também HS256, mesmo segredo,
emitido pela própria API).

## Consequências (positivas e negativas)

- **Positivo:** validação idêntica e trivial nos três pontos, sem endpoint JWKS nem
  rotação de par de chaves; o segredo nunca sai do SSM (nem para o repositório, nem entre
  repositórios — só o nome do parâmetro é contrato).
- **Positivo:** expiração curta (1h) limita a janela de uso de um token vazado.
- **Negativo:** com segredo simétrico, qualquer serviço que valida também poderia assinar
  um token válido. Aceitável porque assinantes e validadores são todos do mesmo grupo e
  ambiente; num cenário multi-time, RS256 isolaria a capacidade de assinar.
- **Negativo — rotação:** trocar o segredo exige `terraform apply` (infra-db) + `rollout`
  do app + `terraform apply` da Lambda, numa ordem coordenada; tokens já emitidos seguem
  válidos até `exp`.
- **Evolução:** migrar para **RS256 com JWKS** quando houver necessidade de separar quem
  assina de quem valida, ou consumidores externos ao grupo.
