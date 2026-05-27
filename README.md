# notifier-hub

Plataforma centralizada de notificaciones para arquitecturas de microservicios. Resuelve cuatro problemas reales: templates versionados, idempotencia garantizada, webhooks de entrega y notificaciones programadas.

---

## Índice

- [Arquitectura](#arquitectura)
- [Observabilidad](#observabilidad)
  - [Alarmas CloudWatch](#alarmas-cloudwatch)
  - [Métricas de Negocio](#métricas-de-negocio)
- [API Reference](#api-reference)
  - [POST /v1/notify](#post-v1notify)
  - [GET /v1/notifications/{id}](#get-v1notificationsid)
  - [Códigos de error](#códigos-de-error)
- [Instalación y desarrollo local](#instalación-y-desarrollo-local)
- [CI/CD](#cicd)
  - [Pipelines](#pipelines)
  - [Secretos requeridos](#secretos-requeridos)

---

## Arquitectura

![Arquitectura](./docs/notifier-hub-architec.png)

### Flujo de datos

```
Cliente (microservicio)
  │
  │  POST /v1/notify  [Idempotency-Key: <key>]
  ▼
API Gateway REST
  ├──► Lambda enqueue
  │         │ TransactWriteItems (notifications + outbox)
  │         ▼
  │    DynamoDB (notifications │ outbox │ templates)
  │         │ DynamoDB Streams (INSERT en outbox)
  │         ▼
  │    Lambda relay  ── único publisher al broker
  │         ├──► SQS main ──► Lambda sender ──► SES / SNS
  │         │         │ (failure x3)
  │         │         ▼
  │         │    SQS main-DLQ ──► Lambda dlq-processor
  │         │                          │ TransactWriteItems
  │         │                          └──► outbox:WEBHOOK_REQUESTED
  │         │
  │         ├──► SQS webhooks ──► Lambda webhook-dispatcher
  │         │         │ (failure x3)   POST callbackUrl (backoff 2s→8s→32s)
  │         │         ▼
  │         │    SQS webhook-DLQ ──► Lambda dlq-processor
  │         │
  │         └──► EventBridge Scheduler (scheduledAt)
  │                    └──► SQS main (directo, a la hora indicada)
  │
  └──► Lambda query ◄── GET /v1/notifications/{id}
```

### Recursos AWS

| Recurso | Nombre | Descripción |
|---|---|---|
| API Gateway REST | `UE1NOTIFIERGTW001` | Entry point — `POST /v1/notify` + `GET /v1/notifications/{id}` |
| Lambda `enqueue` | `UE1NOTIFIERLMB001` | Valida, resuelve template Mustache, persiste via `TransactWriteItems` |
| Lambda `query` | `UE1NOTIFIERLMB002` | Consulta el estado de una notificación por ID |
| Lambda `relay` | `UE1NOTIFIERLMB003` | Lee DynamoDB Streams de `outbox`; único publisher al broker |
| Lambda `sender` | `UE1NOTIFIERLMB004` | Consume SQS main, envía via SES (email) / SNS (SMS) |
| Lambda `webhook-dispatcher` | `UE1NOTIFIERLMB005` | POST al `callbackUrl` con backoff exponencial (2s→8s→32s) |
| Lambda `dlq-processor` | `UE1NOTIFIERLMB006` | Procesa ambas DLQs — routing por campo `messageType` |
| SQS `main` | `UE1NOTIFIERSQS001` | Cola principal de notificaciones |
| SQS `webhooks` | `UE1NOTIFIERSQS002` | Cola dedicada para entrega de callbacks |
| SQS `main-dlq` | `UE1NOTIFIERSQS003` | DLQ de notificaciones (maxReceiveCount: 3) |
| SQS `webhook-dlq` | `UE1NOTIFIERSQS004` | DLQ exclusiva de webhooks — redrive independiente |
| DynamoDB `notifications` | `UE1NOTIFIERDDB001` | Estado persistente de cada notificación |
| DynamoDB `outbox` | `UE1NOTIFIERDDB002` | Eventos pendientes de publicar al broker (Transactional Outbox) |
| DynamoDB `templates` | `UE1NOTIFIERDDB003` | Plantillas versionadas con Mustache syntax |
| IAM Role `sender-role` | `UE1NOTIFIERROL001` | Ejecución Lambda sender — SES (identity scoped) + SNS + DynamoDB + SQS consume |
| IAM Role `enqueue-role` | `UE1NOTIFIERROL002` | Ejecución Lambda enqueue — DynamoDB PutItem/GetItem notifications, PutItem outbox, Query templates |
| IAM Role `query-role` | `UE1NOTIFIERROL003` | Ejecución Lambda query — DynamoDB GetItem/Query notifications + índices |
| IAM Role `relay-role` | `UE1NOTIFIERROL004` | Ejecución Lambda relay — DynamoDB stream + UpdateItem outbox + SQS SendMessage x2 + `scheduler:CreateSchedule` + `iam:PassRole` |
| IAM Role `webhook-dispatcher-role` | `UE1NOTIFIERROL005` | Ejecución Lambda webhook-dispatcher — DynamoDB UpdateItem + SQS consume webhooks |
| IAM Role `dlq-processor-role` | `UE1NOTIFIERROL006` | Ejecución Lambda dlq-processor — DynamoDB UpdateItem/PutItem + SQS consume ambas DLQs |
| IAM Role `scheduler-execution-role` | `UE1NOTIFIERROL007` | Asumido por EventBridge Scheduler — SQS SendMessage → SQS main |
| CloudWatch Alarm | — | Error rate (> 5%) + p99 duration (> 10 000 ms) por cada Lambda |
| CloudWatch Alarm | — | Edad del mensaje en SQS main y SQS webhooks (> 300 s) |
| CloudWatch Alarm | — | Mensajes visibles > 0 en main-DLQ y webhook-DLQ |
| CloudWatch Dashboard | `notifier-hub-dashboard` | Vista unificada: Lambdas, colas, tablas y métricas de negocio |
| SNS Topic | — | Destino de todas las alarmas — suscripción email opcional |
| EventBridge Scheduler | — | Reglas one-time para notificaciones programadas (target: SQS main) |

---

## Observabilidad

### Alarmas CloudWatch

| Alarma | Umbral | Alcance |
|---|---|---|
| Lambda error rate | > 5% de invocaciones con error | Las 6 Lambdas |
| Lambda p99 duration | > 10 000 ms | Las 6 Lambdas |
| SQS queue age | > 300 s mensaje más antiguo | SQS main + SQS webhooks |
| DLQ visible messages | > 0 mensajes | main-DLQ + webhook-DLQ |

Todas las alarmas publican al mismo SNS Topic. Si se configura `ALARM_EMAIL` en los secretos
de CI/CD, el topic crea automáticamente una suscripción de email.

### Métricas de negocio

| Métrica | Descripción |
|---|---|
| `notifications_accepted` | Notificaciones encoladas con éxito |
| `notifications_rejected` | Notificaciones rechazadas (template no encontrado) |
| `notifications_sent` | Notificaciones enviadas por SES / SNS |
| `notifications_failed_permanent` | Notificaciones movidas a DLQ tras 3 intentos |
| `webhooks_delivered` | Callbacks entregados al `callbackUrl` |
| `webhooks_failed_permanent` | Webhooks movidos a DLQ tras 3 intentos |

Los umbrales son configurables en `cdk/common/constants/infra.constants.ts`.

---

## Canales soportados

| Canal | Proveedor | Estado |
|---|---|---|
| Email | AWS SES | ✅ Activo |
| SMS | AWS SNS | ✅ Activo |

---

## API Reference

Todas las rutas requieren el header `x-api-key` con la clave generada en API Gateway.

### POST `/v1/notify`

Encola una nueva notificación. El campo `callbackUrl` es **obligatorio** — retorna `400` si está ausente.

**Headers:**

| Header | Requerido | Descripción |
|---|---|---|
| `x-api-key` | Sí | API Key de API Gateway |
| `Idempotency-Key` | No | Clave única del request. TTL 24h — misma key retorna el resultado anterior sin re-enviar |

**Opción A — inline** (sin template):
```json
{
  "channel": "email",
  "provider": "ses",
  "to": "user@acme.com",
  "subject": "Confirmación de pedido #789",
  "body": "<p>Tu pedido fue confirmado.</p>",
  "callbackUrl": "https://orders.internal/webhooks/notifications"
}
```

**Opción B — con template** (`templateId` debe existir en DynamoDB con `active: true`):
```json
{
  "templateId": "password-reset",
  "to": "user@acme.com",
  "variables": { "user": { "name": "Gustavo" }, "token": "ABC123", "expiry": "10min" },
  "callbackUrl": "https://auth-service.internal/webhooks/notifications",
  "scheduledAt": "2026-05-24T09:00:00Z"
}
```

**Response `202`:**
```json
{
  "data": { "notificationId": "01JVQK8XXXXXXXXXXXXXXXXXXX" }
}
```

**Payload del webhook** (lo que notifier-hub envía al `callbackUrl` cuando cambia el estado):
```json
{
  "notificationId": "01JVQK8XXXXXXXXXXXXXXXXXXX",
  "status": "SENT",
  "channel": "email",
  "to": "user@acme.com",
  "sentAt": "2026-05-22T10:00:05Z"
}
```

---

### GET `/v1/notifications/{id}`

Consulta una notificación por ID.

**Response `200`:**
```json
{
  "data": {
    "notificationId": "01JVQK8XXXXXXXXXXXXXXXXXXX",
    "status": "SENT",
    "channel": "email",
    "to": "user@acme.com",
    "templateId": "password-reset",
    "templateVersion": 1,
    "callbackUrl": "https://auth-service.internal/webhooks/notifications",
    "webhookStatus": "DELIVERED",
    "scheduledAt": null,
    "createdAt": "2026-05-22T10:00:00Z",
    "updatedAt": "2026-05-22T10:00:05Z"
  }
}
```

**Estados posibles de `status`:** `PENDING` → `PROCESSING` → `SENT` | `FAILED_PERMANENT` | `SCHEDULED`

**Estados posibles de `webhookStatus`:** `PENDING` → `DELIVERED` | `FAILED`

---

### Códigos de error

```json
{ "code": "NTF-001", "description": "El campo \"to\" debe ser un correo electrónico válido con formato RFC" }
```

| Código | HTTP | Descripción |
|---|---|---|
| `NTF-001` | 400 | Email inválido (formato RFC) |
| `NTF-002` | 400 | Teléfono inválido (E.164) |
| `NTF-003` | 400 | Proveedor no compatible con el canal |
| `NTF-004` | 400 | Asunto requerido para canal email |
| `NTF-005` | 404 | Notificación no encontrada |
| `NTF-006` | 500 | Sin remitente registrado para canal:proveedor |
| `NTF-007` | 500 | Error inesperado |
| `NTF-008` | 500 | Variable de entorno faltante |
| `NTF-009` | 400 | Body de request inválido |
| `NTF-010` | 500 | Error en batch de DLQ |
| `NTF-011` | 500 | Error al enviar por el proveedor externo |
| `NTF-012` | 503 | DynamoDB no disponible |
| `NTF-013` | 400 | `templateId` no existe o no tiene versión activa |
| `NTF-014` | 400 | Template renderizado supera el límite de 50 KB |
| `NTF-015` | 503 | SNS no disponible |
| `NTF-016` | 503 | POST al `callbackUrl` falló tras agotar reintentos |
| `NTF-017` | 400 | Header `Idempotency-Key` obligatorio |

---

## Instalación y desarrollo local

```bash
# Instalar dependencias
npm install

# Tests unitarios
npm test
```

---

## CI/CD

### Pipelines

| Archivo | Trigger | Acción |
|---|---|---|
| `deploy.yml` | `push` a `master` | Deploy en AWS |
| `destroy.yml` | Manual (`workflow_dispatch`) | Destruye el stack del stage seleccionado |

### Secretos requeridos

Configurar en GitHub → Settings → Environments:

**`deployer`:**
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
CDK_DEFAULT_ACCOUNT
AWS_DEFAULT_REGION
SES_SOURCE_EMAIL
```
