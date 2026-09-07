# Políticas de alerta — New Relic

Policy única: **`Oficina — Alertas`**, conta do grupo (região US).
Destino das notificações: **workflow com destination de e-mail do grupo** (Alerts → Destinations → Email → Workflows → `Oficina — Alertas` → notificar todas as issues).

As quatro condições abaixo cobrem o bloco "Monitoramento e Observabilidade" do enunciado. A condição 1 é a exigida explicitamente ("alerta de falha no processamento de ordens de serviço") e é a que deve ser demonstrada com disparo real no vídeo.

---

## 1. Falha no processamento de ordens de serviço — **Critical**

Condição NRQL:

```sql
SELECT count(*) FROM Log
WHERE (level = 'error' OR numeric(level) >= 50)
  AND (event LIKE 'os.%' OR event = 'integration.error')
```

| Parâmetro | Valor |
|---|---|
| Tipo | NRQL, static |
| Threshold | `above 0` por **5 minutos** → Critical |
| Janela de agregação | 1 minuto, event timer/flow |
| Sinal perdido | não abrir issue (o app pode ficar legitimamente sem erros) |

**Por que o filtro de nível é duplo (`level = 'error' OR numeric(level) >= 50`):** o `pino` serializa o nível como número (`50` = error), enquanto o agente APM Node, quando encaminha os logs (`NEW_RELIC_APPLICATION_LOGGING_FORWARDING_ENABLED=true` em [k8s/base/app-deployment.yaml](../../k8s/base/app-deployment.yaml)), envia o rótulo em texto. Como as duas rotas de ingestão estão ativas hoje (ver "Fonte dupla de logs" no [runbook](README.md)), o filtro precisa aceitar as duas formas — só com `level = 'error'` a condição **não dispara** para os registros vindos do Fluent Bit. Depois de consolidar uma única fonte, simplificar para a forma que sobrar.

**Como simular** (fazer em **homolog**, avisando o grupo antes):

```bash
# 1. quebra o SMTP: host inexistente
kubectl -n homolog patch configmap oficina-config \
  --type merge -p '{"data":{"SMTP_HOST":"smtp-invalido.local"}}'
kubectl -n homolog rollout restart deployment/oficina-api
kubectl -n homolog rollout status deployment/oficina-api --timeout=300s

# 2. gera uma notificação: criar OS e mover o status pela API (collection Bruno,
#    pasta bruno/Oficina-API/OrdensServico) -> o NotificadorSmtpGateway falha e loga
#    { event: "integration.error", integration: "smtp", ... }

# 3. confere o log e espera o alerta (até ~6 min: 5 min de threshold + ingestão)
#    NRQL: SELECT * FROM Log WHERE event = 'integration.error' SINCE 15 minutes ago

# 4. REVERTE (não esquecer)
kubectl -n homolog patch configmap oficina-config \
  --type merge -p '{"data":{"SMTP_HOST":"mailhog"}}'
kubectl -n homolog rollout restart deployment/oficina-api
```

Evidência para o PDF/vídeo: e-mail recebido + a issue aberta em Alerts → Issues & activity.

---

## 2. API fora do ar (healthcheck) — **Critical**

Tipo: condição de **Synthetics monitor failure**, cobrindo os dois monitores de healthcheck:

- `oficina-health-homolog` — ping em `https://<api_endpoint homolog>/health`
- `oficina-health-prod` — ping em `https://<api_endpoint prod>/health`

| Parâmetro | Valor |
|---|---|
| Threshold | 2 falhas consecutivas (evita alarme por blip de rede) |
| Período do monitor | 5 minutos, localidade US East |

A URL é o endpoint do **API Gateway**, não o LoadBalancer do EKS: assim o uptime mede a cadeia inteira (gateway → LB → EKS → app), que é o que o usuário final enxerga.

---

## 3. Latência alta em produção — **Warning**

```sql
SELECT percentile(duration, 95) FROM Transaction WHERE appName = 'oficina-api-prod'
```

| Parâmetro | Valor |
|---|---|
| Threshold | `above 1` (segundo) por **5 minutos** → Warning |
| Janela de agregação | 1 minuto |

`duration` em `Transaction` é em **segundos** — o threshold `1` significa p95 acima de 1s.

---

## 4. Pods saturados (CPU) — **Warning**

```sql
SELECT average(cpuCoresUtilization) FROM K8sContainerSample
WHERE clusterName = 'oficina-eks' AND containerName = 'oficina-api'
```

| Parâmetro | Valor |
|---|---|
| Threshold | `above 90` (%) por **10 minutos** → Warning |

Complementa o HPA em vez de duplicá-lo: o HPA escala em 70% de CPU (`k8s/base/app-hpa.yaml`); se a utilização fica acima de 90% por 10 minutos, é sinal de que a escalada não deu conta (teto de réplicas ou falta de nós), o que exige ação humana.

---

## Checklist de criação na UI

1. Alerts → Alert policies → **Create** → nome `Oficina — Alertas` → incident preference **por condição**.
2. Criar as 4 condições acima (as 3 NRQL via "NRQL query"; a 2 via "Synthetics monitor failure").
3. Alerts → Destinations → **Email** → e-mail do grupo.
4. Alerts → Workflows → novo workflow filtrando `policyName = 'Oficina — Alertas'` → destination criada acima.
5. Rodar a simulação da condição 1 e guardar o print do e-mail.
