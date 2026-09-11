# Sequência — Autenticação do cliente via CPF

Fluxo completo: emissão do token a partir do CPF e uso do token numa rota sensível do
cliente (acompanhamento de OS).

```mermaid
sequenceDiagram
    autonumber
    actor C as Cliente
    participant GW as API Gateway
    participant LT as Lambda token
    participant SSM as SSM
    participant DB as RDS (clientes)
    participant LA as Lambda authorizer
    participant APP as oficina-api (EKS)

    C->>GW: POST /auth/token { cpf }
    GW->>LT: invoke
    LT->>LT: remove máscara e valida dígitos do CPF
    alt CPF malformado
        LT-->>C: 400 { message: "CPF inválido" }
    end
    LT->>DB: SELECT id, nome, ativo FROM clientes WHERE documento = :cpf
    alt cliente inexistente ou inativo
        LT-->>C: 401 { message: "Não autorizado" }
    end
    LT->>SSM: GetParameter /oficina/<env>/jwt-secret (cache em memória)
    LT->>LT: assina JWT HS256 { sub, cpf, type: "cliente", exp: +1h }
    LT-->>C: 200 { token, expiresIn: 3600 }

    C->>GW: GET /os/acompanhamento/OS-0042 (Authorization: Bearer <token>)
    GW->>LA: authorizer(headers) — cache 300s por token
    LA->>SSM: GetParameter /oficina/<env>/jwt-secret (cache)
    LA->>LA: verifica assinatura, exp e type = "cliente"
    alt token inválido / expirado / type != cliente
        LA-->>GW: isAuthorized: false
        GW-->>C: 401
    end
    LA-->>GW: isAuthorized: true, context { clienteId }
    GW->>APP: proxy HTTP + header x-request-id
    APP->>APP: JwtAuthGuard — valida JWT, exige type=cliente em rota @ClienteAuth, cliente ativo
    APP->>DB: ConsultaAcompanhamentoOsUseCase: busca a OS pelo numero
    alt OS não encontrada
        APP-->>C: 404 "OS não encontrada"
    end
    alt OS pertence a outro cliente
        APP-->>C: 403 "OS não pertence ao cliente autenticado"
    end
    APP->>APP: mascara o nome do cliente na resposta
    APP-->>C: 200 { numero, status, veículo, itens, histórico }
```

## Notas

- **Dupla validação do JWT** (authorizer + `JwtAuthGuard` no app) é intencional: o gateway
  barra o tráfego não autenticado antes de chegar ao cluster, e o app revalida porque
  também aceita tokens de usuário interno emitidos pela própria API — o mesmo guard decide,
  pelo claim `type`, se a rota é permitida (`@ClienteAuth()` só aceita `type: "cliente"`;
  rotas internas rejeitam esse tipo).
- **`jwt-secret` compartilhado** via SSM permite que Lambda (assina) e app (valida) usem o
  mesmo segredo HS256 sem troca de chave pública. Rotação = trocar o parâmetro + rollout.
  Ver [ADR-003](adrs/adr-003-jwt-hs256-segredo-compartilhado.md).
- **`x-request-id`** é injetado/propagado pelo gateway e reaproveitado pelo app como
  `requestId` em todos os logs da requisição, fechando a correlação ponta a ponta exigida
  pelo enunciado. Ver [sequência de abertura de OS](sequencia-abertura-os.md) e o
  [runbook de observabilidade](../observabilidade/README.md).
- **401 genérico** na Lambda token não diferencia "CPF não existe" de "cliente inativo",
  para não vazar informação sobre a base de clientes.
