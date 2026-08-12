declare module "sanitize-html" {
  export interface IOptions { allowedTags?: string[]; allowedAttributes?: Record<string, string[]>; }
  export default function sanitizeHtml(input: string, options?: IOptions): string;
}
