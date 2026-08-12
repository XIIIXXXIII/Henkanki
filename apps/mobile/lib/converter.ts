import YAML from "js-yaml";

export type Format = "json" | "yaml" | "text";
export const formats: Format[] = ["json", "yaml", "text"];
export function convert(text: string, from: Format, to: Format) {
  if (from === to) return text;
  if (from === "json" && to === "yaml") return YAML.dump(JSON.parse(text), { noRefs: true });
  if (from === "yaml" && to === "json") return `${JSON.stringify(YAML.load(text), null, 2)}\n`;
  if (to === "text") return from === "json" ? `${JSON.stringify(JSON.parse(text), null, 2)}\n` : text;
  if (from === "text" && to === "json") return `${JSON.stringify({ content: text }, null, 2)}\n`;
  if (from === "text" && to === "yaml") return YAML.dump({ content: text }, { noRefs: true });
  throw new Error(`No verified mobile conversion from ${from} to ${to}.`);
}
