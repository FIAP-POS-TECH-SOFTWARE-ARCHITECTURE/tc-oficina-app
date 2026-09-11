# ADR-006: Logs estruturados JSON com pino e requestId propagado

- **Status:** Aceita
- **Data:** 2026-09-10

## Contexto

O enunciado exige logs estruturados com correlação de ponta a ponta. Os dashboards de
operação e o alerta principal de falha de OS (ver
[`docs/observabilidade/`](../../observabilidade/README.md)) dependem de eventos de log com
formato e nomes estáveis.

## Decisão

- **`nestjs-pino`** como logger da aplicação, saída **JSON** em `stdout` (coletado pelo
  agente APM e pelo Fluent Bit do `nri-bundle`).
- **`requestId`**: nasce no header `x-request-id` (injetado/propagado pelo API Gateway) ou
  é gerado com `randomUUID()` se ausente, em `app.module.ts`; propagado a todo log da
  requisição via `AsyncLocalStorage`.
- **Contrato de eventos de negócio** (chamada _object-first_, chaves na raiz do registro):

  | `event` | Emitido em | Atributos |
  | --- | --- | --- |
  | `os.created` | `criar-os.use-case.ts` | `osId`, `numero` |
  | `os.status.changed` | `ordens-servico.prisma.gateway.ts` | `osId`, `numero`, `fromStatus`, `toStatus`, `durationMs` |
  | `integration.error` | `notificador.smtp.gateway.ts` | `integration`, `osNumero`, `error` |

- O contrato é garantido por teste (`src/common/logging/structured-log.spec.ts`).

## Consequências (positivas e negativas)

- **Positivo:** uma query por `requestId` reconstrói a jornada inteira de uma requisição
  (gateway → app → logs); correlação log↔trace via `trace.id` ("logs in context" no APM).
- **Positivo:** os nomes de `event` são contrato explícito com os JSONs dos dashboards e
  com o alerta — mudança exige atualizar os dois no mesmo PR.
- **Negativo — chaves não uniformes entre eventos:** `os.*` usa `osId`, `integration.error`
  usa `osNumero`. Não há JOIN cross-event por essas chaves; documentado no runbook.
- **Negativo — fonte dupla de logs:** hoje agente APM e Fluent Bit ingerem as mesmas linhas
  (contagem dobrada; `level` como texto vs número `50` do pino). Precisa ser consolidado;
  os filtros dos dashboards e do alerta 1 já toleram as duas formas. Ver seção 6 do
  [runbook](../../observabilidade/README.md).
