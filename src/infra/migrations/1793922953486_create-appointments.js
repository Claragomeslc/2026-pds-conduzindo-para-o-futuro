exports.up = (pgm) => {
  pgm.createTable("appointments", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // user_id uuid NOT NULL (FK: users)
    student_id: {
      type: "uuid",
      notNull: true,
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

    // aula_categoria VARCHAR(1) NOT NULL
    class_category: {
      type: "varchar(1)",
      notNull: true,
      default: "B",
    },

    // tempo_duracao TIME NOT NULL,
    duration_time: {
      type: "time",
      notNull: true,
    },

    // inicio TIMESTAMPTZ NOT NULL,
    starts_at: {
      type: "timestamptz",
      notNull: true,
    },

    // fim TIMESTAMPTZ NOT NULL,
    ends_at: {
      type: "timestamptz",
      notNull: true,
    },

    price: {
      type: "numeric(10, 2)",
      notNull: true,
    },

    observations: {
      type: "text",
      notNull: false,
    },

    // status VARCHAR(30) DEFAULT "reserved",
    // Why 30 in length? "reserved", "pending_payment", "booked", "completed", "canceled", "free"
    status: {
      type: "varchar(30)",
      notNull: true,
      default: "reserved",
    },

    // Why timestamp with timezone? https://justatheory.com/2012/04/postgres-use-timestamptz/
    reserved_at: {
      type: "timestamptz",
      notNull: false,
      default: pgm.func("timezone('utc', now())"),
    },

    confirmed_at: {
      type: "timestamptz",
      notNull: false,
    },

    paid_at: {
      type: "timestamptz",
      notNull: false,
    },

    completed_at: {
      type: "timestamptz",
      notNull: false,
    },

    canceled_at: {
      type: "timestamptz",
      notNull: false,
    },

    // user_id uuid NOT NULL (FK: users)
    canceled_by: {
      type: "uuid",
      notNull: false,
    },

    canceled_reason: {
      type: "text",
      notNull: false,
    },

    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("timezone('utc', now())"),
    },
  });
};

exports.down = false;
