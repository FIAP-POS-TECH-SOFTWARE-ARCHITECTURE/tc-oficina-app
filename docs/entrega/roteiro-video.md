# Roteiro do vídeo de demonstração — Fase 3

Limite: **15 minutos**. A minutagem abaixo tem folga de ~1 min para imprevistos.
Gravar com o lab AWS Academy renovado (`scripts/aws-academy-refresh.ps1` rodado na hora),
os dois ambientes saudáveis e tráfego já gerado nos últimos dias para os dashboards terem
dados.

| Tempo | Cena | O que mostrar |
|---|---|---|
| 0:00–1:00 | Abertura | Nome do grupo (Integradores), visão da arquitetura em 30s com `docs/arquitetura/componentes.md` na tela |
| 1:00–3:00 | Autenticação com CPF | `POST /auth/token` no API Gateway: CPF válido → `200` + JWT em tela; CPF malformado → `400`; CPF inexistente → `401`. Colar o JWT em jwt.io e mostrar `type: "cliente"` |
| 3:00–5:00 | APIs protegidas | `GET /os/acompanhamento/:numero` sem token → `401`; com token → `200`; token de outro cliente → `403`. Aprovar orçamento autenticado (`POST /os/:numero/orcamento/aprovar`) |
| 5:00–8:00 | CI/CD + deploy automático | Abrir um PR pequeno no app (ex.: texto de log), CI rodando; merge em `develop` → acompanhar o job de deploy de homolog ao vivo até o smoke test `/health`; mostrar branch protection bloqueando push direto na `main` |
| 8:00–9:30 | Infra como código | `tc-oficina-infra-k8s` / `tc-oficina-infra-db`: workflow de apply, EKS e RDS no console AWS, namespaces `homolog` e `prod` |
| 9:30–12:00 | Dashboards com análise ao vivo | Dashboards Operação e Plataforma no New Relic: volume diário de OS, tempo médio por status, erros de integração, latência, CPU/memória. Comentar os números |
| 12:00–13:30 | Logs e traces | Chamada com um `x-request-id` conhecido; achar os logs correlacionados no New Relic pelo `requestId`; abrir um distributed trace; mostrar o alerta de falha de OS disparado |
| 13:30–14:00 | Encerramento | Recap dos 4 repositórios + documentação de arquitetura e observabilidade |

## Checklist de pré-gravação

- [ ] Lab Academy renovado + `scripts/aws-academy-refresh.ps1` rodado (propaga os secrets para os 4 repositórios)
- [ ] `develop` do app sincronizado com `main` e CD de homolog verde
- [ ] CD de `main` (prod) re-executado com o lab ativo (as falhas de `Login no ECR` / `Terraform apply` no histórico são expiração de credencial Academy, não código)
- [ ] Os 2 ambientes respondendo em `/health`
- [ ] Tráfego gerado nos últimos dias para os dashboards terem série temporal
- [ ] Um cliente de teste com OS aguardando aprovação em homolog
- [ ] PR pequeno preparado para a cena da pipeline
- [ ] Dashboards, Synthetics e política de alertas criados na UI do New Relic (ver `docs/observabilidade/README.md`)

## Pós-gravação

- [ ] Editar para ≤15 min
- [ ] Subir no YouTube como **não listado**
- [ ] Testar o link em janela anônima
- [ ] Preencher o link no `docs/entrega/entrega-fase-3.md` e no documento Word de entrega
