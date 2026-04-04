# notifier-hub — CDK

## Instalación global (una sola vez)

```bash
npm install -g aws-cdk aws-cdk-local awslocal
cd cdk && npm install
```

---

## Local (LocalStack)

**1. Levantar LocalStack**
```bash
docker run --rm -d --name localstack -p 4566:4566 \
  -e SERVICES=dynamodb,sqs,lambda,apigateway,iam,logs,ses,sns \
  -e DEFAULT_REGION=us-east-1 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  localstack/localstack
```

**2. Bootstrap** _(una vez por contenedor)_
```bash
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=us-east-1 \
cdklocal bootstrap
```

**3. Deploy / Diff / Destroy**
```bash
npm run deploy:local
npm run diff:local
npm run destroy:local
```

---

## AWS dev

**1. Configurar credenciales**
```bash
aws configure
```

**2. Bootstrap** _(una vez por cuenta/región)_
```bash
CDK_STAGE=dev cdk bootstrap
```

**3. Deploy / Diff**
```bash
SES_SOURCE_EMAIL=noreply@tudominio.com npm run deploy:dev
SES_SOURCE_EMAIL=noreply@tudominio.com npm run diff:dev
```

> `SES_SOURCE_EMAIL` debe ser un email verificado en SES.

---

## Comandos útiles (LocalStack)

```bash
# Listar todas las APIs creadas
awslocal apigatewayv2 get-apis

# Con el API ID del output anterior:
awslocal apigatewayv2 get-routes --api-id <api-id>
awslocal apigatewayv2 get-stages --api-id <api-id>
awslocal apigatewayv2 get-integrations --api-id <api-id>

# Lambda
awslocal lambda list-functions --query 'Functions[*].FunctionName'

# Logs
awslocal logs tail /aws/lambda/notifier-hub-enqueue --follow
awslocal logs tail /aws/lambda/notifier-hub-query --follow
awslocal logs tail /aws/lambda/notifier-hub-worker --follow
awslocal logs tail /aws/lambda/notifier-hub-dlq --follow
awslocal logs describe-log-groups --query 'logGroups[*].logGroupName'

# DynamoDB
awslocal dynamodb scan --table-name notifications

# SQS
awslocal sqs get-queue-attributes \
  --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/notifications-queue \
  --attribute-names ApproximateNumberOfMessages

awslocal sqs send-message \
  --queue-url http://sqs.us-east-1.localhost.localstack.cloud:4566/000000000000/notifications-queue \
  --message-body '{"notificationId":"01J...","channel":"email","status":"PENDING"}'

# Invocar Lambda directamente
awslocal lambda invoke \
  --function-name notifier-hub-worker \
  --payload '{"Records":[{"messageId":"msg-001","eventSource":"aws:sqs","body":"{\"notificationId\":\"01J...\",\"channel\":\"email\",\"provider\":\"ses\",\"to\":\"user@example.com\",\"subject\":\"Hola\",\"body\":\"Test\",\"status\":\"PENDING\",\"createdAt\":\"2026-01-01T00:00:00.000Z\",\"updatedAt\":\"2026-01-01T00:00:00.000Z\",\"ttl\":9999999999}"}]}' \
  /dev/stdout

awslocal lambda invoke \
  --function-name notifier-hub-dlq \
  --payload '{"Records":[{"messageId":"msg-001","eventSource":"aws:sqs","body":"{\"notificationId\":\"01J...\",\"channel\":\"email\",\"provider\":\"ses\",\"to\":\"user@example.com\",\"subject\":\"Hola\",\"body\":\"Test\",\"status\":\"PENDING\",\"createdAt\":\"2026-01-01T00:00:00.000Z\",\"updatedAt\":\"2026-01-01T00:00:00.000Z\",\"ttl\":9999999999}"}]}' \
  /dev/stdout
```


