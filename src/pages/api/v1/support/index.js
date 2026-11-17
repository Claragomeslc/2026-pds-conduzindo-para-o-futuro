import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import email from "infra/email.js";
import { ValidationError } from "infra/errors.js";

// RF20: formulário de suporte que envia um e-mail para a equipe
export default createRouter()
  .post(postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const { name, email: userEmail, message } = request.body;

  if (!name || !userEmail || !message) {
    throw new ValidationError({
      message: "Nome, e-mail e mensagem são obrigatórios.",
      action: "Preencha todos os campos do formulário.",
    });
  }

  await email.send({
    from: "Conduzindo Para O Futuro <contato@conduzindoparaofuturo.com.br>",
    to: "suporte@conduzindoparaofuturo.com.br",
    replyTo: userEmail,
    subject: `Suporte: mensagem de ${name}`,
    text: `Nome: ${name}
E-mail: ${userEmail}

${message}`,
  });

  return response.status(201).json({ message: "Mensagem enviada." });
}
