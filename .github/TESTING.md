# Testando o CI/CD de ponta a ponta

Roteiro completo para validar o fluxo de CD (build da imagem → push no ECR → migração do banco → deploy no EKS → smoke test) a partir da sua máquina, antes e depois de disparar o pipeline de verdade.

> **Dependência:** a infraestrutura precisa estar de pé (siga [infra/TESTING.md](../infra/TESTING.md) até o passo 6 — cluster com nodes `Ready`, secret `oficina-secrets` criado e manifestos aplicados). Sem isso, só os passos 2 e 3 funcionam.

## Pré-requisitos

- AWS CLI instalado (`aws --version`)
- kubectl instalado (`kubectl version --client`)
- Docker rodando (`docker info`)
- gh CLI autenticado (`gh auth status`)
- Sessão do AWS Academy ativa e credenciais renovadas (`.\scripts\aws-academy-refresh.ps1`)

## 1. Conferir credenciais e secrets do GitHub

O pipeline usa os secrets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` e `AWS_SESSION_TOKEN` — o script de refresh atualiza os três junto com o `~/.aws/credentials`:

```powershell
aws sts get-caller-identity   # conta do lab, sem erro
gh secret list                # 3 secrets AWS_* com data de hoje
```

## 2. Validar o workflow localmente (sem AWS)

```powershell
npx --yes yaml-lint .github/workflows/ci.yml
```

**Esperado:** `YAML Lint successful.`

Conferir a lógica de gate do deploy (só `push` na `main`):

```powershell
Select-String -Path .github/workflows/ci.yml -Pattern "if: github.ref"
```

**Esperado:** `if: github.ref == 'refs/heads/main' && github.event_name == 'push'` no job `docker`. O job `deploy` herda o gate via `needs: docker`.

## 3. Validar o Terraform check localmente

Mesmos comandos que o job `terraform-check` roda:

```powershell
terraform -chdir=infra fmt -check     # sem saída = ok
terraform -chdir=infra validate      # Success! The configuration is valid.
```

> Se o `validate` reclamar de state/S3, é só o cache local de backend — no CI o job roda `init -backend=false` num checkout limpo e não toca o S3.

## 4. Simular o job docker (build + push manual no ECR)

Reproduz na mão o que o job `docker` faz, com uma tag de teste:

```powershell
$accountId = aws sts get-caller-identity --query Account --output text
$registry = "$accountId.dkr.ecr.us-east-1.amazonaws.com"
$image = "$registry/oficina-api:teste-local"

aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $registry
docker build -t $image .
docker push $image
```

**Esperado:** push concluído; conferir com:

```powershell
aws ecr describe-images --repository-name oficina-api --query "imageDetails[].imageTags" --output json
```

## 5. Simular o job deploy (migração + apply + rollout)

Mesma sequência do job `deploy`, usando a imagem do passo 4:

```powershell
aws eks update-kubeconfig --region us-east-1 --name oficina-eks

