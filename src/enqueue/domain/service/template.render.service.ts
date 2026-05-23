import { CustomException } from '../../../common/errors/custom.exception';
import { ErrorDictionary } from '../../../common/errors/error.dictionary';
import { TemplateConstants } from '../constants/template.constants';
import { TemplateRecord } from '../types/template-record.types';
import { NotificationInput } from '../types/notification-input.types';
import { NotificationInputMapper } from '../mapper/notification-input.mapper';

export class TemplateRenderService {
  buildInput(template: TemplateRecord, to: string, variables: Record<string, unknown>, callbackUrl: string): NotificationInput {
    const renderedSubject = template.subject ? this.render(template.subject, variables) : undefined;
    const renderedBody = this.render(template.body, variables);
    return NotificationInputMapper.fromTemplate(template, to, renderedSubject, renderedBody, callbackUrl);
  }

  private render(template: string, variables: Record<string, unknown>): string {
    const rendered = template.replace(/\{\{([^}]+)\}\}/g, (_, path: string) => {
      const value = this.resolvePath(path.trim(), variables);
      return value !== undefined && value !== null ? String(value) : '';
    });
    this.validateSize(rendered);
    return rendered;
  }

  private resolvePath(path: string, variables: Record<string, unknown>): unknown {
    return path.split('.').reduce<unknown>((current, key) => {
      if (current === null || current === undefined || typeof current !== 'object') return undefined;
      return (current as Record<string, unknown>)[key];
    }, variables);
  }

  private validateSize(rendered: string): void {
    if (Buffer.byteLength(rendered, 'utf8') > TemplateConstants.MAX_RENDERED_BYTES) {
      throw new CustomException(ErrorDictionary.TEMPLATE_TOO_LARGE);
    }
  }
}
