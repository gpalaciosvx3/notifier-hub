import 'dotenv/config';
import { SQSEvent } from 'aws-lambda';
import { handler } from '../src/worker/infrastructure/bootstrap/worker.handler';
import { NotificationStatus } from '../src/common/constants/notification-status.constants';

// Reemplaza notificationId con uno real que exista en DynamoDB
const event: SQSEvent = {
  Records: [
    {
      messageId: 'local-msg-001',
      receiptHandle: 'local-receipt-001',
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
        ApproximateReceiveCount: '1',
        SentTimestamp: String(Date.now()),
        SenderId: '000000000000',
        ApproximateFirstReceiveTimestamp: String(Date.now()),
      },
      messageAttributes: {},
      md5OfBody: '',
      eventSource: 'aws:sqs',
      eventSourceARN: 'arn:aws:sqs:us-east-1:000000000000:notifications-queue',
      awsRegion: 'us-east-1',
    },
  ],
};

handler(event).then(result => {
  console.log('batchItemFailures:', result.batchItemFailures);
}).catch(console.error);
