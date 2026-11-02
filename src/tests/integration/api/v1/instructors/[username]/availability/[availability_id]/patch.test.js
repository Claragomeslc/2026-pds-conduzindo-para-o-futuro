import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/instructors/[username]/availability/[availability_id]", () => {
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
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action: 'Verifique se o seu usuário possui a feature "update:user"',
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Usuário padrão", () => {
    test("Com `InstructorB` mirando `InstructorA` e `role` com perfil `instructor`", async () => {
      const createdInstructorA = await orchestrator.createUser({
        username: "InstructorA",
        role: "instructor",
      });
      const createdInstructorAvailability =
        await orchestrator.createInstructorAvailability({
          instructor_id: createdInstructorA.id,
        });
      expect(uuidVersion(createdInstructorAvailability.id)).toBe(4);

      const createdInstructorB = await orchestrator.createUser({
        username: "InstructorB",
        role: "instructor",
      });

      const activatedInstructorB =
        await orchestrator.activateUser(createdInstructorB);
      const sessionObject2 =
        await orchestrator.createSession(activatedInstructorB);

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/InstructorA/availability/${createdInstructorAvailability.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject2.token}`,
          },
          body: JSON.stringify({
            day_of_week: "tuesday",
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        action:
          "Verifique se você possui a feature necessária para atualizar outro usuário.",
        message: "Você não possui permissão para atualizar outro usuário.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });

    test("Com próprio `username` e `availability_id` existentes, altera `day_of_week` válido", async () => {
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
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            day_of_week: "tuesday",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        instructor_id: createdUserInstructor.id,
        id: createdInstructorAvailability.id,
        day_of_week: "tuesday",
        start_time: createdInstructorAvailability.start_time,
        end_time: createdInstructorAvailability.end_time,
        status: createdInstructorAvailability.status,
        created_at: createdInstructorAvailability.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("Com próprio `username` e `availability_id` existentes, altera `start_time` e `end_time` válidos", async () => {
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
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            start_time: "14:10",
            end_time: "15:00",
          }),
        },
      );

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        instructor_id: createdUserInstructor.id,
        id: createdInstructorAvailability.id,
        day_of_week: createdInstructorAvailability.day_of_week,
        start_time: "14:10:00",
        end_time: "15:00:00",
        status: createdInstructorAvailability.status,
        created_at: createdInstructorAvailability.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("Com próprio `username` e `availability_id` existentes, altera `status` válido", async () => {
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
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: "busy",
          }),
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
        status: "busy",
        created_at: createdInstructorAvailability.created_at.toISOString(),
        updated_at: responseBody.updated_at,
      });

      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
