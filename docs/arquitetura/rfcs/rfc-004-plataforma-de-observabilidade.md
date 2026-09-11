# RFC-004: Plataforma de observabilidade

- **Status:** Aprovada
- **Autores:** Lucas Gardini Dias (RM 372237), Thiago Aio (RM 372238)
- **Data:** 2026-09-10

## Contexto e problema

O bloco "Monitoramento e Observabilidade" do enunciado exige: latência das APIs, uso de
CPU/memória do Kubernetes, healthcheck/uptime, alerta de falha no processamento de OS, logs
estruturados com correlação e três dashboards. É preciso uma plataforma que cubra APM,
métricas de Kubernetes, logs e alertas — de preferência num produto só — e que **não expire
antes da correção e do vídeo**.

## Opções consideradas

- **New Relic** (free tier perpétuo, 100 GB/mês)
- **Datadog** (trial de 14 dias)
- **Prometheus + Grafana + Loki** (self-hosted no cluster)

## Comparação

| Critério | New Relic | Datadog | Prometheus + Grafana + Loki |
| --- | --- | --- | --- |
| Validade do plano gratuito | Perpétuo (100 GB/mês) | Trial expira em 14 dias | Sem custo de licença |
| APM Node + métricas K8s + logs num produto | Sim | Sim | Três componentes a operar |
| Esforço operacional | Agente APM + `nri-bundle` (Helm) | Agente + integração K8s | Manter stack própria (storage, retenção, HA) |
| Alertas + Synthetics gerenciados | Incluídos | Incluídos | Alertmanager + blackbox exporter próprios |
| Consumo da cota | 100 GB/mês cobre a demo folgado | N/A após trial | Limitado pelo disco do cluster |

## Comparação — resumo

O trial do Datadog expiraria no meio da janela de avaliação, deixando os dashboards do
vídeo sem dados. Prometheus + Grafana + Loki não tem custo de licença, mas transferiria
para o grupo a operação de uma stack de observabilidade inteira (retenção, storage, alta
disponibilidade) — trabalho que não agrega à entrega. O New Relic free tier resolve APM,
Kubernetes, logs, Synthetics e alertas num produto só, com cota mais que suficiente.

## Decisão

**New Relic** (free tier, região US, conta única do grupo). Três fontes de telemetria:

- **Agente APM Node** na `oficina-api` (`tc-oficina-app`) — `Transaction` (latência,
  throughput, erro), distributed tracing e encaminhamento dos logs da aplicação.
- **`nri-bundle`** no cluster (`tc-oficina-infra-k8s`) — `K8sContainerSample`/`K8sPodSample`/
  `K8sDeploymentSample` (CPU/memória/réplicas) + logs de todos os pods via Fluent Bit.
- **CloudWatch** da Lambda de autenticação.

Dashboards (`Oficina — Operação`, `Oficina — Plataforma`) e políticas de alerta são
criados na UI e **exportados como JSON versionado** em
[`docs/observabilidade/`](../../observabilidade/).

## Consequências e riscos

- **Positivo:** cobertura completa dos requisitos num produto; correlação log↔trace nativa
  (`trace.id`, "logs in context"); custo zero e sem prazo.
- **Risco — cota de 100 GB:** hoje duas rotas de ingestão de log estão ativas ao mesmo
  tempo (agente APM + Fluent Bit), dobrando o volume. Precisa ser consolidado antes de
  confiar nas contagens; detalhado na seção 6 do
  [runbook de observabilidade](../../observabilidade/README.md).
- **Risco — conta única no lab:** se a conta/licença for perdida, os dashboards são
  recriados a partir dos JSONs versionados.
- **Ação manual:** montagem de dashboards, Synthetics e alertas na UI, e o teste de disparo
  real do alerta de falha de OS, não são automatizáveis.
