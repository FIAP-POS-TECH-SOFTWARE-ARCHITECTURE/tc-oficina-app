# Infraestrutura (Terraform — AWS Academy)

Provisiona toda a infraestrutura da aplicação na AWS Academy (Learner Lab): rede, cluster Kubernetes (EKS), banco de dados (RDS Postgres) e registro de imagens (ECR).

## Recursos criados

| Recurso | Arquivo | Descrição |
| --- | --- | --- |
| VPC `10.0.0.0/16` | `network.tf` | DNS support/hostnames habilitados |
| 2 subnets públicas | `network.tf` | Uma por AZ (EKS exige ≥ 2), com tags de descoberta do Kubernetes (`kubernetes.io/cluster/...`, `kubernetes.io/role/elb`) |
| Internet Gateway + route table | `network.tf` | Rota `0.0.0.0/0` para as subnets públicas |
| Cluster EKS `oficina-eks` | `eks.tf` | Autenticação `API_AND_CONFIG_MAP`, criador com admin |
| Node group `oficina-nodes` | `eks.tf` | `t3.medium`, desired 2, min 2, max 4 |
| Security group do RDS | `rds.tf` | Postgres 5432 a partir da VPC e externo (ver trade-offs) |
| RDS Postgres `oficina-db` | `rds.tf` | `db.t3.micro`, 20 GB, `publicly_accessible = true` |
| Repositório ECR `oficina-api` | `ecr.tf` | Scan on push, tags mutáveis, `force_delete` |
| `LabRole` (data source) | `data.tf` | Role pré-existente do Academy usada por cluster e nodes |

## Pré-requisitos

- AWS CLI configurado (o script de renovação abaixo cuida das credenciais)
- Terraform >= 1.9
- gh CLI autenticado (para atualizar os secrets do GitHub)
- Sessão do AWS Academy Learner Lab **ativa** (botão *Start Lab*)

## Renovação de credenciais (a cada sessão do lab)

As credenciais do Learner Lab expiram a cada sessão. Para renovar tudo em um comando:

```powershell
.\scripts\aws-academy-refresh.ps1
```

Cole o bloco `[default]` de *AWS Details → AWS CLI: Show* e finalize com `Ctrl+Z` + `Enter`. O script atualiza:

1. `~/.aws/credentials` (perfil `default`)
2. Secrets do repositório GitHub: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`

Por isso **não há `terraform apply` automático em pipeline** — as credenciais expiram e o apply é sempre manual e consciente.

## Bootstrap do bucket de tfstate (uma única vez)

O backend S3 não cria o próprio bucket. Antes do primeiro `terraform init`:

```powershell
aws s3api create-bucket --bucket <SEU_BUCKET_TFSTATE> --region us-east-1
aws s3api put-bucket-versioning --bucket <SEU_BUCKET_TFSTATE> --versioning-configuration Status=Enabled
```

Nome de bucket é global — sufixe com o id da conta (ex.: `tc-fiap-oficina-tfstate-123456789012`) e ajuste `bucket` em `backend.tf`.

## Fluxo de uso

```powershell
cd infra

# credenciais do banco via ambiente — nunca commitar
$env:TF_VAR_db_username = "oficina_admin"
$env:TF_VAR_db_password = "<senha forte>"

terraform init        # 1x por máquina (ou após mudar backend/providers)
terraform fmt -check  # formatação
terraform validate    # sintaxe/semântica
terraform plan        # revisar: ~15 recursos
terraform apply       # EKS demora ~10-15 min
```

Após o apply:

```powershell
aws eks update-kubeconfig --region us-east-1 --name oficina-eks
kubectl get nodes   # 2 nodes Ready
kubectl apply -f ../k8s/
```

Para desmontar tudo:

```powershell
terraform destroy
```

## Trade-offs do AWS Academy (decisões conscientes)

- **`LabRole` para tudo** — o Academy não permite criar IAM roles; cluster e node group usam a role pré-existente via data source.
- **Subnets públicas para os nodes** — evita o custo de NAT Gateway no lab. Produção real: subnets privadas + NAT.
- **RDS público (`publicly_accessible = true` + ingress `0.0.0.0/0`)** — o runner do GitHub Actions e o dev local precisam alcançar o banco para rodar migrações. Produção real: banco apenas na VPC, migração via bastion ou Job dentro do cluster.
- **`skip_final_snapshot` e `force_delete` no ECR** — ambiente descartável; destroy sem fricção.

## Custos

O Learner Lab tem budget limitado. Os recursos que mais consomem: nodes EC2 (`t3.medium` × 2), o control plane do EKS e o RDS. **Rode `terraform destroy` ao fim de cada sessão de estudo** se o budget preocupar — o tfstate fica no S3 e o próximo `apply` recria tudo.
