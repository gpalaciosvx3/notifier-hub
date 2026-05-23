export abstract class CallbackHttpRepository {
  abstract post(url: string, payload: object): Promise<boolean>;
}
