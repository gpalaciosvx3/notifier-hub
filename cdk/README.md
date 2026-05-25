# notifier-hub — CDK

Infraestructura AWS del proyecto `notifier-hub`, definida con AWS CDK (TypeScript).

---

## Índice

- [Índice](#índice)
- [Estructura](#estructura)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Desarrollo en LocalStack](#desarrollo-en-localstack)
- [Despliegue en AWS](#despliegue-en-aws)
- [Gestión de plantillas](#gestión-de-plantillas)
- [Comandos de referencia](#comandos-de-referencia)
- [Recursos desplegados](#recursos-desplegados)

---

## Estructura

```
cdk/
  bin/
    notifier-hub.ts       # Entry point — configura y crea el stack
  lib/
    notifier-hub.stack.ts # Stack principal
    constructs/
      api-gateway/        # REST API v1, API Key, Usage Plan
      cloudwatch/         # Log groups por Lambda
      dynamodb/           # Tabla de notificaciones
      iam/                # Roles IAM mínimos por Lambda (ROL001–ROL007)
      lambda/             # Una construct por función Lambda
      sqs/                # Cola principal + DLQ
  common/
    constants/            # NamingConstants, ResourceConstants, InfraConstants
  docker-compose.yml      # LocalStack Pro para desarrollo local
```

---

## Requisitos

- Node.js 20+
- Docker (para LocalStack)
- `LOCALSTACK_AUTH_TOKEN` en `.env` (LocalStack Pro)

---

## Instalación

```bash
# Instalar dependencias CDK
cd cdk && npm install

# Instalar CLI global (una sola vez)
npm install -g aws-cdk aws-cdk-local
pip install awscli-local
```

---

## Desarrollo en LocalStack

> Copiar `.env.example` a `.env` y completar `LOCALSTACK_AUTH_TOKEN`.

```bash
# Levantar LocalStack
docker compose up -d

# Bootstrap (una vez por contenedor)
cdklocal bootstrap

# Deploy
cdklocal deploy --require-approval never

# Preview de cambios
cdklocal diff

# Destruir
cdklocal destroy --force
```

### Scripts disponibles

```bash
npm run setup:local      # bootstrap + deploy + verificar SES
npm run deploy:local     # solo deploy
npm run diff:local       # diff
npm run destroy:local    # destruir stack
```

---

## Despliegue en AWS

```bash
# Bootstrap (una vez por cuenta/región)
cdk bootstrap aws://<ACCOUNT_ID>/us-east-1

# Preview
cdk diff

# Deploy
cdk deploy --require-approval never
```

---

## Comandos de referencia

### Gestión de plantillas

Las plantillas se administran directamente en DynamoDB via CLI — no existe un endpoint de gestión.
La tabla usa `templateId` (PK) + `version` (SK numérico). La versión más alta con `active: true` es la activa.

**Crear o actualizar un template (LocalStack):**

```bash
awslocal dynamodb put-item \
  --table-name UE1NOTIFIERDDB003 \
  --item '{
    "templateId": {"S": "password-reset"},
    "version":    {"N": "1"},
    "channel":    {"S": "email"},
    "provider":   {"S": "ses"},
    "subject":    {"S": "Restablece tu contraseña — {{user.name}}"},
    "body":       {"S": "<p>Usa el código <b>{{token}}</b>. Expira en {{expiry}}.</p>"},
    "active":     {"BOOL": true},
    "createdAt":  {"S": "2026-05-22T10:00:00Z"}
  }'
```

**Crear o actualizar un template (AWS):**

```bash
aws dynamodb put-item \
  --table-name UE1NOTIFIERDDB003 \
  --item '{
    "templateId": {"S": "password-reset"},
    "version":    {"N": "1"},
    "channel":    {"S": "email"},
    "provider":   {"S": "ses"},
    "subject":    {"S": "Restablece tu contraseña — {{user.name}}"},
    "body":       {"S": "<p>Usa el código <b>{{token}}</b>. Expira en {{expiry}}.</p>"},
    "active":     {"BOOL": true},
    "createdAt":  {"S": "2026-05-22T10:00:00Z"}
  }'
```

**Nueva versión de un template existente:** incrementar `version`. El Lambda `enqueue` resuelve siempre la versión más alta con `active: true`.

**Desactivar un template (soft delete):** poner `active: false` en la versión que corresponda.

**Seed de datos de ejemplo (LocalStack):**

```bash
npx ts-node local-test/templates.seed.ts
```

---

### Verificar recursos en LocalStack

```bash
# API Gateway
awslocal apigateway get-rest-apis
awslocal apigateway get-stages --rest-api-id <api-id>

# Lambda
awslocal lambda list-functions --query 'Functions[*].FunctionName'

# DynamoDB
awslocal dynamodb list-tables
awslocal dynamodb scan --table-name UE1NOTIFIERDDB001

# SQS
awslocal sqs list-queues

# SES
awslocal ses list-identities
```

---

## Recursos desplegados

| Recurso | Nombre lógico | Nombre físico |
|---|---|---|
| DynamoDB `notifications` | `NotificationsTable` | `UE1NOTIFIERDDB001` |
| DynamoDB `outbox` | `OutboxTable` | `UE1NOTIFIERDDB002` |
| DynamoDB `templates` | `TemplatesTable` | `UE1NOTIFIERDDB003` |
| SQS main | `MainQueue` | `UE1NOTIFIERSQS001` |
| SQS webhooks | `WebhooksQueue` | `UE1NOTIFIERSQS002` |
| SQS main-DLQ | `DeadLetterQueue` | `UE1NOTIFIERSQS003` |
| SQS webhook-DLQ | `WebhookDeadLetterQueue` | `UE1NOTIFIERSQS004` |
| Lambda `enqueue` | `EnqueueFn` | `UE1NOTIFIERLMB001` |
| Lambda `query` | `QueryFn` | `UE1NOTIFIERLMB002` |
| Lambda `relay` | `RelayFn` | `UE1NOTIFIERLMB003` |
| Lambda `sender` | `SenderFn` | `UE1NOTIFIERLMB004` |
| Lambda `webhook-dispatcher` | `WebhookDispatcherFn` | `UE1NOTIFIERLMB005` |
| Lambda `dlq-processor` | `DlqProcessorFn` | `UE1NOTIFIERLMB006` |
| API Gateway REST | `HttpApi` | `UE1NOTIFIERGTW001` |
| IAM Role `sender-role` | `SenderRoleConstruct` | `UE1NOTIFIERROL001` |
| IAM Role `enqueue-role` | `EnqueueRoleConstruct` | `UE1NOTIFIERROL002` |
| IAM Role `query-role` | `QueryRoleConstruct` | `UE1NOTIFIERROL003` |
| IAM Role `relay-role` | `RelayRoleConstruct` | `UE1NOTIFIERROL004` |
| IAM Role `webhook-dispatcher-role` | `WebhookDispatcherRoleConstruct` | `UE1NOTIFIERROL005` |
| IAM Role `dlq-processor-role` | `DlqProcessorRoleConstruct` | `UE1NOTIFIERROL006` |
| IAM Role `scheduler-execution-role` | `SchedulerExecutionRoleConstruct` | `UE1NOTIFIERROL007` |
| CloudWatch Alarm | `NotificationDlqAlarm` | `UE1NOTIFIERCWA001` |
| CloudWatch Alarm | `WebhookDlqAlarm` | `UE1NOTIFIERCWA002` |
| EventBridge Scheduler | — | Reglas one-time por notificación programada |

