exports.up = (pgm) => {
  pgm.createTable("reviews", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()"),
    },

    // reviewer_user_id uuid NOT NULL (FK: users)
    reviewer_user_id: {
      type: "uuid",
      notNull: true,
    },

    // reviewed_user_id uuid NOT NULL (FK: users)
    reviewed_user_id: {
      type: "uuid",
      notNull: true,
    },

    // appointment_id uuid NOT NULL (FK:  appointments)
    appointment_id: {
      type: "uuid",
      notNull: false,
    },

    // context VARCHAR(11) NOT NULL DEFAULT "general",
    // Why 11 in length? "appointment", "general"
    context: {
      type: "varchar(11)",
      notNull: true,
      default: "general",
    },

    rating: {
      type: "smallint",
      notNull: true,
    },

    comment: {
      type: "text",
      notNull: false,
    },

    // Why timestamp with timezone? https://justatheory.com/2012/04/postgres-use-timestamptz/
    created_at: {
      type: "timestamptz",
      notNull: false,
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
