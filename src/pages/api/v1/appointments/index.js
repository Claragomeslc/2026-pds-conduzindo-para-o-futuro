import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import appointment from "models/appointment.js";
import { ForbiddenError } from "infra/errors.js";
import email from "infra/email.js";
import webserver from "infra/webserver.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("update:user"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const inputValues = request.body;

  const userStudentTryingToPost = request.context.user;
  if (userStudentTryingToPost.role !== "student") {
    throw new ForbiddenError({
      message: "Você não possui permissão para agendar aula.",
      action:
        "Verifique se você possui a feature necessária para agendar aula.",
    });
  }

  const targetUserInstructor = await user.findOneById(
    inputValues.instructor_id,
  );
  if (targetUserInstructor.role !== "instructor") {
    throw new ForbiddenError({
      message: "Você não possui permissão para agendar aula com este usuário.",
      action:
        "Verifique se você está agendando aula com um usuário que possui perfil de instrutor.",
    });
  }

  if (
    !targetUserInstructor.status ||
    targetUserInstructor.status !== "active"
  ) {
    throw new ForbiddenError({
      message: "Você ainda não pode agendar aula com este instrutor.",
      action:
        "Verifique se você o instrutor que você selecionou está ativo na aplicação.",
    });
  }

  const newAppointment = await appointment.create(
    userStudentTryingToPost.id,
    inputValues,
  );

  // RF07: avisa o aluno e o instrutor por e-mail
  const classDate = new Date(newAppointment.starts_at).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
  await email.send({
    from: "Conduzindo Para O Futuro <contato@conduzindoparaofuturo.com.br>",
    to: [userStudentTryingToPost.email, targetUserInstructor.email],
    subject: "Nova aula agendada no Conduzindo Para O Futuro!",
    text: `Uma aula foi agendada.

Aluno: ${userStudentTryingToPost.fullname}
Instrutor: ${targetUserInstructor.fullname}
Data: ${classDate}

Acompanhe em: ${webserver.origin}/aulas

Atenciosamente,
Equipe Conduzindo Para O Futuro`,
  });

  return response.status(201).json(newAppointment);
}
