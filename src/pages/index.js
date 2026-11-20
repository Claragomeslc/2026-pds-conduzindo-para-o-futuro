import { Button, Stack } from "@primer/react";
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

      <Stack direction="horizontal" gap="normal">
        <Button as="a" href="/instrutores" variant="primary">
          Encontrar instrutores
        </Button>
        <Button as="a" href="/habilitacao">
          Como tirar a habilitação
        </Button>
      </Stack>
    </DefaultLayout>
  );
}

export default Home;
