import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import review from "models/review.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .get(controller.canRequest("read:session"), getHandler)
  .patch(controller.canRequest("update:user"), patchHandler)
  .handler(controller.errorHandlers);

async function getHandler(request, response) {
  const reviewId = request.query.review_id;
  const userTryingToGet = request.context.user;

  const reviewFound = await review.findOneById(reviewId, userTryingToGet.id);

  return response.status(200).json(reviewFound);
}

async function patchHandler(request, response) {
  const reviewId = request.query.review_id;
  const userTryingToPatch = request.context.user;
  const inputValues = request.body;

  const updatedReview = await review.update(
    reviewId,
    userTryingToPatch.id,
    inputValues,
  );

  return response.status(200).json(updatedReview);
}