# 5.1 Deploy do banco (migração como Job, bloqueante)
kubectl delete job oficina-db-migrate --ignore-not-found
(Get-Content k8s/jobs/db-migrate-job.yaml -Raw) -replace "PLACEHOLDER_IMAGE", $image | kubectl apply -f -
kubectl wait --for=condition=complete job/oficina-db-migrate --timeout=300s
kubectl logs job/oficina-db-migrate
```

**Esperado:** Job `Complete`; logs mostram `No pending migrations` ou a lista de migrações aplicadas.

```powershell
# 5.2 Manifestos + imagem nova
kubectl apply -f k8s/
kubectl set image deployment/oficina-api oficina-api=$image
kubectl rollout status deployment/oficina-api --timeout=300s
```

**Esperado:** `deployment "oficina-api" successfully rolled out`.

> `kubectl apply -f k8s/` não entra em `k8s/local/` nem `k8s/jobs/` (subdiretórios exigem `-R`) — comportamento intencional.

```powershell
# 5.3 Smoke test via LoadBalancer
$url = kubectl get svc oficina-api -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
curl.exe -fsS "http://$url/health"
```

**Esperado:** resposta 200 do `/health`. O ELB pode levar ~2-3 min para ficar resolvível após o primeiro apply — repetir o curl se der falha de DNS.

## 6. Testar o gate: branch dev NÃO faz deploy

```powershell
git push origin HEAD    # push desta branch dev/**
gh run watch --exit-status
gh run view --json jobs --jq '.jobs[] | "\(.name): \(.conclusion)"'
```

**Esperado:** `quality`, `e2e` e `terraform-check` concluídos; `docker` e `deploy` como `skipped`. Esse é o teste negativo do gate.

## 7. Disparo real: push na main

Via PR (GitHub Flow):

```powershell
gh pr create --base main --title "..." --body "..."
# após aprovação/merge:
gh run watch --exit-status
```

**Esperado:** todos os jobs verdes na ordem `quality`+`e2e` → `docker` → `deploy`. Depois:

```powershell
kubectl get deployment oficina-api -o jsonpath='{.spec.template.spec.containers[0].image}'
```

**Esperado:** imagem com tag igual ao SHA do commit do merge (`git log -1 origin/main --format=%H`), não `teste-local`. E `curl http://<elb>/health` → 200.

## 8. Testar o runbook de credencial expirada (opcional)

Com a sessão do lab encerrada, re-rodar o workflow (`gh run rerun <id>`): os jobs `docker`/`deploy` falham com `ExpiredToken`/`UnrecognizedClientException` no log. Seguir o runbook do [infra/README.md](../infra/README.md): reiniciar o lab, rodar o script de refresh e `gh run rerun --failed` — deve passar.

## 9. Limpeza

```powershell
kubectl delete job oficina-db-migrate --ignore-not-found
aws ecr batch-delete-image --repository-name oficina-api --image-ids imageTag=teste-local
```

Teardown completo da infra: passo 9 do [infra/TESTING.md](../infra/TESTING.md).

## Checklist final

- [ ] `yaml-lint` do workflow passa
- [ ] `terraform fmt -check` + `validate` passam (job `terraform-check` vai passar no CI)
- [ ] Build + push manual chegou no ECR
- [ ] Job de migração completa e loga migrações (ou `No pending migrations`)
- [ ] `rollout status` OK com a imagem nova; `/health` responde 200 via ELB
- [ ] Push em branch `dev/**`: `docker` e `deploy` aparecem como `skipped`
- [ ] Push na main (via PR): pipeline inteiro verde, deployment rodando a imagem `:<sha>`
- [ ] Runbook de credencial expirada funciona (`gh run rerun --failed` após refresh)

## Problemas comuns

| Sintoma                                              | Causa provável                                       | Ação                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- |
| `ExpiredToken` / `UnrecognizedClientException`       | Sessão do lab expirou                                | Runbook do [infra/README.md](../infra/README.md): refresh + `gh run rerun` |
| `no basic auth credentials` no push                  | Login do ECR expirou (12h)                           | Repetir o `docker login` do passo 4                                        |
| Job de migração em `Error`/`BackoffLimitExceeded`    | `DATABASE_URL` errada no secret ou RDS fora do ar    | `kubectl logs job/oficina-db-migrate`; conferir secret e RDS               |
| `kubectl wait` estoura timeout                       | Imagem grande (pull lento) ou migração travada       | `kubectl describe job oficina-db-migrate` e logs do pod                    |
| Smoke test falha com DNS                             | ELB recém-criado ainda propagando                    | Aguardar ~2-3 min e repetir o curl                                         |
| `docker`/`deploy` skipped num push na main           | Evento não é `push` (ex.: rerun de PR antigo)        | Conferir `github.event_name` no log do run                                 |
| Rollout trava com `ImagePullBackOff`                 | Tag inexistente no ECR ou repo errado                | `aws ecr describe-images`; conferir output `image` do job docker           |
