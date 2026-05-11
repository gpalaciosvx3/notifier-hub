# notifier-hub — CDK

Infraestructura AWS del proyecto `notifier-hub`, definida con AWS CDK (TypeScript).

---

## Índice

- [Estructura](#estructura)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Desarrollo en LocalStack](#desarrollo-en-localstack)
- [Despliegue en AWS](#despliegue-en-aws)
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
      iam/                # Rol de ejecución compartido
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
| DynamoDB Table | `NotificationsTable` | `UE1NOTIFIERDDB001` |
| SQS Main Queue | `MainQueue` | `UE1NOTIFIERSQS001` |
| SQS Dead Letter Queue | `DeadLetterQueue` | `UE1NOTIFIERSQS002` |
| Lambda Enqueue | `EnqueueFn` | `UE1NOTIFIERLMB001` |
| Lambda Query | `QueryFn` | `UE1NOTIFIERLMB002` |
| Lambda Worker | `WorkerFn` | `UE1NOTIFIERLMB003` |
| Lambda DLQ Processor | `DlqProcessorFn` | `UE1NOTIFIERLMB004` |
| API Gateway REST | `HttpApi` | `UE1NOTIFIERGTW001` |
| IAM Role | `WorkerRole` | `UE1NOTIFIERROL001` |

