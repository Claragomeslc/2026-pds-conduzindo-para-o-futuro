import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/instructors/[username]/availabilities", () => {
  describe("Usuário anônimo", () => {
    test("Com próprio `username` existente", async () => {
      const createdUser = await orchestrator.createUser();

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdUser.username}/availabilities`,
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
        action: 'Verifique se o seu usuário possui a feature "update:user"',
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Usuário padrão", () => {
    test("Com `username` inexistente", async () => {
      const createdUser = await orchestrator.createUser();
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/UsuarioInexistente/availabilities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O username informado não foi encontrado no sistema.",
        action: "Verifique se o username está digitado corretamente.",
        status_code: 404,
      });
    });

    test("Com `username` existente e `role` com perfil `user`", async () => {
      const createdUser = await orchestrator.createUser({
        role: "user",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdUser.username}/availabilities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message:
          "Você não possui permissão para alterar dados de um instrutor.",
        action:
          "Verifique se você possui a feature necessária para alterar dados de um instrutor.",
        status_code: 403,
      });
    });

    test("Com `username` existente e `role` com perfil `admin`", async () => {
      const createdUserAdmin = await orchestrator.createUser({
        role: "admin",
      });
      const activatedUser = await orchestrator.activateUser(createdUserAdmin);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdUserAdmin.username}/availabilities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message:
          "Você não possui permissão para alterar dados de um instrutor.",
        action:
          "Verifique se você possui a feature necessária para alterar dados de um instrutor.",
        status_code: 403,
      });
    });

    test("Com `username` existente e `role` com perfil `student`", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdUserStudent.username}/availabilities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message:
          "Você não possui permissão para alterar dados de um instrutor.",
        action:
          "Verifique se você possui a feature necessária para alterar dados de um instrutor.",
        status_code: 403,
      });
    });

    test("Com `InstructorB` mirando `InstructorA` e `role` com perfil `instructor`", async () => {
      await orchestrator.createUser({
        username: "InstructorA",
        role: "instructor",
      });

      const createdInstructorB = await orchestrator.createUser({
        username: "InstructorB",
        role: "instructor",
      });

      const activatedInstructorB =
        await orchestrator.activateUser(createdInstructorB);
      const sessionObject2 =
        await orchestrator.createSession(activatedInstructorB);

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/InstructorA/availabilities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject2.token}`,
          },
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

    test("Com `day_of_week` inexistente e `role` com perfil `instructor`", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdUserInstructor.username}/availabilities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            instructor_id: createdUserInstructor.id,
            day_of_week: "today",
            start_time: "18:00",
            end_time: "18:50",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: "O dia da semana informado é inválido.",
        action: "Utilize um dos dias da semana válidos.",
        name: "ValidationError",
        status_code: 400,
      });
    });

    test("Com `status` inexistente e `role` com perfil `instructor`", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdUserInstructor.username}/availabilities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            instructor_id: createdUserInstructor.id,
            status: "free",
            day_of_week: "monday",
            start_time: "09:00",
            end_time: "09:50",
          }),
        },
      );

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        message: "O status da disponibilidade de agenda informado é inválido.",
        action: "Utilize um dos status válidos.",
        name: "ValidationError",
        status_code: 400,
      });
    });

    test("Com `username` existente e `role` com perfil `instructor`", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdUserInstructor.username}/availabilities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            instructor_id: createdUserInstructor.id,
            day_of_week: "monday",
            start_time: "09:00",
            end_time: "09:50",
          }),
        },
      );

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        instructor_id: createdUserInstructor.id,
        day_of_week: "monday",
        start_time: "09:00:00",
        end_time: "09:50:00",
        status: "open",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });
  });
});
