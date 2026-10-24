exports.up = (pgm) => {
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    fullname: {
      type: "varchar(160)",
      notNull: true,
    },

    // For reference, GitHub limits usernames to 39 characters.
    username: {
      type: "varchar(30)",
      notNull: true,
      unique: true,
    },

    // Why 254 in length? https://stackoverflow.com/a/1199238
    email: {
      type: "varchar(254)",
      notNull: true,
      unique: true,
    },

    // Why 60 in length? https://www.npmjs.com/package/bcrypt#hash-info
    password: {
      type: "varchar(60)",
      notNull: true,
    },

    // ativo VARCHAR(30) DEFAULT "pending_confirmation",
    // Why 30 in length? "pending_confirmation", "active", "inactive", "suspended", "closed"
    status: {
      type: "varchar(30)",
      notNull: true,
      default: "pending_confirmation",
    },

    // tipo VARCHAR(20) NOT NULL,
    // Why 20 in length? "user", "admin", "instructor", "student"
    kind: {
      type: "varchar(20)",
      notNull: true,
      default: "user",
    },

    // Why 11 in length? CPF
    cpf: {
      type: "varchar(11)",
      notNull: true,
      unique: true,
    },

    // data_nascimento DATE NOT NULL,
    birth_date: {
      type: "timestamptz",
      notNull: true,
    },

    features: {
      type: "varchar[]",
      notNull: true,
      default: "{}",
    },

    // telefone VARCHAR(20)
    phone: {
      type: "varchar(20)",
      notNull: false,
    },

    // cnh VARCHAR(30)
    cnh: {
      type: "varchar(30)",
      notNull: false,
    },

    // cnh_categoria VARCHAR(30)
    cnh_category: {
      type: "varchar(2)",
      notNull: false,
      default: "B",
    },
    
    // credencial_instrutor VARCHAR(30)
    instructor_credential: {
      type: "varchar(30)",
      notNull: false,
    },

    // crv VARCHAR(30)
    crv: {
      type: "varchar(30)",
      notNull: false,
    },

    // Why timestamp with timezone? https://justatheory.com/2012/04/postgres-use-timestamptz/
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

exports.down = false;
