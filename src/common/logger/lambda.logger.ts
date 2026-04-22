import { ConsoleLogger, LogLevel } from '@nestjs/common';

export class LambdaLogger extends ConsoleLogger {
  protected printMessages(
    messages: unknown[],
    context = '',
    logLevel: LogLevel = 'log',
    writeStreamType?: 'stdout' | 'stderr',
  ): void {
    const level = logLevel.toUpperCase().padEnd(5);
    const ctx   = context ? `[${context}]` : '';
    const time  = new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour12: false })
                + '.' + String(new Date().getMilliseconds()).padStart(3, '0');

    messages.forEach(message => {
      const line = `${time} ${ctx} ${level} - ${String(message)}`;
      process[writeStreamType ?? 'stdout'].write(line + '\n');
    });
  }
}
