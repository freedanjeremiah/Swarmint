import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { setEnvKey, updateEnvFile } from "../scripts/env-utils";

describe("setEnvKey", () => {
  it("replaces an existing key value", () => {
    const result = setEnvKey("FOO=old\nBAR=keep\n", "FOO", "new");
    expect(result).to.equal("FOO=new\nBAR=keep\n");
  });

  it("appends a new key when not present", () => {
    const result = setEnvKey("FOO=old\n", "BAR", "new");
    expect(result).to.equal("FOO=old\nBAR=new\n");
  });

  it("appends correctly to an empty string", () => {
    const result = setEnvKey("", "FOO", "val");
    expect(result).to.equal("FOO=val\n");
  });

  it("replaces an empty value", () => {
    const result = setEnvKey("FOO=\nBAR=keep\n", "FOO", "filled");
    expect(result).to.equal("FOO=filled\nBAR=keep\n");
  });

  it("does not match a key that has the target as a prefix", () => {
    const result = setEnvKey("PRIVATE_KEY_EXTRA=keep\nPRIVATE_KEY=old\n", "PRIVATE_KEY", "new");
    expect(result).to.include("PRIVATE_KEY_EXTRA=keep");
    expect(result).to.include("PRIVATE_KEY=new");
    expect(result).not.to.include("PRIVATE_KEY=old");
  });
});

describe("updateEnvFile", () => {
  let tmpDir: string;
  let tmpFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-utils-test-"));
    tmpFile = path.join(tmpDir, ".env");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it("writes multiple key updates to a file", () => {
    fs.writeFileSync(tmpFile, "A=old\nB=old\n");
    updateEnvFile(tmpFile, { A: "new_a", B: "new_b" });
    const result = fs.readFileSync(tmpFile, "utf8");
    expect(result).to.equal("A=new_a\nB=new_b\n");
  });

  it("creates the file when it does not exist", () => {
    const nonExistentPath = path.join(tmpDir, "nonexistent.env");
    updateEnvFile(nonExistentPath, { FOO: "bar" });
    const result = fs.readFileSync(nonExistentPath, "utf8");
    expect(result).to.equal("FOO=bar\n");
  });
});
