import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/instructors/[username]/availability/[availability_id]", () => {
  describe("Usuário anônimo", () => {
    test("Com próprio `username` existente", async () => {
      const createdUser = await orchestrator.createUser();
      const createdInstructorAvailability =
        await orchestrator.createInstructorAvailability({
          instructor_id: createdUser.id,
        });
      expect(uuidVersion(createdInstructorAvailability.id)).toBe(4);

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdUser.username}/availability/${createdInstructorAvailability.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: 'Verifique se o seu usuário possui a feature "read:session"',
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Usuário padrão", () => {
    test("Com próprio `username` existente e `availability_id` existente", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdInstructorAvailability =
        await orchestrator.createInstructorAvailability({
          instructor_id: createdUserInstructor.id,
        });
      expect(uuidVersion(createdInstructorAvailability.id)).toBe(4);

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdUserInstructor.username}/availability/${createdInstructorAvailability.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        instructor_id: createdUserInstructor.id,
        id: createdInstructorAvailability.id,
        day_of_week: createdInstructorAvailability.day_of_week,
        start_time: createdInstructorAvailability.start_time,
        end_time: createdInstructorAvailability.end_time,
        status: createdInstructorAvailability.status,
        created_at: createdInstructorAvailability.created_at.toISOString(),
        updated_at: createdInstructorAvailability.updated_at.toISOString(),
      });

      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });
  });
});
