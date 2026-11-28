import database from "infra/database.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function findOneByInstructorAndAvailabilityId(
  instructorId,
  availabilityId,
) {
  const availabilityFound = await runSelectQuery(instructorId, availabilityId);

  return availabilityFound;

  async function runSelectQuery(instructorId, availabilityId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          instructor_availabilities
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
        INSERT INTO instructor_availabilities (
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
          instructor_availabilities
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

async function queryAll(instructorId, inputParams) {
  let sqlQuery = `
    SELECT 
      * 
    FROM
      instructor_availabilities
    WHERE
      instructor_id = $1
  `;
  let values = [instructorId];
  const filters = inputParams.filters || {};
  if (filters.status) {
    values.push(filters.status);
    sqlQuery += ` AND status = $${values.length} `;
  }
  if (filters.day_of_week) {
    values.push(filters.day_of_week);
    sqlQuery += ` AND day_of_week = $${values.length} `;
  }

  const results = await database.query({
    text: sqlQuery,
    values: values,
  });

  return {
    total: results.rows.length,
    availabilities: results.rows,
  };
}

// Devolve os horários que o instrutor ofereceu (status "open") e que
// ainda estão livres, dentro do período informado (from e to: "AAAA-MM-DD").
async function queryFreeSlots(instructorId, from, to) {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (
    !datePattern.test(from) ||
    !datePattern.test(to) ||
    isNaN(fromDate.getTime()) ||
    isNaN(toDate.getTime()) ||
    fromDate > toDate
  ) {
    throw new ValidationError({
      message: "O período informado é inválido.",
      action: "Informe as datas no formato AAAA-MM-DD, com início antes do fim.",
    });
  }

  const days = (toDate - fromDate) / (1000 * 60 * 60 * 24);
  if (days > 31) {
    throw new ValidationError({
      message: "O período informado é longo demais.",
      action: "Consulte no máximo 31 dias por vez.",
    });
  }

  const results = await database.query({
    text: `
      WITH days AS (
        SELECT generate_series($2::timestamp, $3::timestamp, interval '1 day')::date AS day
      ),
      slots AS (
        SELECT
          a.id AS availability_id,
          (d.day + a.start_time) AT TIME ZONE 'America/Sao_Paulo' AS starts_at,
          (d.day + a.end_time) AT TIME ZONE 'America/Sao_Paulo' AS ends_at
        FROM days d
        JOIN instructor_availabilities a
          ON a.instructor_id = $1
          AND a.status = 'open'
          AND a.day_of_week = (
            ARRAY['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
          )[EXTRACT(DOW FROM d.day)::int + 1]
      )
      SELECT s.availability_id, s.starts_at, s.ends_at
      FROM slots s
      WHERE s.starts_at > now()
        AND NOT EXISTS (
          SELECT 1
          FROM appointments p
          WHERE p.instructor_id = $1
            AND p.status NOT IN ('canceled', 'free')
            AND p.starts_at < s.ends_at
            AND p.ends_at > s.starts_at
        )
      ORDER BY s.starts_at
      ;`,
    values: [instructorId, from, to],
  });

  return {
    total: results.rowCount,
    slots: results.rows,
  };
}

const instructor = {
  findOneByInstructorAndAvailabilityId,
  createAvailability,
  updateAvailability,
  queryAll,
  queryFreeSlots,
};

export default instructor;
