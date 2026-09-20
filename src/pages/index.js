import DefaultLayout from "interface/DefaultLayout";

function Home() {
  return (
    <DefaultLayout
      metadata={{
        description:
          "Conduzindo Para O Futuro | Buscando conectar instrutores a alunos que tem interesse em ter aulas de direção.",
      }}
    >
      <h1>🚙 Conduzindo Para O Futuro 🛵</h1>
      <h3>
        🚌 Buscando conectar instrutores a alunos que tem interesse em ter aulas
        de direção! 🚚
      </h3>
    </DefaultLayout>
  );
}

export default Home;
