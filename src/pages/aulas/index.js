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
import {
  appointmentStatus,
  callApi,
  errorText,
  formatDateTime,
  formatPrice,
  useUser,
} from "interface/api";

// RF22: lista de aulas do aluno ou do instrutor
// RF09/RF10: cancelar | RF17: avaliar depois da aula
export default function ClassesPage() {
  const { user, isLoading } = useUser();
  const [appointments, setAppointments] = useState([]);
  const [names, setNames] = useState({});
  const [reviewedIds, setReviewedIds] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  // Quando este número muda, as aulas são carregadas de novo
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      // Aulas do usuário logado (a mais próxima primeiro)
      const result = await callApi("/api/v1/appointments/query", "POST", {
        sort: { starts_at: "asc" },
      });
      setAppointments(result.data.appointments || []);

      // Nomes de todos os usuários, para mostrar "Aula com Fulano"
      const users = await callApi("/api/v1/users/query", "POST", {});
      const namesById = {};
      users.data.users.forEach((person) => {
        namesById[person.id] = person.fullname;
      });
      setNames(namesById);

      // Aulas que eu já avaliei (para esconder o botão de avaliar)
      const reviews = await callApi("/api/v1/reviews/query", "POST", {
        filters: { reviewer_user_id: user.id },
      });
      setReviewedIds(
        (reviews.data.reviews || []).map((review) => review.appointment_id),
      );
    }

    loadData();
  }, [user, reloadCount]);

  function reload() {
    setReloadCount(reloadCount + 1);
  }

  async function changeStatus(appointment, status) {
    setErrorMessage("");
    const body = { status };

    if (status === "canceled") {
      const reason = window.prompt("Qual o motivo do cancelamento?");
      if (!reason) return;
      body.canceled_reason = reason;
    }

    const { ok, data } = await callApi(
      `/api/v1/appointments/${appointment.id}`,
      "PATCH",
      body,
    );
    if (!ok) {
      setErrorMessage(errorText(data));
      return;
    }
    reload();
  }

  return (
    <DefaultLayout metadata={{ title: "Minhas aulas" }}>
      <Stack gap="normal">
        <Heading as="h1">Minhas aulas</Heading>

        {isLoading && <Text>Carregando...</Text>}
        {!isLoading && !user && <NeedLogin />}

        {errorMessage && (
          <Banner variant="critical" title="Erro" description={errorMessage} />
        )}

        {user && appointments.length === 0 && (
          <Text>Você ainda não tem aulas agendadas.</Text>
        )}

        {user &&
          appointments.map((appointment) => {
            const isInstructor = user.role === "instructor";
            const otherPersonId = isInstructor
              ? appointment.student_id
              : appointment.instructor_id;
            const status = appointment.status;

            return (
              <div
                key={appointment.id}
                style={{
                  border: "1px solid #d0d7de",
                  borderRadius: 6,
                  padding: 16,
                }}
              >
                <Stack gap="condensed">
                  <Text as="p">
                    <strong>Aula com {names[otherPersonId] || "..."}</strong>
                    <br />
                    Data: {formatDateTime(appointment.starts_at)} até{" "}
                    {formatDateTime(appointment.ends_at)}
                    <br />
                    Preço: {formatPrice(appointment.price)} (pago direto ao
                    instrutor)
                    <br />
                    Situação: {appointmentStatus[status]}
                    {appointment.canceled_reason &&
                      ` (motivo: ${appointment.canceled_reason})`}
                  </Text>

                  <Stack direction="horizontal" gap="condensed">
                    {isInstructor && status === "reserved" && (
                      <Button
                        variant="primary"
                        onClick={() => changeStatus(appointment, "booked")}
                      >
                        Confirmar aula
                      </Button>
                    )}
                    {isInstructor && status === "booked" && (
                      <Button
                        onClick={() => changeStatus(appointment, "completed")}
                      >
                        Marcar como concluída
                      </Button>
                    )}
                    {(status === "reserved" || status === "booked") && (
                      <Button
                        variant="danger"
                        onClick={() => changeStatus(appointment, "canceled")}
                      >
                        Cancelar
                      </Button>
                    )}
                  </Stack>

                  {status === "completed" &&
                    !reviewedIds.includes(appointment.id) && (
                      <ReviewForm
                        appointment={appointment}
                        reviewedUserId={otherPersonId}
                        onDone={reload}
                      />
                    )}
                </Stack>
              </div>
            );
          })}

        <Text size="small">
          Cancelamentos só podem ser feitos com pelo menos 48 horas de
          antecedência.
        </Text>
      </Stack>
    </DefaultLayout>
  );
}

// RF17: avaliação de 1 a 5 estrelas com comentário
function ReviewForm({ appointment, reviewedUserId, onDone }) {
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const { ok, data } = await callApi("/api/v1/reviews", "POST", {
      appointment_id: appointment.id,
      reviewed_user_id: reviewedUserId,
      rating: Number(formData.get("rating")),
      comment: formData.get("comment"),
    });

    if (!ok) {
      setErrorMessage(errorText(data));
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack direction="horizontal" gap="condensed" align="end" wrap="wrap">
        <FormControl>
          <FormControl.Label>Nota</FormControl.Label>
          <Select name="rating" defaultValue="5">
            <Select.Option value="5">⭐⭐⭐⭐⭐</Select.Option>
            <Select.Option value="4">⭐⭐⭐⭐</Select.Option>
            <Select.Option value="3">⭐⭐⭐</Select.Option>
            <Select.Option value="2">⭐⭐</Select.Option>
            <Select.Option value="1">⭐</Select.Option>
          </Select>
        </FormControl>
        <FormControl>
          <FormControl.Label>Comentário</FormControl.Label>
          <TextInput name="comment" />
        </FormControl>
        <Button type="submit">Avaliar</Button>
      </Stack>
      {errorMessage && <p style={{ color: "#cf222e" }}>{errorMessage}</p>}
    </form>
  );
}
