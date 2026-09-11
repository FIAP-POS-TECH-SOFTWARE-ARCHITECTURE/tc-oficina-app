# Sequência — Abertura de ordem de serviço

Fluxo interno de criação de OS por um usuário da equipe, e a transição de status seguinte
— onde vive a notificação por e-mail e o alerta de falha de integração exigido pelo
enunciado.

```mermaid
sequenceDiagram
    autonumber
    actor A as Atendente
    participant GW as API Gateway
    participant APP as oficina-api
    participant DB as RDS
    participant SMTP as Servidor de e-mail
    participant NR as New Relic

    Note over A,NR: 1. Criação da OS
    A->>GW: POST /os { clienteId, veiculoId } (Bearer JWT usuário interno)
    GW->>APP: proxy HTTP + x-request-id
    APP->>APP: JwtAuthGuard + RolesGuard (ATENDENTE | ADMINISTRADOR)
    APP->>DB: valida cliente e veículo ativos; veículo pertence ao cliente
    alt validação falha
        APP-->>A: 404 / 422 / 400 conforme o caso
    end
    APP->>DB: INSERT ordens_servico (status RECEBIDA) + INSERT os_historico_status (transação)
    APP--)NR: log { event: "os.created", osId, numero, requestId }
    APP-->>A: 201 { numero, status: RECEBIDA }

    Note over A,NR: 2. Transição de status (ex.: mover para EM_DIAGNOSTICO)
    A->>GW: POST /os/{id}/diagnostico/iniciar (Bearer JWT)
    GW->>APP: proxy + x-request-id
    APP->>DB: UPDATE status + INSERT os_historico_status (statusAnterior, statusNovo)
    APP--)NR: log { event: "os.status.changed", osId, numero, fromStatus, toStatus, durationMs, requestId }
    APP->>SMTP: SmtpNotificadorGateway: e-mail ao cliente (mudança de status)
    alt falha no envio
        APP--)NR: log { event: "integration.error", integration: "smtp", osNumero, error }
        NR--)NR: condição "falha no processamento de OS" dispara → e-mail ao grupo
    end
```

## Notas

- **`POST /os` recebe só `{ clienteId, veiculoId }`.** O número da OS é gerado pelo domínio
  (`gerarNumeroOs(ano, sequencial)`); diagnóstico, itens e valores entram em etapas
  posteriores do fluxo.
- **A notificação por e-mail e o `integration.error` acontecem na _mudança de status_, não
  na criação.** A criação só emite `os.created`. É por isso que a simulação do alerta
  (ver [alertas.md](../observabilidade/alertas.md)) manda "criar a OS e mover o status" —
  é a transição que aciona o `SmtpNotificadorGateway`.
- **`durationMs`** no evento `os.status.changed` é o tempo que a OS passou no `fromStatus`,
  medido a partir do `createdAt` da linha de histórico anterior; é `0` na primeira
  transição (por isso o widget de tempo médio faceta por `fromStatus`).
- **Persistência transacional:** a linha de `ordens_servico` e a primeira de
  `os_historico_status` são gravadas juntas (`criarComHistorico`); o histórico é a fonte da
  verdade das transições e alimenta tanto a auditoria quanto os cálculos de `durationMs`.
- **`requestId`** propagado do gateway aparece em todos os três eventos, permitindo
  reconstruir a jornada completa de uma OS por uma única query no New Relic Logs.
