import nodemailer from "nodemailer";
import { ServiceError } from "./errors.js";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASSWORD,
  },
  secure: process.env.NODE_ENV === "production" ? true : false,
});

process.stdout.write(`\n\n📨 Email server running at http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}\n`);

async function send(mailOptions) {
  try {
    await transporter.sendMail(mailOptions);
    process.stdout.write(`\n\n📩 Email enviado com sucesso, verifique em http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}\n`);
  } catch (error) {
    throw new ServiceError({
      message: "Não foi possível enviar o email.",
      action: "Verifique se o serviço de email está disponível.",
      cause: error,
      context: mailOptions,
    });
  }
}

const email = {
  send,
};

export default email;
