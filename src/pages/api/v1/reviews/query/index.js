import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import appointment from "models/appointment.js";
import review from "models/review.js";
import { ForbiddenError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("read:session"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const inputParams = request.body;

  const userTryingToQuery = request.context.user;

  if (inputParams.filters) {
    if (inputParams.filters.appointment_id) {
      await appointment.findOneById(
        inputParams.filters.appointment_id,
        userTryingToQuery.id,
      );
    }
    if (
      userTryingToQuery.role === "student" &&
      inputParams.filters.reviewer_user_id
    ) {
      if (inputParams.filters.reviewer_user_id !== userTryingToQuery.id) {
        throw new ForbiddenError({
          message:
            "Você não possui permissão para buscar avaliações de outro aluno.",
          action:
            "Verifique se você possui a feature necessária para buscar essas avaliações.",
        });
      }
    }

    if (
      userTryingToQuery.role === "instructor" &&
      inputParams.filters.reviewer_user_id
    ) {
      if (inputParams.filters.reviewer_user_id !== userTryingToQuery.id) {
        throw new ForbiddenError({
          message:
            "Você não possui permissão para buscar avaliações de outro instrutor.",
          action:
            "Verifique se você possui a feature necessária para buscar essas avaliações.",
        });
      }
    }
  }

  const results = await review.queryAll(userTryingToQuery.id, inputParams);

  return response.status(200).json(results);
}
