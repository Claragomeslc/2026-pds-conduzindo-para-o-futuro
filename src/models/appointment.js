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

async function update(appointmentId, userId, inputValues) {
  const currentAppointment = await findOneById(appointmentId, userId);

  if ("starts_at" in inputValues) {
    inputValues.day_of_week = getDayOfWeek(inputValues.starts_at);
  }
  if ("status" in inputValues) {
    validateStatus(inputValues.status);
    if (inputValues.status === "pending_payment") {
      inputValues.confirmed_at = new Date().toISOString();
    } else if (inputValues.status === "booked") {
      inputValues.paid_at = new Date().toISOString();
    } else if (inputValues.status === "completed") {
      inputValues.completed_at = new Date().toISOString();
    } else if (inputValues.status === "canceled") {
      if (!inputValues.canceled_reason) {
        throw new ValidationError({
          message: "O motivo para cancelamento do agendamento é obrigatório.",
          action: "Verifique se o motivo para cancelamento está preenchido.",
        });
      }
      inputValues.canceled_at = new Date().toISOString();
      inputValues.canceled_by = userId;
    }
  }

  const appointmentWithNewValues = { ...currentAppointment, ...inputValues };

  const updatedAppointment = await runUpdateQuery(appointmentWithNewValues);
  return updatedAppointment;

  async function runUpdateQuery(appointmentWithNewValues) {
    const results = await database.query({
      text: `
        UPDATE
          appointments
        SET
          class_category = $3,
          day_of_week = $4,
          duration_time = $5,
          starts_at = $6,
          ends_at = $7,
          price = $8,
          observations = $9,
          status = $10,
          confirmed_at = $11,
          paid_at = $12,
          completed_at = $13,
          canceled_at = $14,
          canceled_by = $15,
          canceled_reason = $16,
          updated_at = timezone('utc', now())
        WHERE
          id = $1 AND (student_id = $2 OR instructor_id = $2)
        RETURNING
          *
      `,
      values: [
        appointmentId,
        userId,
        appointmentWithNewValues.class_category,
        appointmentWithNewValues.day_of_week,
        appointmentWithNewValues.duration_time,
        appointmentWithNewValues.starts_at,
        appointmentWithNewValues.ends_at,
        appointmentWithNewValues.price,
        appointmentWithNewValues.observations,
        appointmentWithNewValues.status,
        appointmentWithNewValues.confirmed_at,
        appointmentWithNewValues.paid_at,
        appointmentWithNewValues.completed_at,
        appointmentWithNewValues.canceled_at,
        appointmentWithNewValues.canceled_by,
        appointmentWithNewValues.canceled_reason,
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

async function queryAll(userId, inputParams) {
  let sqlQuery = `
    FROM
      appointments
    WHERE
      (student_id = $1 OR instructor_id = $1)
  `;
  let sqlSort = "";
  let sqlPagination = "";
  let values = [userId];
  let countValues = [userId];
  const filters = inputParams.filters || {};
  if (filters.student_id) {
    values.push(filters.student_id);
    countValues.push(filters.student_id);
    sqlQuery += ` AND student_id = $${values.length} `;
  }
  if (filters.status) {
    values.push(filters.status);
    countValues.push(filters.status);
    sqlQuery += ` AND status = $${values.length} `;
  }
  if (filters.day_of_week) {
    values.push(filters.day_of_week);
    countValues.push(filters.day_of_week);
    sqlQuery += ` AND day_of_week = $${values.length} `;
  }
  if (filters.starts_at) {
    if (filters.starts_at.from) {
      const startsAtFrom = new Date(filters.starts_at.from);
      // Definindo hora para meia-noite para evitar problemas de fuso horário
      startsAtFrom.setHours(0, 0, 0, 0);
      values.push(startsAtFrom);
      countValues.push(startsAtFrom);
      sqlQuery += ` AND starts_at >= $${values.length} `;
    }
    if (filters.starts_at.to) {
      const startsAtTo = new Date(filters.starts_at.to);
      startsAtTo.setHours(23, 50, 50, 999);
      values.push(startsAtTo);
      countValues.push(startsAtTo);
      sqlQuery += ` AND starts_at <= $${values.length} `;
    }
  }
  if (filters.ends_at) {
    if (filters.ends_at.from) {
      const endsAtFrom = new Date(filters.ends_at.from);
      // Definindo hora para meia-noite para evitar problemas de fuso horário
      endsAtFrom.setHours(0, 0, 0, 0);
      values.push(endsAtFrom);
      countValues.push(endsAtFrom);
      sqlQuery += ` AND ends_at >= $${values.length} `;
    }
    if (filters.ends_at.to) {
      const endsAtTo = new Date(filters.ends_at.to);
      endsAtTo.setHours(23, 50, 50, 999);
      values.push(endsAtTo);
      countValues.push(endsAtTo);
      sqlQuery += ` AND ends_at <= $${values.length} `;
    }
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
    appointments: results.rows,
  };
}

const appointment = {
  findOneById,
  create,
  update,
  queryAll,
};

export default appointment;
