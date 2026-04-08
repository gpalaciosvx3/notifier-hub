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

# DynamoDB
awslocal dynamodb scan --table-name notifications

# SES
awslocal ses get-send-statistics
```

