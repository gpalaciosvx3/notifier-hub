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

    messages.forEach(message => {
      const line = `${ctx} ${level} - ${String(message)}`;
      process[writeStreamType ?? 'stdout'].write(line + '\n');
    });
  }
}
