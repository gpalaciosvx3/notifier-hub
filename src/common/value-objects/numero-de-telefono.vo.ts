export class PhoneNumber {
  private static readonly REGEX_E164 = /^\+[1-9]\d{1,14}$/;

  static isValid(value: string): boolean {
    return PhoneNumber.REGEX_E164.test(value);
  }
}
