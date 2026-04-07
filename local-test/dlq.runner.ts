import 'dotenv/config';
import { SQSEvent } from 'aws-lambda';
import { handler } from '../src/dlq/infrastructure/bootstrap/dlq.handler';
import { NotificationStatus } from '../src/common/constants/notification-status.constants';

// Reemplaza notificationId con uno real que exista en DynamoDB
const event: SQSEvent = {
  Records: [
    {
      messageId: 'local-dlq-001',
      receiptHandle: 'local-receipt-dlq-001',
      body: JSON.stringify({
        notificationId: 'REEMPLAZA_CON_UN_ID_REAL',
        channel: 'email',
        provider: 'ses',
        to: 'user@example.com',
        subject: 'Hola desde local runner',
        body: 'Cuerpo de prueba',
        status: NotificationStatus.PENDING,
        ttl: Math.floor(Date.now() / 1000) + 86400,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      attributes: {
        ApproximateReceiveCount: '4',
        SentTimestamp: String(Date.now()),
        SenderId: '000000000000',
        ApproximateFirstReceiveTimestamp: String(Date.now()),
      },
      messageAttributes: {},
      md5OfBody: '',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-east-1:000000000000:notifications-dlq',
      awsRegion: 'us-east-1',
    },
  ],
};

handler(event).then(() => {
  console.log('DLQ procesado correctamente.');
}).catch(console.error);
