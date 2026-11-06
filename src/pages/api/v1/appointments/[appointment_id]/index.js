import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import appointment from "models/appointment.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:session"), getHandler)
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
