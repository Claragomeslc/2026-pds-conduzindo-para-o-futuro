import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/instructors/[username]/availability/query", () => {
  describe("Usuário anônimo", () => {
    test("Sem permissão para buscar disponibilidades de instrutores", async () => {
      const createdInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdInstructor.username}/availability/query`,
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
    test("Com dados válidos buscando `role: instructor` e `status: 'open'`", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      await orchestrator.createInstructorAvailability({
        instructor_id: createdUserInstructor.id,
        status: "open",
      });

      await orchestrator.createInstructorAvailability({
        instructor_id: createdUserInstructor.id,
        status: "busy",
      });

      await orchestrator.createInstructorAvailability({
        instructor_id: createdUserInstructor.id,
        status: "open",
      });

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdUserInstructor.username}/availability/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            filters: {
              status: "open",
            },
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody.total).toBe(2);

      responseBody.availabilities.forEach((availability) => {
        expect(availability.instructor_id).toBe(createdUserInstructor.id);
        expect(availability.status).toBe("open");
      });
    });

    test("Com dados válidos buscando `role: instructor` e `day_of_week: 'monday'`", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      await orchestrator.createInstructorAvailability({
        instructor_id: createdUserInstructor.id,
        day_of_week: "monday",
      });

      await orchestrator.createInstructorAvailability({
        instructor_id: createdUserInstructor.id,
        day_of_week: "tuesday",
      });

      await orchestrator.createInstructorAvailability({
        instructor_id: createdUserInstructor.id,
        day_of_week: "monday",
      });

      await orchestrator.createInstructorAvailability({
        instructor_id: createdUserInstructor.id,
        day_of_week: "wednesday",
      });

      await orchestrator.createInstructorAvailability({
        instructor_id: createdUserInstructor.id,
        day_of_week: "monday",
      });

      await orchestrator.createInstructorAvailability({
        instructor_id: createdUserInstructor.id,
        day_of_week: "thursday",
      });

      await orchestrator.createInstructorAvailability({
        instructor_id: createdUserInstructor.id,
        day_of_week: "monday",
      });

      await orchestrator.createInstructorAvailability({
        instructor_id: createdUserInstructor.id,
        day_of_week: "friday",
      });

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdUserInstructor.username}/availability/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            filters: {
              day_of_week: "monday",
            },
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody.total).toBe(4);

      responseBody.availabilities.forEach((availability) => {
        expect(availability.instructor_id).toBe(createdUserInstructor.id);
        expect(availability.day_of_week).toBe("monday");
      });
    });
  });
});
