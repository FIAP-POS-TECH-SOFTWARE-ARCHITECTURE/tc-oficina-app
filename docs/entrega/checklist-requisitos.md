# Checklist final de requisitos — Fase 3

Cada linha liga um requisito do enunciado à evidência no código, na infraestrutura ou no
vídeo. Revisão cruzada: um integrante confere os itens que o outro implementou.

| Requisito do enunciado | Evidência |
|---|---|
| API Gateway implementado | `tc-oficina-lambda-auth/terraform/gateway.tf` (HTTP API, rotas e integrações) + URL de deploy no README da lambda |
| Rotas sensíveis protegidas com auth via CPF | `gateway.tf` (`authorization_type = CUSTOM` nas rotas `/os/acompanhamento`, `/orcamento/aprovar`, `/rejeitar`) + `tc-oficina-app` `src/common/guards/jwt-auth.guard.ts` e `src/common/decorators/cliente-auth.decorator.ts` + vídeo 3:00 |
| Function valida CPF | `tc-oficina-lambda-auth/src/lib/cpf.ts` + `test/cpf.spec.ts` |
| Function consulta existência e status do cliente | `tc-oficina-lambda-auth/src/lib/db.ts` (checa cliente ativo) + `test/token.spec.ts` (caso `401` para inativo/inexistente) |
| Function gera e devolve JWT | `tc-oficina-lambda-auth/src/lib/jwt.ts` + `src/handlers/token.ts` + `test/token.spec.ts` + vídeo 1:00 |
| 4 repositórios com CI/CD e deploy automático | 4 repos com `.github/workflows/ci.yml` + `cd.yml`; runs de CI verdes nos PRs. CD de prod re-executado com o lab ativo antes da avaliação (as falhas no histórico são expiração de credencial AWS Academy no `Login no ECR` / `Terraform apply`, não código) |
| `main` protegida, PR obrigatório | branch protection nos 4 repos (`required_approving_review_count: 1`, `enforce_admins: true`, force-push desabilitado) + template de PR + vídeo 5:00 (push direto bloqueado) |
| Deploy automático homolog e prod | `cd.yml` dispara em `push` para `develop` (homolog) e `main` (prod); job "Definir ambiente pela branch" seleciona o alvo. `develop` sincronizado com `main` e CD de homolog exercitado antes da gravação |
| Banco gerenciado via Terraform | `tc-oficina-infra-db` (RDS `db.t3.micro`, bancos lógicos `oficina_homolog`/`oficina_prod`, parâmetros SSM) |
| Cluster K8s escalável via Terraform | `tc-oficina-infra-k8s` (VPC, EKS, node group, `metrics-server`) + `tc-oficina-app/k8s/base/app-hpa.yaml` (HPA 2–10, CPU 70%) |
| Latência das APIs monitorada | dashboard Plataforma (`docs/observabilidade/dashboard-plataforma.json`) |
| CPU/memória do K8s monitorados | dashboard Plataforma (`dashboard-plataforma.json`) |
| Healthchecks e uptime | Synthetics (New Relic) + probes `liveness`/`readiness`/`startup` em `k8s/base/app-deployment.yaml` |
| Alertas de falha no processamento de OS | política `Oficina — Alertas` (`docs/observabilidade/alertas.md`, condição sobre `integration.error` / `level = error`) + e-mail de disparo |
| Logs estruturados JSON com correlação | `nestjs-pino` + `requestId` do header `x-request-id` via `AsyncLocalStorage`; busca por `requestId` no New Relic + vídeo 12:00 |
| Dashboard volume diário de OS | dashboard Operação (`docs/observabilidade/dashboard-operacao.json`, evento `os.created`) |
| Dashboard tempo médio por status | dashboard Operação (`dashboard-operacao.json`, evento `os.status.changed`) |
| Dashboard erros de integrações | dashboard Operação (`dashboard-operacao.json`, evento `integration.error`) |
| Diagrama de componentes | `docs/arquitetura/componentes.md` |
| Diagramas de sequência (auth + abertura OS) | `docs/arquitetura/sequencia-autenticacao.md`, `docs/arquitetura/sequencia-abertura-os.md` |
| RFCs | `docs/arquitetura/rfcs/` (4 RFCs) |
| ADRs | `docs/arquitetura/adrs/` (6 ADRs) |
| Justificativa do banco + ER | `docs/arquitetura/banco-de-dados.md` (justificativa PostgreSQL/RDS + `erDiagram` completo) |
| READMEs completos (itens obrigatórios ✱) | os 4 READMEs: Propósito, Tecnologias, Arquitetura, Como executar localmente, Deploy, Links (Swagger/collection) |
| Dockerfiles quando aplicável | `tc-oficina-app/Dockerfile` (+ `docker-compose.yml`); a lambda empacota via `esbuild` + zip, sem imagem |
| Links de deploys ativos | seção Links dos READMEs (nota: conta AWS Academy, disponível sob demanda) |
| Vídeo ≤15 min | `docs/entrega/roteiro-video.md` + link no documento de entrega |
| PDF com links + nota de repos públicos | `docs/entrega/entrega-fase-3.md` → PDF submetido no Portal do Aluno |

## Pendências antes da submissão

- [ ] Criar dashboards, Synthetics e política de alertas na UI do New Relic e trocar o `accountId` placeholder nos JSON
- [ ] Teste de disparo real do alerta de falha de OS (quebrar SMTP em homolog)
- [ ] Sincronizar `develop` com `main` e rodar o CD de homolog
- [ ] Re-executar o CD de prod com o lab AWS Academy ativo
- [ ] Revisão cruzada campo a campo do DER por quem não o escreveu
- [ ] Gravar, editar e subir o vídeo; preencher o link
- [ ] Exportar o PDF, clicar em cada link, submeter no Portal do Aluno
