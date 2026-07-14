# Testando a infraestrutura de ponta a ponta

Roteiro completo para validar toda a infraestrutura (VPC, EKS, RDS, ECR, tfstate remoto e script de credenciais) numa sessão do AWS Academy Learner Lab.

> **Custo:** o apply cria 13 recursos que consomem o budget do lab (EKS control plane, 2× `t3.medium`, RDS). Ao terminar o teste, rode `terraform destroy` (passo 9).

## Pré-requisitos

- AWS CLI instalado (`aws --version`)
- Terraform >= 1.9 (`terraform version`)
- kubectl instalado (`kubectl version --client`)
- gh CLI autenticado (`gh auth status`)
- Docker (apenas para o passo opcional 7)
- Conta AWS Academy com Learner Lab disponível

## 1. Iniciar sessão do lab e renovar credenciais

1. AWS Academy → Learner Lab → **Start Lab** (aguardar bolinha verde).
2. **AWS Details → AWS CLI: Show** → copiar o bloco `[default]` inteiro.
3. Na raiz do repositório:

```powershell
.\scripts\aws-academy-refresh.ps1
```

Colar o bloco, `Enter`, depois `Ctrl+Z` + `Enter`.

**Resultado esperado:**

- `~/.aws/credentials atualizado.`
- `Secrets do GitHub atualizados (...)`
- Saída do `aws sts get-caller-identity` com a conta do lab (isso já valida o script).

**Conferência extra:**

```powershell
gh secret list   # AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_SESSION_TOKEN com data de hoje
```

## 2. Bootstrap do bucket de tfstate (só na primeira vez)

Nome de bucket é global — use o id da conta como sufixo:

```powershell
$accountId = aws sts get-caller-identity --query Account --output text
$bucket = "tc-fiap-oficina-tfstate-$accountId"
aws s3api create-bucket --bucket $bucket --region us-east-1
aws s3api put-bucket-versioning --bucket $bucket --versioning-configuration Status=Enabled
```

Ajustar `bucket` em `infra/backend.tf` para o valor de `$bucket`.

> Contas do Learner Lab costumam manter o mesmo id entre sessões — o bucket e o tfstate sobrevivem ao fim da sessão; só EC2/EKS/RDS são desligados.

## 3. Init, fmt e validate

```powershell
cd infra
terraform init
terraform fmt -check
terraform validate
```

**Esperado:** `Terraform has been successfully initialized!` (backend S3 conectado) e `Success! The configuration is valid.`

## 4. Plan e apply

```powershell
$env:TF_VAR_db_username = "oficina_admin"
$env:TF_VAR_db_password = "YuA9oKj6ZcFP4N" # senha para testes

terraform plan
```

**Revisar o plan:** 13 recursos a criar (VPC, 2 subnets, IGW, route table + 2 associações, cluster EKS, node group, subnet group do RDS, SG do RDS, instância RDS, repo ECR). Nenhum destroy/change inesperado.

```powershell
terraform apply   # confirmar com "yes"; EKS demora ~10-15 min
```

**Esperado:** `Apply complete! Resources: 13 added...` e outputs exibidos (`cluster_name`, `cluster_endpoint`, `configure_kubectl`, `rds_endpoint`, `ecr_repository_url`; `database_url` aparece como `<sensitive>`).

## 5. Verificar tfstate remoto e ausência de segredos

```powershell
aws s3 ls s3://$bucket/fase-2/          # deve listar terraform.tfstate
git log -p -- . | Select-String -Pattern "password" -CaseSensitive:$false
git status --short
```

## 6. Validar o cluster com os manifestos do k8s/

```powershell
aws eks update-kubeconfig --region us-east-1 --name oficina-eks
kubectl get nodes
```

**Esperado:** 2 nodes `Ready`.

```powershell
$dbUrl = terraform output -raw database_url

# valores padrão iguais ao .env.example (troque em produção real)
kubectl create secret generic oficina-secrets `
  --from-literal=DATABASE_URL="$dbUrl" `
  --from-literal=JWT_SECRET="a3f9c1d8e7b2f4a6c9d1e0b3a5f7c8d9e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6" `
  --from-literal=ADMIN_BOOTSTRAP_EMAIL="admin@oficina.local" `
  --from-literal=ADMIN_BOOTSTRAP_PASSWORD="ChangeMe!123" `
  --from-literal=SMTP_USER="" `
  --from-literal=SMTP_PASS=""

kubectl apply -f ../k8s/
kubectl get pods -w
```

**Esperado:** pods `oficina-api` em `ImagePullBackOff` — **isso é sucesso neste estágio**: o ECR ainda está vazio (a imagem só chega via pipeline de CI/CD). O que importa: scheduler alocou os pods, secret montou, manifestos aplicaram sem erro.

## 7. (Opcional) Testar com imagem real — push manual para o ECR

Valida o caminho completo até `Running` sem esperar o pipeline:

```powershell
$ecrUrl = terraform output -raw ecr_repository_url
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ecrUrl

docker build -t "${ecrUrl}:manual" ..
docker push "${ecrUrl}:manual"

kubectl set image deployment/oficina-api oficina-api="${ecrUrl}:manual"
kubectl get pods -w
```

