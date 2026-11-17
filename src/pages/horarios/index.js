import { useEffect, useState } from "react";
import {
  Banner,
  Button,
  FormControl,
  Heading,
  Select,
  Stack,
  Text,
  TextInput,
} from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";
import NeedLogin from "interface/NeedLogin";
import { callApi, daysOfWeek, errorText, useUser } from "interface/api";

// RF04: o instrutor cadastra os horários em que pode dar aula
export default function SchedulePage() {
  const { user, isLoading } = useUser();
  const [availabilities, setAvailabilities] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  // Quando este número muda, a lista de horários é carregada de novo
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== "instructor") return;

    async function loadAvailabilities() {
      const { data } = await callApi(
        `/api/v1/instructors/${user.username}/availabilities/query`,
        "POST",
        {},
      );
      setAvailabilities(data.availabilities || []);
    }

    loadAvailabilities();
  }, [user, reloadCount]);

  function reload() {
    setReloadCount(reloadCount + 1);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    const formData = new FormData(event.target);

    const { ok, data } = await callApi(
      `/api/v1/instructors/${user.username}/availabilities`,
      "POST",
      {
        instructor_id: user.id,
        day_of_week: formData.get("day_of_week"),
        start_time: formData.get("start_time"),
        end_time: formData.get("end_time"),
      },
    );

    if (!ok) {
      setErrorMessage(errorText(data));
      return;
    }

    event.target.reset();
    reload();
  }

  // Abre ou fecha um horário (o aluno só vê os horários abertos)
  async function changeStatus(availability) {
    const newStatus = availability.status === "open" ? "closed" : "open";
    await callApi(
      `/api/v1/instructors/${user.username}/availabilities/${availability.id}`,
      "PATCH",
      { status: newStatus },
    );
    reload();
  }

  return (
    <DefaultLayout contentWidth="small" metadata={{ title: "Meus horários" }}>
      <Stack gap="normal">
        <Heading as="h1">Meus horários</Heading>

        {isLoading && <Text>Carregando...</Text>}
        {!isLoading && !user && <NeedLogin />}
        {user && user.role !== "instructor" && (
          <Text>Esta página é só para instrutores.</Text>
        )}

        {user && user.role === "instructor" && (
          <>
            <form onSubmit={handleSubmit}>
              <Stack gap="normal">
                {errorMessage && (
                  <Banner
                    variant="critical"
                    title="Erro"
                    description={errorMessage}
                  />
                )}

                <FormControl required>
                  <FormControl.Label>Dia da semana</FormControl.Label>
                  <Select name="day_of_week" block>
                    {Object.keys(daysOfWeek).map((day) => (
                      <Select.Option key={day} value={day}>
                        {daysOfWeek[day]}
                      </Select.Option>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction="horizontal" gap="normal">
                  <FormControl required>
                    <FormControl.Label>Início</FormControl.Label>
                    <TextInput name="start_time" type="time" />
                  </FormControl>
                  <FormControl required>
                    <FormControl.Label>Fim</FormControl.Label>
                    <TextInput name="end_time" type="time" />
                  </FormControl>
                </Stack>

                <div>
                  <Button type="submit" variant="primary">
                    Adicionar horário
                  </Button>
                </div>
              </Stack>
            </form>

            <Heading as="h2" variant="medium">
              Horários cadastrados
            </Heading>

            {availabilities.length === 0 && (
              <Text>Nenhum horário cadastrado ainda.</Text>
            )}

            {availabilities.map((availability) => (
              <Stack
                key={availability.id}
                direction="horizontal"
                align="center"
                justify="space-between"
              >
                <Text>
                  {daysOfWeek[availability.day_of_week]}{" "}
                  {availability.start_time.slice(0, 5)} às{" "}
                  {availability.end_time.slice(0, 5)} (
                  {availability.status === "open" ? "aberto" : "fechado"})
                </Text>
                <Button size="small" onClick={() => changeStatus(availability)}>
                  {availability.status === "open" ? "Fechar" : "Abrir"}
                </Button>
              </Stack>
            ))}
          </>
        )}
      </Stack>
    </DefaultLayout>
  );
}
