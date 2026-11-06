import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function findOneById(appointmentId, userId) {
  const appointmentFound = await runSelectQuery(appointmentId, userId);

  return appointmentFound;

  async function runSelectQuery(appointmentId, userId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          appointments
        WHERE
          id = $1 AND (student_id = $2 OR instructor_id = $2)
        LIMIT
          1
        ;`,
      values: [appointmentId, userId],
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

async function create(studentId, inputValues) {
  inputValues.status = inputValues.status || "reserved";
  validateStatus(inputValues.status);
  inputValues.class_category = inputValues.class_category || "B";
  validateClassCategory(inputValues.class_category);

  inputValues.day_of_week = getDayOfWeek(inputValues.starts_at);

  const newAppointment = await runInsertQuery(inputValues);

  return newAppointment;

  async function runInsertQuery(inputValues) {
    const results = await database.query({
      text: `
        INSERT INTO appointments (
            student_id, instructor_id, day_of_week, class_category, duration_time,
            starts_at, ends_at, status, price, observations
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING
          *
        ;`,
      values: [
        studentId,
        inputValues.instructor_id,
        inputValues.day_of_week,
        inputValues.class_category,
        inputValues.duration_time,
        inputValues.starts_at,
        inputValues.ends_at,
        inputValues.status,
        inputValues.price,
        inputValues.observations,
      ],
    });
    return results.rows[0];
  }
}

function getDayOfWeek(startsAtInput) {
  const startsAt = new Date(startsAtInput);
  if (isNaN(startsAt.getTime())) {
    throw new ValidationError({
      message: "A data de início da aula informada é inválida.",
      action: "Verifique se a data de início da aula está no formato correto.",
    });
  }
  // Definindo hora para meia-noite para evitar problemas de fuso horário
  startsAt.setHours(0, 0, 0, 0);
  const daysOfWeek = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return daysOfWeek[startsAt.getDay()];
}

function validateStatus(status) {
  const statuses = [
    "reserved",
    "pending_payment",
    "booked",
    "completed",
    "canceled",
    "free",
  ];
  if (status && typeof status === "string" && statuses.indexOf(status) === -1) {
    throw new ValidationError({
      message: "O status do agendamento informado é inválido.",
      action: "Utilize um dos status válidos.",
    });
  }

  return true;
}

function validateClassCategory(class_category) {
  const validCategories = ["A", "B"];
  if (
    class_category &&
    typeof class_category === "string" &&
    validCategories.indexOf(class_category) === -1
  ) {
    throw new ValidationError({
      message: "A categoria da aula informada é inválida.",
      action: "Utilize uma das categorias de aula válidas (A, B).",
    });
  }

  return true;
}

const appointment = {
  findOneById,
  create,
};

export default appointment;
