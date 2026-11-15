import { stdin, stdout } from "node:process";
import { hashAdminPassword } from "../src/config/adminAuth.js";

async function readHiddenPassword() {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error("Run this command in an interactive terminal.");
  }

  stdout.write("Admin password (input hidden): ");
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");

  try {
    return await new Promise((resolve, reject) => {
      let value = "";
      const onData = (key) => {
        if (key === "\u0003") {
          stdin.off("data", onData);
          reject(new Error("Password hashing cancelled."));
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

try {
  const password = await readHiddenPassword();
  if (password.length < 12) {
    throw new Error("Use an admin password with at least 12 characters.");
  }

  const hash = await hashAdminPassword(password);
  stdout.write(`\nADMIN_PASSWORD_HASH=${hash}\n`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
