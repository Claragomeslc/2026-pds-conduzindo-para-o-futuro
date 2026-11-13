import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import instructor from "models/instructor.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("read:session"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const username = request.query.username;
  const inputParams = request.body;
  const targetInstructor = await user.findOneByUsername(username);
  const results = await instructor.queryAll(targetInstructor.id, inputParams);

  return response.status(200).json(results);
}
