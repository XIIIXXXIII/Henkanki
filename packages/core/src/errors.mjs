export class HenkankiError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'HenkankiError';
    this.code = code;
    this.details = details;
  }
}

export const error = (code, message, details) => new HenkankiError(code, message, details);
