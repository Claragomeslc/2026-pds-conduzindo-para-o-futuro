import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Banner,
  Button,
  FormControl,
  Heading,
  Select,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";
import NeedLogin from "interface/NeedLogin";
import {
  callApi,
  daysOfWeek,
  errorText,
  formatPrice,
  useUser,
} from "interface/api";

// RF14 e RF15: página do instrutor | RF12: WhatsApp | RF05 e RF06: agendar aula
export default function InstructorPage() {
  const router = useRouter();
  const { username } = router.query;
  const { user, isLoading } = useUser();

  const [instructor, setInstructor] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    if (!user || !username) return;

    async function loadData() {
      // Dados do instrutor
      const users = await callApi("/api/v1/users/query", "POST", {
        filters: { username, role: "instructor" },
      });
      const instructorFound = users.data.users[0];
      setInstructor(instructorFound || false);
      if (!instructorFound) return;

      // Horários livres do instrutor
      const result = await callApi(
        `/api/v1/instructors/${username}/availabilities/query`,
        "POST",
        { filters: { status: "open" } },
      );
      setAvailabilities(result.data.availabilities || []);

      // Avaliações recebidas pelo instrutor
      const reviewResult = await callApi("/api/v1/reviews/query", "POST", {
        filters: { reviewed_user_id: instructorFound.id },
      });
      setReviews(reviewResult.data.reviews || []);
    }

    loadData();
  }, [user, username]);

  if (isLoading) {
    return <DefaultLayout>Carregando...</DefaultLayout>;
  }

  if (!user) {
    return (
      <DefaultLayout>
        <NeedLogin />
      </DefaultLayout>
    );
  }

  if (instructor === false) {
    return (
      <DefaultLayout>
        <Banner variant="critical" title="Instrutor não encontrado" />
      </DefaultLayout>
    );
  }

  if (!instructor) {
    return <DefaultLayout>Carregando...</DefaultLayout>;
  }

  // Média das notas (1 a 5)
  let average = 0;
  if (reviews.length > 0) {
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    average = (sum / reviews.length).toFixed(1);
  }

  // Link do WhatsApp: só os números do telefone
  const phoneNumbers = (instructor.phone || "").replace(/\D/g, "");

  return (
    <DefaultLayout metadata={{ title: instructor.fullname }}>
      <Stack gap="normal">
        <Heading as="h1">{instructor.fullname}</Heading>

        <Text as="p">
          <strong>Categoria:</strong> {instructor.cnh_category}
          <br />
          <strong>Região:</strong> {instructor.region || "Não informada"}
          <br />
          <strong>Preço da aula:</strong> {formatPrice(instructor.price)}
          <br />
          <strong>Avaliação:</strong>{" "}
          {reviews.length > 0
            ? `${average} de 5 (${reviews.length} avaliações)`
            : "Ainda sem avaliações"}
        </Text>

        <Text as="p">{instructor.description || "Sem descrição."}</Text>

        {phoneNumbers && (
          <div>
            <Button
              as="a"
              href={`https://wa.me/55${phoneNumbers}`}
              target="_blank"
            >
              Conversar no WhatsApp
            </Button>
          </div>
        )}

        <Heading as="h2" variant="medium">
          Horários disponíveis
        </Heading>

        {availabilities.length === 0 && (
          <Text>Este instrutor ainda não cadastrou horários.</Text>
        )}

        <ul>
          {availabilities.map((availability) => (
            <li key={availability.id}>
              {daysOfWeek[availability.day_of_week]}:{" "}
              {availability.start_time.slice(0, 5)} às{" "}
              {availability.end_time.slice(0, 5)}
            </li>
          ))}
        </ul>

        {user.role === "student" && availabilities.length > 0 && (
          <BookingForm
            instructor={instructor}
            availabilities={availabilities}
          />
        )}

        <Heading as="h2" variant="medium">
          Comentários dos alunos
        </Heading>
        {reviews.length === 0 && <Text>Nenhum comentário ainda.</Text>}
        {reviews.map((review) => (
          <Text as="p" key={review.id}>
            {"⭐".repeat(review.rating)} {review.comment}
          </Text>
        ))}
      </Stack>
    </DefaultLayout>
  );
}

// Formulário para o aluno agendar uma aula
function BookingForm({ instructor, availabilities }) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.target);
    const availability = availabilities.find(
      (item) => item.id === formData.get("availability_id"),
    );
    const date = formData.get("date");

    // Monta a data e hora de início e de fim da aula
    const startsAt = new Date(`${date}T${availability.start_time}`);
    const endsAt = new Date(`${date}T${availability.end_time}`);

    // Confere se a data escolhida cai no mesmo dia da semana do horário
    const weekDays = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    if (weekDays[startsAt.getDay()] !== availability.day_of_week) {
      setErrorMessage(
        `A data escolhida não é ${daysOfWeek[availability.day_of_week]}.`,
      );
      return;
    }

    if (startsAt < new Date()) {
      setErrorMessage("Escolha uma data no futuro.");
      return;
    }

    // Duração da aula no formato "HH:MM"
    const minutes = (endsAt - startsAt) / 1000 / 60;
    const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
    const rest = String(minutes % 60).padStart(2, "0");

    const { ok, data } = await callApi("/api/v1/appointments", "POST", {
      instructor_id: instructor.id,
      class_category: instructor.cnh_category === "A" ? "A" : "B",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      duration_time: `${hours}:${rest}`,
      price: instructor.price || 0,
      observations: formData.get("observations"),
    });

    if (!ok) {
      setErrorMessage(errorText(data));
      return;
    }

    router.push("/aulas");
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="normal">
        <Heading as="h2" variant="medium">
          Agendar aula
        </Heading>

        {errorMessage && (
          <Banner variant="critical" title="Erro" description={errorMessage} />
        )}

        <FormControl required>
          <FormControl.Label>Horário</FormControl.Label>
          <Select name="availability_id">
            {availabilities.map((availability) => (
              <Select.Option key={availability.id} value={availability.id}>
                {daysOfWeek[availability.day_of_week]}{" "}
                {availability.start_time.slice(0, 5)} às{" "}
                {availability.end_time.slice(0, 5)}
              </Select.Option>
            ))}
          </Select>
        </FormControl>

        <FormControl required>
          <FormControl.Label>Data da aula</FormControl.Label>
          <TextInput name="date" type="date" />
        </FormControl>

        <FormControl>
          <FormControl.Label>Observações</FormControl.Label>
          <Textarea name="observations" />
        </FormControl>

        <div>
          <Button type="submit" variant="primary">
            Agendar
          </Button>
        </div>
      </Stack>
    </form>
  );
}
