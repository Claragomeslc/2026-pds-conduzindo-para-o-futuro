exports.up = (pgm) => {
  pgm.createTable("instructor_availabilities", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // user_id uuid NOT NULL (FK: users)
    instructor_id: {
      type: "uuid",
      notNull: true,
    },

    // dia_semana VARCHAR(10) NOT NULL
    // Why 10 in length? "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
    day_of_week: {
      type: "varchar(10)",
      notNull: true,
    },

    // horario_inicio TIME NOT NULL,
    start_time: {
      type: "time",
      notNull: true,
    },

    // horario_fim TIME NOT NULL,
    end_time: {
      type: "time",
      notNull: true,
    },

    // ativo VARCHAR(20) DEFAULT "open",
    // Why 20 in length? "open", "close"
    status: {
      type: "varchar(20)",
      notNull: true,
      default: "open",
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
