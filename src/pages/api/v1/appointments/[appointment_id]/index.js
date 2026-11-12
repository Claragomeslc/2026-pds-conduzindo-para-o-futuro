import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import appointment from "models/appointment.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:session"), getHandler)
  .patch(controller.canRequest("update:user"), patchHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const appointmentId = request.query.appointment_id;
  const userTryingToGet = request.context.user;

  const appointmentFound = await appointment.findOneById(
    appointmentId,
    userTryingToGet.id,
  );

  return response.status(200).json(appointmentFound);
}

async function patchHandler(request, response) {
  const appointmentId = request.query.appointment_id;
  const userTryingToPatch = request.context.user;
  const inputValues = request.body;

  const updatedAppointment = await appointment.update(
    appointmentId,
    userTryingToPatch.id,
    inputValues,
  );

  return response.status(200).json(updatedAppointment);
}
