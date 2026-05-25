import 'dotenv/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
    ...(process.env.AWS_ENDPOINT_URL
      ? { endpoint: process.env.AWS_ENDPOINT_URL }
      : {}),
  }),
);

const TABLE_NAME = 'UE1NOTIFIERDDB003';

const templates = [
  {
    templateId: 'bienvenida-usuario',
    version: 1,
    channel: 'email',
    provider: 'ses',
    subject: 'Bienvenido, {{user.name}}',
    body: '<h1>Hola {{user.name}}, tu cuenta fue creada el {{date}}.</h1><p>Ya puedes iniciar sesión en nuestra plataforma.</p>',
    active: true,
    createdAt: '2026-05-22T10:00:00Z',
  },
  {
    templateId: 'password-reset',
    version: 1,
    channel: 'email',
    provider: 'ses',
    subject: 'Restablece tu contraseña — {{user.name}}',
    body: '<p>Hola {{user.name}}, usa el código <b>{{token}}</b> para restablecer tu contraseña. Expira en {{expiry}}.</p>',
    active: true,
    createdAt: '2026-05-22T10:00:00Z',
  },
  {
    templateId: 'recordatorio-pago',
    version: 1,
    channel: 'email',
    provider: 'ses',
    subject: 'Recordatorio: tu pago de {{monto}} vence el {{vence}}',
    body: '<p>Hola, te recordamos que tienes un pago pendiente de <b>{{monto}}</b> con vencimiento el <b>{{vence}}</b>.</p>',
    active: true,
    createdAt: '2026-05-22T10:00:00Z',
  },
  {
    templateId: 'alerta-sms',
    version: 1,
    channel: 'sms',
    provider: 'sns',
    subject: '',
    body: 'Hola {{user.name}}, tu código de verificación es {{code}}. Válido por {{expiry}}.',
    active: true,
    createdAt: '2026-05-22T10:00:00Z',
  },
];

async function seed(): Promise<void> {
  for (const template of templates) {
    await client.send(new PutCommand({ TableName: TABLE_NAME, Item: template }));
    console.log(`✓ ${template.templateId} v${template.version} (${template.channel})`);
  }
  console.log(`\nSeed completo — ${templates.length} plantillas insertadas en ${TABLE_NAME}`);
}

seed().catch(console.error);
