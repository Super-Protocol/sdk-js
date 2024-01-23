export class AnalyticsError extends Error {
  public readonly code: number | null;
  constructor({ code, message }: { code: number | null, message: string }) {
    super(message);
    this.code = code;
  }
}