**Esperado:** pods `Running`. Teste de fumaça:

```powershell
# O Service LoadBalancer publica um hostname na AWS (pode levar alguns minutos).
kubectl get svc oficina-api
$hostname = kubectl get svc oficina-api -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
$healthUrl = "http://$hostname/health"

curl.exe -fsS $healthUrl
Start-Process $healthUrl   # abre somente o health no navegador
```

**Esperado:** resposta HTTP 200 com `status: "ok"`. Se `EXTERNAL-IP` ainda estiver
como `<pending>`, aguardar a criação do Load Balancer com
`kubectl get svc oficina-api -w` e repetir os comandos. O endpoint atual usa HTTP
na porta 80; não trocar a URL para HTTPS.

## 7.1 Metrics-server (pré-requisito do HPA) + teste de carga (K6)

O EKS **não vem com metrics-server instalado por padrão**: sem ele, `kubectl get hpa`
mostra `TARGETS: <unknown>/70%` para sempre e o autoscaling nunca dispara.

```powershell
kubectl get deployment metrics-server -n kube-system   # NotFound = falta instalar
```

Instalar:

```powershell
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# EKS precisa dessa flag por causa do certificado TLS self-signed do kubelet
kubectl patch deployment metrics-server -n kube-system --type='json' `
  -p='[{"op":"add","path":"/spec/template/spec/containers/0/args/-","value":"--kubelet-insecure-tls"}]'
```

**Esperado:** após ~30s, `kubectl top pods` retorna dados (em vez de `error: Metrics API not available`).

Com o metrics-server ativo, gerar carga com [k6](https://k6.io) (`k6/load-test.js`) para validar o HPA de ponta a ponta:

```powershell
# terminal 1: acompanhar o HPA escalar
kubectl get hpa oficina-api-hpa -w

# terminal 2: disparar a carga (sem "/" no fim do BASE_URL, o script já concatena "/health")
k6 run -e BASE_URL=http://$hostname k6/load-test.js
```

**Esperado:** `REPLICAS` sobe de 2 conforme a CPU passa de 70% (até 10), e volta a 2 alguns
minutos após o fim do teste (cooldown padrão do HPA).

## 8. Testar conectividade com o RDS (do seu host)

```powershell
$rds = terraform output -raw rds_endpoint
Test-NetConnection $rds -Port 5432    # TcpTestSucceeded : True
```

(RDS é público por decisão documentada no [README](README.md) — trade-off do Academy.)

## 9. Teardown

```powershell
kubectl delete -f ../k8s/ --ignore-not-found
terraform destroy   # confirmar com "yes"
```

**Esperado:** `Destroy complete! Resources: 13 destroyed.` O tfstate permanece no S3 (vazio de recursos) — próximo `apply` recria tudo.

## Checklist final

- [ ] Script de refresh atualizou `~/.aws/credentials` + 3 secrets do GitHub num comando
- [ ] `terraform init` conectou no backend S3; objeto `fase-2/terraform.tfstate` existe no bucket
- [ ] `terraform apply` criou VPC + EKS + RDS + ECR sem erro
- [ ] Nenhum segredo commitado (`git log -p` limpo, `terraform.tfvars` fora do git)
- [ ] `kubectl get nodes` mostra 2 nodes Ready
- [ ] Manifestos de `k8s/` aplicam; pods sobem (`ImagePullBackOff` aceito com ECR vazio)
- [ ] metrics-server instalado; `kubectl top pods` retorna dados
- [ ] Teste de carga K6 dispara o HPA (`REPLICAS` sobe acima de 2)
- [ ] `terraform destroy` desmonta tudo

## Problemas comuns

| Sintoma                                        | Causa provável                                        | Ação                                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `ExpiredToken` / `InvalidClientTokenId`        | Sessão do lab expirou                                 | Reiniciar lab e rodar o script do passo 1 de novo                                                                     |
| `Error: reading IAM Role (LabRole): not found` | Sessão sem LabRole (raro) ou credencial errada        | Conferir `aws sts get-caller-identity`                                                                                |
| Apply trava >20 min no EKS                     | Normal até ~15 min; acima disso, budget/limite do lab | Ver eventos no console AWS                                                                                            |
| `AccessDenied` no S3 do backend                | Bucket de outra conta ou nome errado no `backend.tf`  | Conferir `$bucket` e o id da conta                                                                                    |
| Pods `Pending`                                 | Nodes ainda subindo ou sem capacidade                 | `kubectl describe pod` e `kubectl get nodes`                                                                          |
| RDS engine version inválida                    | Postgres 18 indisponível na região                    | `aws rds describe-db-engine-versions --engine postgres --query 'DBEngineVersions[].EngineVersion'` e ajustar `rds.tf` |
| HPA `TARGETS: <unknown>` / `kubectl top` falha  | metrics-server não instalado (não vem por padrão no EKS) | Ver seção 7.1                                                                                                        |
