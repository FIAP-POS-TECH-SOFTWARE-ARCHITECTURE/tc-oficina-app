# Tech Challenge — Fase 3 — Grupo Integradores

> Fonte Markdown do documento de entrega. O PDF submetido no Portal do Aluno é gerado a
> partir deste conteúdo (mais o diagrama de componentes como imagem).

## Integrantes

| Nome completo | RM | Discord | E-mail |
|---|---|---|---|
| Lucas Gardini Dias | 372237 | @kowalskijr | `«PREENCHER»` |
| Thiago Aio | 372238 | @thiag0___ | `«PREENCHER»` |

## Repositórios

Todos na organização `FIAP-POS-TECH-SOFTWARE-ARCHITECTURE`, **públicos**, cada um com CI e CD próprios:

1. Aplicação principal (NestJS, Clean Architecture): <https://github.com/FIAP-POS-TECH-SOFTWARE-ARCHITECTURE/tc-oficina-app>
2. Função Serverless de autenticação por CPF (AWS Lambda + API Gateway): <https://github.com/FIAP-POS-TECH-SOFTWARE-ARCHITECTURE/tc-oficina-lambda-auth>
3. Infraestrutura Kubernetes (Terraform: VPC, EKS, ECR): <https://github.com/FIAP-POS-TECH-SOFTWARE-ARCHITECTURE/tc-oficina-infra-k8s>
4. Infraestrutura de Banco de Dados (Terraform: RDS PostgreSQL): <https://github.com/FIAP-POS-TECH-SOFTWARE-ARCHITECTURE/tc-oficina-infra-db>

## Arquitetura da solução

A base da Fase 2 (API NestJS em Clean Architecture, EKS, RDS, ECR, Terraform, CI/CD no
GitHub Actions) foi decomposta em quatro repositórios e ganhou uma camada de borda: um
**API Gateway HTTP API** na frente da aplicação, com autenticação de cliente por CPF
resolvida por duas funções **AWS Lambda** (Node.js 22) — uma emite o JWT, outra atua como
Lambda Authorizer nas rotas sensíveis. Homologação e produção são separados por namespace
no cluster (`homolog`/`prod`) e por banco lógico no RDS (`oficina_homolog`/`oficina_prod`).

Diagrama de componentes, diagramas de sequência, contratos entre repositórios (SSM
Parameter Store, Terraform remote state em S3), RFCs, ADRs e DER: [`docs/arquitetura/`](../arquitetura/README.md).

### Recursos escolhidos

- **API Gateway HTTP API** — borda única; `POST /auth/token` pública e rotas de cliente protegidas por Lambda Authorizer (REQUEST, cache 300s); catch-all `ANY /{proxy+}` para as demais rotas.
- **AWS Lambda** (Node.js 22, `LabRole`, sem VPC) — `token` (valida CPF, consulta cliente ativo no RDS, assina JWT HS256 exp 1h com `type: "cliente"`) e `authorizer` (valida assinatura e claim).
- **Amazon EKS** (nodes t3.medium) — Deployment 2+ réplicas com probes/resources, Service LoadBalancer, ConfigMap/Secret, namespaces `homolog` e `prod`.
- **HPA** — 2 a 10 réplicas por CPU (70%), com `metrics-server` provisionado pelo Terraform do cluster.
- **Amazon RDS PostgreSQL** (db.t3.micro, engine 18) — instância única, bancos lógicos `oficina_homolog` e `oficina_prod`.
- **Amazon ECR** — imagem Docker da API versionada por SHA do commit.
- **Terraform** — cluster/rede/ECR em `tc-oficina-infra-k8s`, RDS e SSM em `tc-oficina-infra-db`, `tfstate` remoto em S3.
- **SSM Parameter Store** — contrato de configuração entre repositórios (`database-url`, `jwt-secret`, `app-lb-hostname`), namespaceado por ambiente.
- **GitHub Actions** — CI (lint/build/testes/e2e, `terraform fmt/validate/plan`) e CD por branch (`develop` → homolog, `main` → prod) nos quatro repositórios; branch protection com PR obrigatório na `main`.
- **New Relic** — APM na aplicação, `nri-bundle` (Fluent Bit) para logs do cluster, Synthetics para uptime, dashboards Operação e Plataforma, política de alertas.
- **SMTP** (Nodemailer; Mailhog em desenvolvimento) — notificação de cliente por e-mail nas mudanças de status da OS.

