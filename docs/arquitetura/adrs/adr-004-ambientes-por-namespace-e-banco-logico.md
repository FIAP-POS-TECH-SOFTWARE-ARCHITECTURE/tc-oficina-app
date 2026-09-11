# ADR-004: Ambientes por namespace e banco lógico

- **Status:** Aceita
- **Data:** 2026-09-10

## Contexto

A Fase 3 exige ambientes de homologação e produção com deploy automático. O AWS Academy
Learner Lab limita o número e o porte de recursos e reseta o ambiente entre sessões —
provisionar dois clusters EKS e duas instâncias RDS é caro e frágil nesse contexto.

## Decisão

- **`homolog` e `prod` como dois namespaces no mesmo cluster EKS `oficina-eks`.** Cada
  namespace tem seu próprio `Deployment` + `HPA` + `Service` + `ConfigMap`/`Secret`, com
  `NEW_RELIC_APP_NAME` distinto (`oficina-api-homolog` / `oficina-api-prod`).
- **`oficina_homolog` e `oficina_prod` como dois bancos lógicos na mesma instância RDS.**
  Connection string por ambiente em `/oficina/<env>/database-url`.
- **Um API Gateway HTTP API por ambiente** (stages/deployments separados), cada um com suas
  Lambdas.
- Mapeamento branch → ambiente: `develop` → `homolog`, `main` → `prod`.

## Consequências (positivas e negativas)

- **Positivo:** cabe no orçamento e nos limites do Academy; um `terraform apply` sobe a
  base dos dois ambientes; recuperação rápida após reset do lab.
- **Positivo:** isolamento lógico real — namespaces separam quota/rede/RBAC; bancos lógicos
  separam dados e credenciais.
- **Negativo — isolamento não é físico:** um problema de capacidade no cluster ou na
  instância RDS afeta os dois ambientes ao mesmo tempo; homologação pode, em teoria,
  esgotar recursos de produção. Aceito explicitamente como trade-off de escopo acadêmico.
- **Negativo:** um `terraform destroy` acidental atinge os dois ambientes.
- **Evolução:** em produção real, cluster e instância de banco dedicados por ambiente, com
  contas AWS separadas.
