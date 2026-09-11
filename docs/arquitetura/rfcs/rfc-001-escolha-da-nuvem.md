# RFC-001: Escolha da nuvem

- **Status:** Aprovada
- **Autores:** Lucas Gardini Dias (RM 372237), Thiago Aio (RM 372238)
- **Data:** 2026-09-10

## Contexto e problema

A Fase 3 exige API Gateway, uma função serverless para autenticação por CPF, cluster
Kubernetes gerenciado, banco relacional gerenciado e observabilidade. É preciso escolher um
provedor de nuvem que suporte tudo isso, com custo zero para o grupo (crédito acadêmico) e
o menor atrito possível a partir do que já existe da Fase 2.

## Opções consideradas

| Opção | Serverless + Gateway | Kubernetes gerenciado | Banco gerenciado | Custo p/ o grupo |
| --- | --- | --- | --- | --- |
| **AWS** | Lambda + API Gateway (HTTP API) | EKS | RDS PostgreSQL | Zero (AWS Academy Learner Lab) |
| **GCP** | Cloud Functions + API Gateway | GKE | Cloud SQL | Créditos de trial, expiram |
| **Azure** | Functions + API Management | AKS | Azure Database for PostgreSQL | Créditos de trial, expiram |

## Comparação

- **Continuidade da Fase 2:** a stack da Fase 2 (nota 85/90) já rodava em AWS — EKS, ECR e
  RDS provisionados por Terraform, com state remoto em S3. Migrar de provedor jogaria fora
  todo esse IaC e o conhecimento operacional acumulado.
- **Custo e disponibilidade:** o grupo tem acesso ao AWS Academy Learner Lab, que zera o
  custo. GCP e Azure ofereceriam apenas créditos de trial, que expirariam antes da janela
  de correção e do vídeo.
- **Serverless nativo:** Lambda + API Gateway HTTP API cobrem exatamente o requisito de
  "function serverless que consulta a base de clientes" sem serviço adicional.
- **Restrições do Academy:** o Learner Lab reseta recursos entre sessões e limita alguns
  serviços (ver [ADR-004](../adrs/adr-004-ambientes-por-namespace-e-banco-logico.md)); esse
  custo é conhecido e contornável, e vale menos que os créditos que expirariam nas outras
  nuvens.

## Decisão

**AWS**, região `us-east-1`. Lambda + API Gateway HTTP API para autenticação, EKS para a
aplicação, RDS PostgreSQL para os dados, S3 para o Terraform state, SSM Parameter Store
para os contratos entre repositórios e CloudWatch + New Relic para observabilidade.

## Consequências e riscos

- **Positivo:** reaproveitamento integral do IaC e da imagem Docker da Fase 2; serviços
  serverless nativos; custo zero.
- **Risco — reset do Academy:** recursos fora do Terraform (bucket de state, parâmetros
  SSM) podem sumir entre sessões. Mitigação: os pipelines de CD recriam o bucket de state e
  os parâmetros SSM quando ausentes, antes do `terraform init`.
- **Risco — credenciais efêmeras:** as credenciais do Learner Lab expiram por sessão;
  operações manuais exigem `scripts/aws-academy-refresh.ps1` a cada sessão nova.
- **Lock-in:** aceitável para o escopo acadêmico; as fronteiras (Terraform, imagem OCI
  portável, Prisma) mantêm a portabilidade razoável.
