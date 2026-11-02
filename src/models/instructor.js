import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function findOneByInstructorAndAvailabilityId(instructorId, availabilityId) {
  const availabilityFound = await runSelectQuery(instructorId, availabilityId);

  return availabilityFound;

  async function runSelectQuery(instructorId, availabilityId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          instructor_availability
        WHERE
          instructor_id = $1 AND id = $2
        LIMIT
          1
        ;`,
      values: [instructorId, availabilityId],
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

async function createAvailability(inputValues) {
  inputValues.status = inputValues.status || "open";
  validateStatus(inputValues.status);
  inputValues.day_of_week = inputValues.day_of_week || "monday";
  validateDayOfWeek(inputValues.day_of_week);

  const newAvailability = await runInsertQuery(inputValues);

  return newAvailability;

  async function runInsertQuery(inputValues) {
    const results = await database.query({
      text: `
        INSERT INTO instructor_availability (
            instructor_id, day_of_week, start_time, end_time, status
          )
        VALUES
          ($1, $2, $3, $4, $5)
        RETURNING
          *
        ;`,
      values: [
        inputValues.instructor_id,
        inputValues.day_of_week,
        inputValues.start_time,
        inputValues.end_time,
        inputValues.status,
      ],
    });
    return results.rows[0];
  }
}

async function updateAvailability(instructorId, availabilityId, inputValues) {
  const currentAvailability = await findOneByInstructorAndAvailabilityId(
    instructorId,
    availabilityId,
  );

  if ("status" in inputValues) {
    validateStatus(inputValues.status);
  }

  if ("day_of_week" in inputValues) {
    validateDayOfWeek(inputValues.day_of_week);
  }

  const availabilityWithNewValues = { ...currentAvailability, ...inputValues };

  const updatedAvailability = await runUpdateQuery(availabilityWithNewValues);
  return updatedAvailability;

  async function runUpdateQuery(availabilityWithNewValues) {
    const results = await database.query({
      text: `
        UPDATE
          instructor_availability
        SET
          day_of_week = $3,
          start_time = $4,
          end_time = $5,
          status = $6,
          updated_at = timezone('utc', now())
        WHERE
          instructor_id = $1 AND id = $2
        RETURNING
          *
      `,
      values: [
        availabilityWithNewValues.instructor_id,
        availabilityWithNewValues.id,
        availabilityWithNewValues.day_of_week,
        availabilityWithNewValues.start_time,
        availabilityWithNewValues.end_time,
        availabilityWithNewValues.status,
      ],
    });
    return results.rows[0];
  }
}

function validateDayOfWeek(role) {
  const daysOfWeek = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  if (role && typeof role === "string" && daysOfWeek.indexOf(role) === -1) {
    throw new ValidationError({
      message: "O dia da semana informado é inválido.",
      action: "Utilize um dos dias da semana válidos.",
    });
  }

  return true;
}

function validateStatus(status) {
  const statuses = ["open", "pending_confirmation", "busy", "closed"];
  if (status && typeof status === "string" && statuses.indexOf(status) === -1) {
    throw new ValidationError({
      message: "O status da disponibilidade de agenda informado é inválido.",
      action: "Utilize um dos status válidos.",
    });
  }

  return true;
}

const instructor = {
  findOneByInstructorAndAvailabilityId,
  createAvailability,
  updateAvailability,
};

export default instructor;
