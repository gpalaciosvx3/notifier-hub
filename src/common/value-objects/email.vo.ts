export class Email {
  private static readonly REGEX_RFC = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  static isValid(value: string): boolean {
    return Email.REGEX_RFC.test(value);
  }
}
