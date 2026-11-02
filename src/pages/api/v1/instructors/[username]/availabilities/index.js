import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import authorization from "models/authorization.js";
import instructor from "models/instructor.js";
import { ForbiddenError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("update:user"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const username = request.query.username;
  const inputValues = request.body;

  const userTryingToPost = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(userTryingToPost, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário.",
      action:
        "Verifique se você possui a feature necessária para atualizar outro usuário.",
    });
  }

  if (targetUser.role !== "instructor") {
    throw new ForbiddenError({
      message: "Você não possui permissão para alterar dados de um instrutor.",
      action:
        "Verifique se você possui a feature necessária para alterar dados de um instrutor.",
    });
  }

  const newAvailability = await instructor.createAvailability(inputValues);

  return response.status(201).json(newAvailability);
}
