import { useEffect, useState } from "react";
import {
  Banner,
  Button,
  FormControl,
  Heading,
  Link,
  Select,
  Stack,
  Text,
  TextInput,
} from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";
import NeedLogin from "interface/NeedLogin";
import { callApi, errorText, formatPrice, useUser } from "interface/api";

// RF13 e RF19: lista de instrutores com filtros
export default function InstructorsPage() {
  const { user, isLoading } = useUser();
  const [instructors, setInstructors] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [filters, setFilters] = useState({});

  // Busca os instrutores quando a página abre e sempre que os filtros mudam
  useEffect(() => {
    if (!user) return;

    async function search() {
      const { ok, data } = await callApi("/api/v1/users/query", "POST", {
        filters: { ...filters, role: "instructor" },
        sort: [{ fullname: "asc" }],
      });

      if (!ok) {
        setErrorMessage(errorText(data));
        return;
      }
      setErrorMessage("");
      setInstructors(data.users);
    }

    search();
  }, [user, filters]);

  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    // Só manda para a API os filtros que foram preenchidos
    const newFilters = {};
    for (const [name, value] of formData.entries()) {
      if (value) newFilters[name] = value;
    }
    setFilters(newFilters);
  }

  return (
    <DefaultLayout metadata={{ title: "Instrutores" }}>
      <Stack gap="normal">
        <Heading as="h1">Encontre um instrutor</Heading>

        {isLoading && <Text>Carregando...</Text>}
        {!isLoading && !user && <NeedLogin />}

        {user && (
          <>
            <form onSubmit={handleSubmit}>
              <Stack direction="horizontal" gap="normal" wrap="wrap">
                <FormControl>
                  <FormControl.Label>Nome</FormControl.Label>
                  <TextInput name="fullname" />
                </FormControl>
                <FormControl>
                  <FormControl.Label>Região</FormControl.Label>
                  <TextInput name="region" placeholder="Ex.: Centro" />
                </FormControl>
                <FormControl>
                  <FormControl.Label>Categoria</FormControl.Label>
                  <Select name="cnh_category">
                    <Select.Option value="">Todas</Select.Option>
                    <Select.Option value="A">A (moto)</Select.Option>
                    <Select.Option value="B">B (carro)</Select.Option>
                  </Select>
                </FormControl>
                <FormControl>
                  <FormControl.Label>Preço máximo (R$)</FormControl.Label>
                  <TextInput name="max_price" type="number" min="0" />
                </FormControl>
              </Stack>
              <br />
              <Button type="submit" variant="primary">
                Buscar
              </Button>
            </form>

            {errorMessage && (
              <Banner
                variant="critical"
                title="Erro"
                description={errorMessage}
              />
            )}

            <Text>{instructors.length} instrutor(es) encontrado(s).</Text>

            {instructors.map((instructor) => (
              <InstructorCard key={instructor.id} instructor={instructor} />
            ))}
          </>
        )}
      </Stack>
    </DefaultLayout>
  );
}

function InstructorCard({ instructor }) {
  return (
    <div
      style={{
        border: "1px solid #d0d7de",
        borderRadius: 6,
        padding: 16,
      }}
    >
      <Heading as="h2" variant="small">
        <Link href={`/instrutores/${instructor.username}`}>
          {instructor.fullname}
        </Link>
      </Heading>
      <Text as="p">
        Categoria: {instructor.cnh_category} | Região:{" "}
        {instructor.region || "Não informada"} | Preço da aula:{" "}
        {formatPrice(instructor.price)}
      </Text>
    </div>
  );
}
