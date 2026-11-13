import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import authorization from "models/authorization.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("read:session"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userTryingToQuery = request.context.user;
  const userInputParams = request.body;
  const results = await user.queryAll(userInputParams);

  const users = [];
  if (results?.users?.length > 0) {
    results.users.forEach((user) => {
      const secureOutputValues = authorization.filterOutput(
        userTryingToQuery,
        "query:user:instructor",
        user,
      );
      users.push(secureOutputValues);
    });
  }

  return response.status(200).json({ users, total: results.total });
}
