exports.up = (pgm) => {
  pgm.createExtension("btree_gist", { ifNotExists: true });

  pgm.sql(`
    ALTER TABLE appointments
    ADD CONSTRAINT appointments_instructor_no_overlap
    EXCLUDE USING gist (
      instructor_id WITH =,
      tstzrange(starts_at, ends_at, '[)') WITH &&
    )
    WHERE (status NOT IN ('canceled', 'free'));
  `);
};

exports.down = false;
