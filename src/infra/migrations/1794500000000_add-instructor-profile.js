// Campos do perfil do instrutor (RF13, RF19, RF21)
exports.up = (pgm) => {
  pgm.addColumns("users", {
    // preco_aula NUMERIC(10, 2)
    price: {
      type: "numeric(10, 2)",
      notNull: false,
    },
    // regiao VARCHAR(100)
    region: {
      type: "varchar(100)",
      notNull: false,
    },
    // descricao TEXT
    description: {
      type: "text",
      notNull: false,
    },
  });
};

exports.down = false;
