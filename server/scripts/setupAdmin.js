import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { hashAdminPassword } from "../src/config/adminAuth.js";

const envPath = fileURLToPath(new URL("../.env", import.meta.url));

async function ask(question) {
  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    return (await prompt.question(question)).trim();
  } finally {
    prompt.close();
  }
}

async function askHidden(question) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive terminal.");
  }

  stdout.write(question);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  try {
    return await new Promise((resolve, reject) => {
      let value = "";
      const onData = (key) => {
        if (key === "\u0003") {
          stdin.off("data", onData);
          reject(new Error("Admin setup cancelled."));
        } else if (key === "\r" || key === "\n") {
          stdin.off("data", onData);
          resolve(value);
        } else if (key === "\u007f") {
          value = value.slice(0, -1);
        } else {
          value += key;
        }
      };
      stdin.on("data", onData);
    });
  } finally {
    stdin.setRawMode(false);
    stdin.pause();
  }
}

function setEnvValue(contents, name, value) {
  const lines = contents.split(/\r?\n/);
  const index = lines.findIndex((line) => line.startsWith(`${name}=`));
  const assignment = `${name}=${value}`;

  if (index === -1) lines.push(assignment);
  else lines[index] = assignment;

  return lines.filter((line, lineIndex) => line || lineIndex < lines.length - 1).join("\n");
}

async function main() {
  const email = await ask("Admin email: ");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid admin email.");
  }

  const password = await askHidden("Admin password (input hidden): ");
  if (password.length < 12) {
    throw new Error("Use an admin password with at least 12 characters.");
  }
  const confirmation = await askHidden("Confirm admin password: ");
  if (password !== confirmation) {
    throw new Error("The passwords do not match.");
  }

  const previous = await readFile(envPath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  const updates = {
    ADMIN_EMAIL: email.toLowerCase(),
    ADMIN_PASSWORD_HASH: await hashAdminPassword(password),
    JWT_SECRET: randomBytes(48).toString("hex"),
  };
  const contents = Object.entries(updates).reduce(
    (current, [name, value]) => setEnvValue(current, name, value),
    previous
  );

  await writeFile(envPath, `${contents.replace(/\n*$/, "")}\n`, {
    mode: 0o600,
  });
  stdout.write("Admin credentials configured in server/.env. Password and secrets were not displayed.\n");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
