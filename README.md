# notifier-hub

Servicio backend centralizado para envío de notificaciones multi-canal (email, SMS, etc).

---

## Arquitectura

> Agrega tu diagrama pegando la imagen en `docs/architecture.png` y descomenta la línea siguiente:
![Arquitectura](./docs/notifier-hub-architec.png)

---

## Flujo de datos

```
Cliente
  │
  ▼
API Gateway (REST v1)  ──►  POST /v1/notify
  │                          GET  /v1/notifications
  │                          GET  /v1/notifications/{id}
  ▼
Lambda enqueue             Lambda query
  │                              ▲
  ▼                              │
SQS main ──► Lambda worker ──► DynamoDB
  │
  ▼ (on failure)
SQS DLQ ──► Lambda dlq
```

---

## Canales soportados (primera  versión)

| Canal | Proveedor | Estado |
|---|---|---|
| Email | AWS SES | ✅ Activo |
| SMS | AWS SNS | ✅ Activo |

---

### POST `/v1/notify`

Encola una nueva notificación.

---

### GET `/v1/notifications/{id}`

Consulta una notificación por ID.

---

### GET `/v1/notifications?status=PENDING`

Lista notificaciones filtradas por estado.

---

## Comandos

### Desarrollo local

```bash
# Instalar dependencias
npm install

# Type check
npm run typecheck

# Tests unitarios
npm test
```

### CDK local (LocalStack)

> Requiere Docker corriendo y `LOCALSTACK_AUTH_TOKEN` en `.env`

```bash
# Levantar LocalStack
docker compose up -d

# Instalar CDK local
npm install -g aws-cdk aws-cdk-local
pip install awscli-local

# Bootstrap + deploy
cdklocal bootstrap
CDK_STAGE=local cdklocal deploy --require-approval never

# Verificar recursos
awslocal sqs list-queues
awslocal dynamodb list-tables
awslocal lambda list-functions
awslocal apigateway get-rest-apis
```

### CDK en AWS

```bash
# Bootstrap (una vez por cuenta/región)
cdk bootstrap aws://<ACCOUNT_ID>/us-east-1

# Deploy
CDK_STAGE=dev cdk deploy --require-approval never

# Preview de cambios antes de deployar
CDK_STAGE=dev cdk diff

# Destruir el stack
CDK_STAGE=dev cdk destroy
```

---

## CI/CD

Los pipelines están en `.github/workflows/`:

| Archivo | Trigger | Acción |
|---|---|---|
| `local.yml` | `push` a `feature/*` | Smoke test para Deploy en LocalStack |
| `dev.yml` | `push` a `develop` | Deploy en AWS DEV |
| `qa.yml` | `push` a `release/*` | Deploy en AWS QA |
| `prd.yml` | `push` a `main` | Deploy en AWS PRD |
| `destroy.yml` | Manual (`workflow_dispatch`) | Destruye el stack del stage seleccionado |

### Secretos requeridos por ambiente

Configurar en GitHub → Settings → Environments → `deployer-dev` / `deployer-qa` / `deployer-prd`:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
CDK_DEFAULT_ACCOUNT
CDK_DEFAULT_REGION
SES_SOURCE_EMAIL
```

Para el environment `ci` (LocalStack):
```
LOCALSTACK_AUTH_TOKEN
```

---