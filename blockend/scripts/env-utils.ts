import * as fs from "fs";

export function setEnvKey(content: string, key: string, value: string): string {
  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  }
  const sep = content.endsWith("\n") ? "" : "\n";
  return `${content}${sep}${key}=${value}\n`;
}

export function updateEnvFile(filePath: string, updates: Record<string, string>): void {
  let content = fs.readFileSync(filePath, "utf8");
  for (const [key, value] of Object.entries(updates)) {
    content = setEnvKey(content, key, value);
  }
  fs.writeFileSync(filePath, content);
}
