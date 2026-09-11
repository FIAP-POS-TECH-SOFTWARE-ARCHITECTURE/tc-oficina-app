# RFC-002: Banco de dados gerenciado

- **Status:** Aprovada
- **Autores:** Lucas Gardini Dias (RM 372237), Thiago Aio (RM 372238)
- **Data:** 2026-09-10

## Contexto e problema

O sistema da oficina precisa de um banco relacional com integridade referencial forte
(fluxo de OS, movimentação de estoque transacional), gerenciado (backup, patch e failover
fora do escopo do time) e barato o suficiente para caber no AWS Academy. A Fase 2 já usava
PostgreSQL via Prisma; a questão é se há motivo para mudar.

## Opções consideradas

- **RDS PostgreSQL** (`db.t3.micro`)
- **Amazon Aurora PostgreSQL**
- **RDS MySQL**
- **RDS SQL Server**

## Comparação

| Critério | RDS PostgreSQL | Aurora PostgreSQL | RDS MySQL | RDS SQL Server |
| --- | --- | --- | --- | --- |
| Continuidade da Fase 2 (Prisma + migrações prontas) | Total | Total | Reescrever migrações e tipos | Reescrever tudo |
| Tipos usados no schema (`uuid`, enums nativos, `Decimal(10,2)`) | Nativos | Nativos | Enums limitados, sem `uuid` nativo | Sintaxe diferente |
| Custo no Academy | `db.t3.micro`, o mais barato | Maior; Academy restringe | Baixo | Licença cara |
| Operação gerenciada (backup/patch/failover) | Sim | Sim | Sim | Sim |

## Decisão

**RDS PostgreSQL**, uma instância `db.t3.micro` com dois bancos lógicos (`oficina_homolog`
e `oficina_prod`), provisionada pelo repositório `tc-oficina-infra-db`. Sem alteração
estrutural no schema em relação à Fase 2.

## Consequências e riscos

- **Positivo:** zero retrabalho de modelagem; as migrações Prisma versionadas continuam
  válidas; os tipos (`uuid`, enums `OsStatus`/`OsItemServicoStatus`/`TipoDocumentoCliente`,
  `Decimal`) são suportados nativamente.
- **Trade-off — instância única para dois ambientes:** isolamento lógico (bancos
  separados), não físico. Aceitável no escopo acadêmico pelo custo; registrado em
  [ADR-004](../adrs/adr-004-ambientes-por-namespace-e-banco-logico.md).
- **Risco — `db.t3.micro`:** capacidade modesta; suficiente para a carga de demonstração e
  os testes K6, não dimensionado para produção real.
- **Detalhamento** da justificativa formal e do DER em
  [banco-de-dados.md](../banco-de-dados.md).