## Autenticação de cliente via CPF

`POST /auth/token` no gateway com o CPF no corpo → a Lambda `token` normaliza o CPF,
verifica cliente ativo no banco e devolve `{ token, expiresIn: 3600 }`. Erros: `400` para
CPF malformado, `401` genérico para CPF inexistente ou cliente inativo (não diferencia, para
não vazar a base).

Rotas sensíveis (`GET /os/acompanhamento/{numero}`, `POST /os/{numero}/orcamento/aprovar` e
`/rejeitar`): o gateway chama o Lambda Authorizer, que exige `Authorization: Bearer <token>`,
valida a assinatura HS256 (segredo compartilhado via SSM) e o claim `type: "cliente"`. A
aplicação revalida o JWT no `JwtAuthGuard`. Token de outro cliente na rota de acompanhamento
→ `403`; OS inexistente → `404`. As integrações de proxy propagam `x-request-id` para
correlação de logs.

## Observabilidade

Telemetria centralizada no New Relic. Logs JSON estruturados (`nestjs-pino`) com `requestId`
propagado do header `x-request-id` via `AsyncLocalStorage` — o mesmo id aparece no gateway,
na Lambda e na aplicação. Dashboards de Operação (volume diário de OS, tempo médio por
status, erros de integração) e Plataforma (latência, throughput, CPU/memória). Synthetics +
probes do Kubernetes para uptime. Política `Oficina — Alertas` com 4 condições, incluindo
falha no processamento de OS. Detalhes e runbook: [`docs/observabilidade/`](../observabilidade/README.md).

## Documentação arquitetural

- Diagrama de componentes: [`docs/arquitetura/componentes.md`](../arquitetura/componentes.md)
- Diagramas de sequência: [`sequencia-autenticacao.md`](../arquitetura/sequencia-autenticacao.md), [`sequencia-abertura-os.md`](../arquitetura/sequencia-abertura-os.md)
- RFCs: [`docs/arquitetura/rfcs/`](../arquitetura/rfcs/)
- ADRs: [`docs/arquitetura/adrs/`](../arquitetura/adrs/)
- Justificativa do banco + DER: [`docs/arquitetura/banco-de-dados.md`](../arquitetura/banco-de-dados.md)

## Vídeo de demonstração

`«PREENCHER: link YouTube (não listado) — duração MM:SS»`

## Acesso do avaliador

Os 4 repositórios estão **públicos** — acesso livre de leitura, incluindo commits, Pull
Requests, execuções de Actions e regras de branch protection. Decisão do grupo
(2026-09-10): não adicionar o usuário `soat-architecture` como colaborador; os repositórios
públicos cumprem esse requisito.

## Links de entrega

| Item | Link |
|---|---|
| tc-oficina-app | <https://github.com/FIAP-POS-TECH-SOFTWARE-ARCHITECTURE/tc-oficina-app> |
| tc-oficina-lambda-auth | <https://github.com/FIAP-POS-TECH-SOFTWARE-ARCHITECTURE/tc-oficina-lambda-auth> |
| tc-oficina-infra-k8s | <https://github.com/FIAP-POS-TECH-SOFTWARE-ARCHITECTURE/tc-oficina-infra-k8s> |
| tc-oficina-infra-db | <https://github.com/FIAP-POS-TECH-SOFTWARE-ARCHITECTURE/tc-oficina-infra-db> |
| Documentação de arquitetura | <https://github.com/FIAP-POS-TECH-SOFTWARE-ARCHITECTURE/tc-oficina-app/tree/main/docs/arquitetura> |
| Documentação de observabilidade | <https://github.com/FIAP-POS-TECH-SOFTWARE-ARCHITECTURE/tc-oficina-app/tree/main/docs/observabilidade> |
| Swagger (local) | `http://localhost:3000/docs` |
| Collections Bruno/Postman | `tc-oficina-app/bruno/`, `tc-oficina-lambda-auth/bruno/` |
| Deploy ativo | `«PREENCHER: URL do API Gateway de homolog — conta AWS Academy, sob demanda»` |
| Vídeo | `«PREENCHER: URL do YouTube»` |
