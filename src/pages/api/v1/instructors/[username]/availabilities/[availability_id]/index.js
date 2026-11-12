import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import instructor from "models/instructor.js";
import authorization from "models/authorization.js";
import { ForbiddenError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:session"), getHandler)
  .patch(controller.canRequest("update:user"), patchHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const availabilityId = request.query.availability_id;

  const targetInstructor = await user.findOneByUsername(username);
  const availabilityFound =
    await instructor.findOneByInstructorAndAvailabilityId(
      targetInstructor.id,
      availabilityId,
    );

  return response.status(200).json(availabilityFound);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const availabilityId = request.query.availability_id;
  const userTryingToPatch = request.context.user;
  const inputValues = request.body;

  const targetInstructor = await user.findOneByUsername(username);

  if (!authorization.can(userTryingToPatch, "update:user", targetInstructor)) {
    throw new ForbiddenError({
      message: "Você não possui permissão para atualizar outro usuário.",
      action:
        "Verifique se você possui a feature necessária para atualizar outro usuário.",
    });
  }

  if (targetInstructor.role !== "instructor") {
    throw new ForbiddenError({
      message: "Você não possui permissão para alterar dados de um instrutor.",
      action:
        "Verifique se você possui a feature necessária para alterar dados de um instrutor.",
    });
  }

  const updatedAvailability = await instructor.updateAvailability(
    targetInstructor.id,
    availabilityId,
    inputValues,
  );

  return response.status(200).json(updatedAvailability);
}
