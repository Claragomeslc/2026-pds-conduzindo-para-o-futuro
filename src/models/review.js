import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function findOneById(reviewId, userId) {
  const reviewFound = await runSelectQuery(reviewId, userId);

  return reviewFound;

  async function runSelectQuery(reviewId, userId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          reviews
        WHERE
          id = $1 AND (reviewer_user_id = $2 OR reviewed_user_id = $2)
        LIMIT
          1
        ;`,
      values: [reviewId, userId],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

async function create(reviewerId, inputValues) {
  inputValues.context = inputValues.context || "general";
  validateContext(inputValues.context);
  if (inputValues.appointment_id) {
    inputValues.context = "appointment";
  }
  validateRating(inputValues.rating);

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

async function update(reviewId, userId, inputValues) {
  const currentReview = await findOneById(reviewId, userId);

  if ("rating" in inputValues) {
    validateRating(inputValues.rating);
  }

  const reviewWithNewValues = { ...currentReview, ...inputValues };

  const updatedReview = await runUpdateQuery(reviewWithNewValues);
  return updatedReview;

  async function runUpdateQuery(reviewWithNewValues) {
    const results = await database.query({
      text: `
        UPDATE
          reviews
        SET
          rating = $3,
          comment = $4,
          updated_at = timezone('utc', now())
        WHERE
          id = $1 AND (reviewer_user_id = $2 OR reviewed_user_id = $2)
        RETURNING
          *
      `,
      values: [
        reviewId,
        userId,
        reviewWithNewValues.rating,
        reviewWithNewValues.comment,
      ],
    });
    return results.rows[0];
  }
}

async function queryAll(userId, inputParams) {
  let sqlQuery = `
    FROM
      reviews
    WHERE
      rating > 0
  `;
  let sqlSort = "";
  let sqlPagination = "";
  let values = [];
  let countValues = [];
  const filters = inputParams.filters || {};
  if (filters.reviewer_user_id) {
    values.push(filters.reviewer_user_id);
    countValues.push(filters.reviewer_user_id);
    sqlQuery += ` AND reviewer_user_id = $${values.length} `;
  }
  if (filters.reviewed_user_id) {
    values.push(filters.reviewed_user_id);
    countValues.push(filters.reviewed_user_id);
    sqlQuery += ` AND reviewed_user_id = $${values.length} `;
  }
  if (filters.appointment_id) {
    values.push(filters.appointment_id);
    countValues.push(filters.appointment_id);
    sqlQuery += ` AND appointment_id = $${values.length} `;
  }

  const sort = inputParams.sort || {};
  const sortFields = [];
  Object.keys(sort).forEach((chave) => {
    sortFields.push(`${chave} ${sort[chave].toUpperCase()}`);
  });
  if (sortFields.length > 0) {
    sqlSort += ` ORDER BY ${sortFields.join(", ")} `;
  }

  const pagination = inputParams.pagination || {};
  if (pagination.page && pagination.limit) {
    const offset = (pagination.page - 1) * pagination.limit;
    values.push(pagination.limit, offset);
    sqlPagination += ` LIMIT $${values.length - 1} OFFSET $${values.length} `;
  }

  const count = await database.query({
    text: `SELECT COUNT(*) ${sqlQuery}`,
    values: countValues,
  });

  const results = await database.query({
    text: `SELECT * ${sqlQuery} ${sqlSort} ${sqlPagination}`,
    values: values,
  });

  return {
    total: parseInt(count.rows[0].count),
    reviews: results.rows,
  };
}

function validateContext(context) {
  const validContexts = ["appointment", "general"];
  if (
    context &&
    typeof context === "string" &&
    validContexts.indexOf(context) === -1
  ) {
    throw new ValidationError({
      message: "O contexto da avaliação informado é inválido.",
      action: "Utilize um dos contextos de avaliação válidos.",
    });
  }

  return true;
}

function validateRating(rating) {
  const minRating = 1;
  const maxRating = 5;
  if (rating !== undefined && (rating < minRating || rating > maxRating)) {
    throw new ValidationError({
      message: "A nota da avaliação informado é inválida.",
      action: "Utilize uma nota válida (1, 2, 3, 4 ou 5).",
    });
  }

  return true;
}

const review = {
  findOneById,
  create,
  update,
  queryAll,
};

export default review;
