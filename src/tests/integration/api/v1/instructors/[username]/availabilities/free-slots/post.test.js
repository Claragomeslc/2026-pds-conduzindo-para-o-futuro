import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";
import appointment from "models/appointment.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

// Devolve a data (AAAA-MM-DD) de uma segunda-feira daqui a pelo menos 7 dias.
function getFutureMonday() {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + 7);
  while (date.getUTCDay() !== 1) {
    date.setUTCDate(date.getUTCDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

async function postFreeSlots(username, token, body) {
  const response = await fetch(
    `${webserver.origin}/api/v1/instructors/${username}/availabilities/free-slots`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${token}`,
      },
      body: JSON.stringify(body),
    },
  );

  return { response, responseBody: await response.json() };
}

describe("POST /api/v1/instructors/[username]/availabilities/free-slots", () => {
  describe("Usuário anônimo", () => {
    test("Sem permissão para buscar horários livres", async () => {
      const createdInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdInstructor.username}/availabilities/free-slots`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:session"',
        status_code: 403,
      });
    });
  });

  describe("Usuário padrão", () => {
    test("Com período inválido", async () => {
      const createdInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(createdInstructor);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const { response, responseBody } = await postFreeSlots(
        createdInstructor.username,
        sessionObject.token,
        { from: "abc", to: "2026-12-20" },
      );

      expect(response.status).toBe(400);
      expect(responseBody.message).toBe("O período informado é inválido.");
    });

    test("O horário some da lista quando a aula é marcada e volta quando ela é cancelada (RF07)", async () => {
      const createdInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedInstructor =
        await orchestrator.activateUser(createdInstructor);
      const sessionObject =
        await orchestrator.createSession(activatedInstructor);
      const createdStudent = await orchestrator.createUser({
        role: "student",
      });

      const monday = getFutureMonday();
      const startsAt = `${monday}T08:00:00-03:00`;
      const endsAt = `${monday}T09:00:00-03:00`;

      // Horário oferecido pelo instrutor: toda segunda, das 8h às 9h
      await orchestrator.createInstructorAvailability({
        instructor_id: createdInstructor.id,
        day_of_week: "monday",
        start_time: "08:00",
        end_time: "09:00",
        status: "open",
      });

      // Horário bloqueado pelo instrutor: não pode aparecer na lista
      await orchestrator.createInstructorAvailability({
        instructor_id: createdInstructor.id,
        day_of_week: "monday",
        start_time: "10:00",
        end_time: "11:00",
        status: "busy",
      });

      const period = { from: monday, to: monday };

      // 1) Antes de agendar: o horário das 8h aparece
      const before = await postFreeSlots(
        createdInstructor.username,
        sessionObject.token,
        period,
      );
      expect(before.response.status).toBe(200);
      expect(before.responseBody.total).toBe(1);
      expect(new Date(before.responseBody.slots[0].starts_at).toISOString()).toBe(
        new Date(startsAt).toISOString(),
      );

      // 2) Depois de agendar: o horário some
      const createdAppointment = await orchestrator.createAppointment({
        instructor_id: createdInstructor.id,
        student_id: createdStudent.id,
        starts_at: startsAt,
        ends_at: endsAt,
      });

      const afterBooking = await postFreeSlots(
        createdInstructor.username,
        sessionObject.token,
        period,
      );
      expect(afterBooking.response.status).toBe(200);
      expect(afterBooking.responseBody.total).toBe(0);

      // 3) Depois de cancelar: o horário volta
      await appointment.update(createdAppointment.id, createdStudent.id, {
        status: "canceled",
        canceled_reason: "Cancelamento de teste",
      });

      const afterCanceling = await postFreeSlots(
        createdInstructor.username,
        sessionObject.token,
        period,
      );
      expect(afterCanceling.response.status).toBe(200);
      expect(afterCanceling.responseBody.total).toBe(1);
    });
  });
});
