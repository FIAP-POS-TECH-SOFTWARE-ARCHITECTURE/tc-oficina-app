# ADR-005: HPA por CPU

- **Status:** Aceita
- **Data:** 2026-09-10

## Contexto

O enunciado exige escalabilidade automática da aplicação no Kubernetes. É preciso escolher
a métrica de escala e a faixa de réplicas, com a fonte de métricas provisionada por IaC.

## Decisão

**HorizontalPodAutoscaler** (`autoscaling/v2`) sobre o `Deployment` `oficina-api`:

- `minReplicas: 2`, `maxReplicas: 10`.
- Métrica: `Resource` / `cpu`, `Utilization`, `averageUtilization: 70` (equivalente ao
  `targetCPUUtilizationPercentage: 70` do `autoscaling/v1`).
- Fonte de métricas: **`metrics-server`** instalado via Helm no repositório
  `tc-oficina-infra-k8s` (`addons.tf`), tratado como requisito do cluster.
- Manifests em `k8s/base/app-hpa.yaml`, aplicados nos dois namespaces.

## Consequências (positivas e negativas)

- **Positivo:** CPU é a métrica mais simples e previsível para uma API HTTP CRUD; o
  `metrics-server` já é necessário para `kubectl top` e não adiciona operação relevante.
- **Positivo:** `minReplicas: 2` garante disponibilidade durante rollout e queda de um pod;
  `maxReplicas: 10` limita o consumo no node group do Academy.
- **Negativo:** CPU não captura saturação por I/O de banco ou por memória — uma carga com
  muitas queries lentas pode degradar a latência sem disparar escala. O alerta "pods
  saturados" (CPU > 90% por 10 min) cobre parcialmente o caso em que a escala não dá conta.
- **Negativo:** o teto de 10 réplicas mais o tamanho do node group podem limitar a escala
  real sob carga alta; monitorado pelo widget "réplicas x HPA" do dashboard de plataforma.
- **Evolução:** métricas customizadas (RPS, profundidade de fila, p95 de latência) via
  adapter Prometheus quando houver necessidade.
