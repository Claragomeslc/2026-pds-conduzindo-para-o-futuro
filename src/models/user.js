import database from "infra/database.js";
import password from "models/password.js";
import { ValidationError, NotFoundError } from "infra/errors.js";

async function findOneById(id) {
  const userFound = await runSelectQuery(id);

  return userFound;

  async function runSelectQuery(id) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          id = $1
        LIMIT
          1
        ;`,
      values: [id],
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

async function findOneByUsername(username) {
  const userFound = await runSelectQuery(username);

  return userFound;

  async function runSelectQuery(username) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(username) = LOWER($1)
        LIMIT
          1
        ;`,
      values: [username],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

async function findOneByEmail(email) {
  const userFound = await runSelectQuery(email);

  return userFound;

  async function runSelectQuery(email) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          users
        WHERE
          LOWER(email) = LOWER($1)
        LIMIT
          1
        ;`,
      values: [email],
    });

    if (results.rowCount === 0) {
      throw new NotFoundError({
        message: "O email informado não foi encontrado no sistema.",
        action: "Verifique se o email está digitado corretamente.",
      });
    }

    return results.rows[0];
  }
}

async function create(userInputValues) {
  userInputValues.status = userInputValues.status || "pending_confirmation";
  validateUserStatus(userInputValues.status);
  userInputValues.role = userInputValues.role || "user";
  validateUserRole(userInputValues.role);
  userInputValues.cnh_category = userInputValues.cnh_category || "B";
  validateCnhCategory(userInputValues.cnh_category);
  await validateUniqueUsername(userInputValues.username);
  await validateUniqueEmail(userInputValues.email);
  await validateUniqueCpf(userInputValues.cpf);
  await hashPasswordInObject(userInputValues);
  injectDefaultFeaturesInObject(userInputValues);

  const newUser = await runInsertQuery(userInputValues);
  return newUser;

  async function runInsertQuery(userInputValues) {
    const results = await database.query({
      text: `
        INSERT INTO users (
            fullname, username, email, password, features, status, role, cpf, birth_date,  
            phone, instructor_credential, cnh, cnh_category, crv
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING
          *
        ;`,
      values: [
        userInputValues.fullname,
        userInputValues.username,
        userInputValues.email,
        userInputValues.password,
        userInputValues.features,
        userInputValues.status,
        userInputValues.role,
        userInputValues.cpf,
        userInputValues.birth_date,
        userInputValues.phone,
        userInputValues.instructor_credential,
        userInputValues.cnh,
        userInputValues.cnh_category,
        userInputValues.crv,
      ],
    });
    return results.rows[0];
  }

  function injectDefaultFeaturesInObject(userInputValues) {
    userInputValues.features = ["read:activation_token"];
  }
}

async function update(username, userInputValues) {
  const currentUser = await findOneByUsername(username);

  if ("cnh_category" in userInputValues) {
    validateCnhCategory(userInputValues.cnh_category);
  }

  if ("username" in userInputValues) {
    await validateUniqueUsername(userInputValues.username);
  }

  if ("email" in userInputValues) {
    await validateUniqueEmail(userInputValues.email);
  }

  if ("cpf" in userInputValues) {
    await validateUniqueCpf(userInputValues.cpf);
  }

  if ("password" in userInputValues) {
    await hashPasswordInObject(userInputValues);
  }

  const userWithNewValues = { ...currentUser, ...userInputValues };

  const updatedUser = await runUpdateQuery(userWithNewValues);
  return updatedUser;

  async function runUpdateQuery(userWithNewValues) {
    const results = await database.query({
      text: `
        UPDATE
          users
        SET
          fullname = $2,
          username = $3,
          email = $4,
          password = $5,
          cpf = $6,
          birth_date = $7,
          phone = $8,
          instructor_credential = $9,
          cnh = $10,
          cnh_category = $11,
          crv = $12,
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
      `,
      values: [
        userWithNewValues.id,
        userWithNewValues.fullname,
        userWithNewValues.username,
        userWithNewValues.email,
        userWithNewValues.password,
        userWithNewValues.cpf,
        userWithNewValues.birth_date,
        userWithNewValues.phone,
        userWithNewValues.instructor_credential,
        userWithNewValues.cnh,
        userWithNewValues.cnh_category,
        userWithNewValues.crv,
      ],
    });

    return results.rows[0];
  }
}

async function validateUniqueUsername(username) {
  const results = await database.query({
    text: `
      SELECT
        username
      FROM
        users
      WHERE
        LOWER(username) = LOWER($1)
      ;`,
    values: [username],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O username informado já está sendo utilizado.",
      action: "Utilize outro username para realizar esta operação.",
    });
  }
}

async function validateUniqueEmail(email) {
  const results = await database.query({
    text: `
      SELECT
        email
      FROM
        users
      WHERE
        LOWER(email) = LOWER($1)
      ;`,
    values: [email],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O email informado já está sendo utilizado.",
      action: "Utilize outro email para realizar esta operação.",
    });
  }
}

async function validateUniqueCpf(cpf) {
  const results = await database.query({
    text: `
      SELECT
        cpf
      FROM
        users
      WHERE
        LOWER(cpf) = LOWER($1)
      ;`,
    values: [cpf],
  });

  if (results.rowCount > 0) {
    throw new ValidationError({
      message: "O CPF informado já está sendo utilizado.",
      action: "Utilize outro CPF para realizar esta operação.",
    });
  }
}

function validateUserStatus(status) {
  const statuses = [
    "pending_confirmation",
    "active",
    "inactive",
    "suspended",
    "closed",
  ];
  if (status && typeof status === "string" && statuses.indexOf(status) === -1) {
    throw new ValidationError({
      message: "O status do usuário informado é inválido.",
      action: "Utilize um dos status do usuário válidos.",
    });
  }

  return true;
}

function validateUserRole(role) {
  const roles = ["user", "admin", "instructor", "student"];
  if (role && typeof role === "string" && roles.indexOf(role) === -1) {
    throw new ValidationError({
      message: "O papel de usuário informado é inválido.",
      action: "Utilize um dos papéis de usuário válidos.",
    });
  }

  return true;
}

function validateCnhCategory(cnh_category) {
  const validCategories = ["A", "B", "AB"];
  if (
    cnh_category &&
    typeof cnh_category === "string" &&
    validCategories.indexOf(cnh_category) === -1
  ) {
    throw new ValidationError({
      message: "A categoria da CNH informada é inválida.",
      action: "Utilize uma das categorias de CNH válidas (A, B, AB).",
    });
  }

  return true;
}

async function hashPasswordInObject(userInputValues) {
  const hashedPassword = await password.hash(userInputValues.password);
  userInputValues.password = hashedPassword;
}

async function setFeatures(userId, features) {
  const updatedUser = await runUpdateQuery(userId, features);
  return updatedUser;

  async function runUpdateQuery(userId, features) {
    const results = await database.query({
      text: `
       UPDATE
         users
       SET
         features = $2,
         updated_at = timezone('utc', now())
       WHERE
         id = $1
       RETURNING
         *
       ;`,
      values: [userId, features],
    });

    return results.rows[0];
  }
}

async function addFeatures(userId, features) {
  const updatedUser = await runUpdateQuery(userId, features);
  return updatedUser;

  async function runUpdateQuery(userId, features) {
    const results = await database.query({
      text: `
       UPDATE
         users
       SET
         features = array_cat(features, $2),
         updated_at = timezone('utc', now())
       WHERE
         id = $1
       RETURNING
         *
       ;`,
      values: [userId, features],
    });

    return results.rows[0];
  }
}

async function setStatus(userId, status) {
  validateUserStatus(status);

  const updatedUser = await runUpdateQuery(userId, status);
  return updatedUser;

  async function runUpdateQuery(userId, status) {
    const results = await database.query({
      text: `
       UPDATE
         users
       SET
         status = $2,
         updated_at = timezone('utc', now())
       WHERE
         id = $1
       RETURNING
         *
       ;`,
      values: [userId, status],
    });

    return results.rows[0];
  }
}

async function queryAll(userInputParams) {
  let sqlQuery = `
    FROM
      users
    WHERE
      status = 'active'
  `;
  let sqlSort = "";
  let sqlPagination = "";
  let values = [];
  let countValues = [];
  const filters = userInputParams.filters || {};
  if (filters.role) {
    values.push(filters.role);
    countValues.push(filters.role);
    sqlQuery += ` AND role = $${values.length} `;
  }
  if (filters.cnh_category) {
    values.push(filters.cnh_category);
    countValues.push(filters.cnh_category);
    sqlQuery += ` AND cnh_category LIKE '%'||$${values.length}||'%' `;
  }
  if (filters.fullname) {
    values.push(filters.fullname);
    countValues.push(filters.fullname);
    sqlQuery += ` AND unaccent(fullname) ILIKE unaccent('%'||$${values.length}||'%')`;
  }

  const sort = userInputParams.sort || [];
  if (sort.length > 0) {
    const sortFields = sort.map((fieldObj) => {
      const [field, direction] = Object.entries(fieldObj)[0];
      return `${field} ${direction.toUpperCase()}`;
    });
    sqlSort += ` ORDER BY ${sortFields.join(", ")} `;
  }

  const pagination = userInputParams.pagination || {};
  if (pagination.page && pagination.limit) {
    const offset = (pagination.page - 1) * pagination.limit;
    values.push(pagination.limit, offset);
    sqlPagination += ` LIMIT $${values.length - 1} OFFSET $${values.length} `;
  }

  await database.query({ text: `CREATE EXTENSION IF NOT EXISTS unaccent;` });

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
    users: results.rows,
  };
}

const user = {
  create,
  findOneById,
  findOneByUsername,
  findOneByEmail,
  update,
  setFeatures,
  addFeatures,
  setStatus,
  queryAll,
};

export default user;
