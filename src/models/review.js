import database from "infra/database.js";
import { ValidationError } from "infra/errors.js";

async function create(reviewerId, inputValues) {
  inputValues.context = inputValues.context || "general";
  validateContext(inputValues.context);
  if (inputValues.appointment_id) {
    inputValues.context = "appointment";
  }

  const newReview = await runInsertQuery(inputValues);

  return newReview;

  async function runInsertQuery(inputValues) {
    const results = await database.query({
      text: `
        INSERT INTO reviews (
            reviewer_user_id, reviewed_user_id, appointment_id, 
            context, rating, comment
          )
        VALUES
          ($1, $2, $3, $4, $5, $6)
        RETURNING
          *
        ;`,
      values: [
        reviewerId,
        inputValues.reviewed_user_id,
        inputValues.appointment_id,
        inputValues.context,
        inputValues.rating,
        inputValues.comment,
      ],
    });
    return results.rows[0];
  }
}

function validateContext(context) {
  const validCategories = ["appointment", "general"];
  if (
    context &&
    typeof context === "string" &&
    validCategories.indexOf(context) === -1
  ) {
    throw new ValidationError({
      message: "O contexto da avaliação informado é inválido.",
      action: "Utilize um dos contextos de avaliação válidos.",
    });
  }

  return true;
}

const review = {
  create,
};

export default review;
