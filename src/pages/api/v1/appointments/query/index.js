import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import appointment from "models/appointment.js";
import { ForbiddenError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("read:session"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const inputParams = request.body;

  const userTryingToQuery = request.context.user;

  if (inputParams.filters) {
    if (
      userTryingToQuery.role === "student" &&
      inputParams.filters.student_id
    ) {
      if (inputParams.filters.student_id !== userTryingToQuery.id) {
        throw new ForbiddenError({
          message:
            "Você não possui permissão para buscar agendamentos de outro aluno.",
          action:
            "Verifique se você possui a feature necessária para buscar esses agendamentos.",
        });
      }
      delete inputParams.filters.student_id;
    }

    if (
      userTryingToQuery.role === "instructor" &&
      inputParams.filters.instructor_id
    ) {
      if (inputParams.filters.instructor_id !== userTryingToQuery.id) {
        throw new ForbiddenError({
          message:
            "Você não possui permissão para buscar agendamentos de outro instrutor.",
          action:
            "Verifique se você possui a feature necessária para buscar esses agendamentos.",
        });
      }
      delete inputParams.filters.instructor_id;
    }
  }

  const results = await appointment.queryAll(userTryingToQuery.id, inputParams);

  return response.status(200).json(results);
}
