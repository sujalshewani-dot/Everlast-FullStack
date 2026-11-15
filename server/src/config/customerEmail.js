import nodemailer from "nodemailer";

export function createCustomerEmailTransport(environment = process.env) {
  const host = environment.SMTP_HOST?.trim();
  const port = Number(environment.SMTP_PORT);
  const user = environment.SMTP_USER?.trim();
  const password = environment.SMTP_PASS;
  const from = environment.SMTP_FROM?.trim();

  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !user ||
    !password ||
    !from
  ) {
    return null;
  }

  return {
    from,
    transport: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user, pass: password },
    }),
  };
}
