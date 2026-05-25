import 'dotenv/config';
import * as http from 'http';

const PORT = parseInt(process.env.WEBHOOK_PORT ?? '3001', 10);

const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  let raw = '';
  req.on('data', (chunk: Buffer) => {
    raw += chunk.toString();
  });

  req.on('end', () => {
    const timestamp = new Date().toISOString();
    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }

    console.log(`\n─── Webhook recibido [${timestamp}] ──────────────────`);
    console.log(`  POST ${req.url}`);
    console.log(JSON.stringify(payload, null, 2));
    console.log(`─────────────────────────────────────────────────────`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ received: true }));
  });
});

server.listen(PORT, () => {
  console.log(`Webhook receiver escuchando en http://localhost:${PORT}`);
  console.log('callbackUrl para pruebas (localstack): http://host.docker.internal:' + PORT + '/webhook');
});
