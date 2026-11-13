import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import appointment from "models/appointment.js";
import { ForbiddenError } from "infra/errors.js";

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

  return response.status(201).json(newAppointment);
}
