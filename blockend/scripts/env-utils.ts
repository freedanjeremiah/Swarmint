import * as fs from "fs";

export function setEnvKey(content: string, key: string, value: string): string {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^${escapedKey}=.*$`, "m");
  if (regex.test(content)) {
    return content.replace(regex, `${key}=${value}`);
  }
  const sep = content.length === 0 || content.endsWith("\n") ? "" : "\n";
  return `${content}${sep}${key}=${value}\n`;
}

export function updateEnvFile(filePath: string, updates: Record<string, string>): void {
  let content = "";
  try {
    content = fs.readFileSync(filePath, "utf8");
  } catch (e: any) {
    if (e.code !== "ENOENT") throw e;
  }
  for (const [key, value] of Object.entries(updates)) {
    content = setEnvKey(content, key, value);
  }
  fs.writeFileSync(filePath, content);
}
