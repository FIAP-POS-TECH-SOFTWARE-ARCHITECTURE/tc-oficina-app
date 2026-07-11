# Kubernetes — Oficina API

Manifestos de deploy da aplicação. A raiz `k8s/` contém os manifestos **de produção**
(aplicáveis tanto em minikube quanto em EKS). `k8s/local/` contém dependências que
**só existem para validação local no minikube** — em produção o banco é o RDS
provisionado via Terraform (`infra/`) e o SMTP é um provedor real.

## Arquivos

| Arquivo | Recurso | Observação |
|---|---|---|
| `app-configmap.yaml` | ConfigMap `oficina-config` | Config **não sensível** (PORT, JWT_EXPIRES_IN, SMTP_HOST/PORT/FROM) |
| `app-secret.yaml.example` | Secret `oficina-secrets` (template) | Extensão `.example` impede o `kubectl apply -f k8s/` de aplicá-lo por engano — criar via `kubectl` (abaixo). NÃO commitar valores reais |
| `app-deployment.yaml` | Deployment `oficina-api` | 2 réplicas, probes, `resources.requests/limits` |
| `app-service.yaml` | Service `oficina-api` | `LoadBalancer` (EKS) / `minikube service` (local) |
| `app-hpa.yaml` | HPA `oficina-api-hpa` | CPU 70%, 2→10 réplicas (`autoscaling/v2`) |
| `local/postgres.yaml` | Postgres + PVC + Service | **Só minikube** |
| `local/mailhog.yaml` | Mailhog + Service | **Só minikube** |

## Pré-requisitos (minikube)

```bash
minikube start
minikube addons enable metrics-server   # OBRIGATÓRIO — sem ele o HPA fica <unknown> e não escala
```

## Ordem de aplicação (minikube)

```bash
# 1. Construir a imagem DENTRO do minikube (o Deployment usa imagePullPolicy: IfNotPresent)
minikube image build -t oficina-api:local .

# 2. Dependências locais (banco + mailhog)
kubectl apply -f k8s/local/

# 3. Secret (NUNCA commitado — DATABASE_URL aponta para o Service `postgres` interno)
kubectl create secret generic oficina-secrets \
  --from-literal=DATABASE_URL='postgresql://postgres:password@postgres:5432/oficina' \
  --from-literal=JWT_SECRET='dev-secret' \
  --from-literal=ADMIN_BOOTSTRAP_EMAIL='admin@oficina.local' \
  --from-literal=ADMIN_BOOTSTRAP_PASSWORD='ChangeMe!123' \
  --from-literal=SMTP_USER='' \
  --from-literal=SMTP_PASS=''

# 4. Aplicação (ConfigMap + Deployment + Service + HPA)
kubectl apply -f k8s/

# 5. Acompanhar
kubectl get pods -w        # aguardar 2/2 Running, READY 1/1
kubectl get hpa            # TARGETS deve sair de <unknown> e mostrar % de CPU
```

> A primeira subida dos pods pode levar ~1–2 min: o `startupProbe` aguarda o entrypoint
> rodar `prisma migrate deploy` + seed antes de liberar liveness/readiness.

## Acesso à aplicação (minikube)

```bash
minikube service oficina-api --url     # imprime a URL (ex.: http://127.0.0.1:PORTA)
curl $(minikube service oficina-api --url)/health   # {"status":200,...,"data":{"status":"ok"}}
```

Alternativa: `minikube tunnel` (em outro terminal) para que o Service `LoadBalancer`
receba um EXTERNAL-IP acessível.

## Diferenças local × EKS

| Aspecto | Local (minikube) | Produção (EKS) |
|---|---|---|
| Banco | `k8s/local/postgres.yaml` (Service `postgres`) | RDS via Terraform; `DATABASE_URL` no Secret aponta para o endpoint do RDS |
| SMTP | Mailhog (`k8s/local/mailhog.yaml`) | Provedor real; `SMTP_HOST` sobrescrito no ConfigMap |
| Imagem | `oficina-api:local` construída no minikube | Imagem do ECR; pipeline faz `kubectl set image` |
| Service | `minikube service` / `tunnel` | `LoadBalancer` com ELB real |
| Métricas p/ HPA | addon `metrics-server` | metrics-server instalado no cluster |

## Troubleshooting

- **HPA `TARGETS: <unknown>`** → metrics-server ausente ou ainda coletando. Habilite o addon
  e aguarde ~30s. O HPA exige `resources.requests.cpu` no Deployment (já configurado).
- **Pod em `ImagePullBackOff`** → a imagem `oficina-api:local` não existe no minikube. Rode o
  `minikube image build` (passo 1). `imagePullPolicy: IfNotPresent` impede busca em registry.
- **Pod em `CrashLoopBackOff` no boot** → checar `kubectl logs <pod>`; geralmente `DATABASE_URL`
  incorreta no Secret (deve usar o host `postgres`, não `localhost`).

## Teste de carga (K6) — demonstração do HPA

Script em [`k6/load-test.js`](../k6/load-test.js). Gera carga em `GET /health` (público, isento
de rate limit) para elevar a CPU acima de 70% e disparar o autoscaling.

```bash
# terminal 1 — acompanhar o HPA escalar:
kubectl get hpa oficina-api-hpa -w

# terminal 2 — disparar a carga:
k6 run -e BASE_URL=$(minikube service oficina-api --url) k6/load-test.js
```

Esperado: a coluna `REPLICAS` do HPA sobe de 2 conforme a CPU passa de 70% (até no máx. 10),
e volta a 2 alguns minutos após o fim do teste (cooldown padrão do HPA).

> **Se não escalar:** a carga de `/health` pode ser leve demais para saturar a CPU. Reduza
> `resources.requests.cpu` do Deployment (ex.: `50m`), reaplique (`kubectl apply -f k8s/app-deployment.yaml`)
> e repita — assim uma utilização menor já ultrapassa os 70%.

