import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/appointments", () => {
  describe("Usuário anônimo", () => {
    test("Com próprio `instructor_id` existente", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const response = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instructor_id: createdUserInstructor.id,
        }),
      });

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
    test("Com `role: student` válido mirando `instructor` inexistente", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: "01234567-8910-aaaa-bbbb-cccdddeeefff",
        }),
      });

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id está digitado corretamente.",
        status_code: 404,
      });
    });

    test("Com `role: user` inválido mirando `instructor` válido", async () => {
      const createdUser = await orchestrator.createUser({
        role: "user",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });

      const response = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: createdUserInstructor.id,
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para agendar aula.",
        action:
          "Verifique se você possui a feature necessária para agendar aula.",
        status_code: 403,
      });
    });

    test("Com `role: admin` inválido mirando `instructor` válido", async () => {
      const createdUser = await orchestrator.createUser({
        role: "admin",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });

      const response = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: createdUserInstructor.id,
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para agendar aula.",
        action:
          "Verifique se você possui a feature necessária para agendar aula.",
        status_code: 403,
      });
    });

    test("Com `role: instructor` inválido mirando `instructor` válido", async () => {
      const createdUser = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });

      const response = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: createdUserInstructor.id,
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para agendar aula.",
        action:
          "Verifique se você possui a feature necessária para agendar aula.",
        status_code: 403,
      });
    });

    test("Com `role: student` válido mirando usuário com `role: user` inválido", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUser = await orchestrator.createUser({
        role: "user",
      });

      const response = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: createdUser.id,
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message:
          "Você não possui permissão para agendar aula com este usuário.",
        action:
          "Verifique se você está agendando aula com um usuário que possui perfil de instrutor.",
        status_code: 403,
      });
    });

    test("Com `role: student` válido mirando usuário com `role: admin` inválido", async () => {
      const createdUserAdmin = await orchestrator.createUser({
        role: "admin",
      });
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: createdUserAdmin.id,
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message:
          "Você não possui permissão para agendar aula com este usuário.",
        action:
          "Verifique se você está agendando aula com um usuário que possui perfil de instrutor.",
        status_code: 403,
      });
    });

    test("Com `role: student` válido mirando usuário com `role: student` inválido", async () => {
      const createdUser = await orchestrator.createUser({
        role: "student",
      });
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: createdUser.id,
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message:
          "Você não possui permissão para agendar aula com este usuário.",
        action:
          "Verifique se você está agendando aula com um usuário que possui perfil de instrutor.",
        status_code: 403,
      });
    });

    test("Com `role: student` válido mirando usuário com `role: instructor` e conta não ativa", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });

      const response = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: createdUserInstructor.id,
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você ainda não pode agendar aula com este instrutor.",
        action:
          "Verifique se você o instrutor que você selecionou está ativo na aplicação.",
        status_code: 403,
      });
    });

    test("Com dados válidos, porém `status` inexistente", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);

      const response = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: createdUserInstructor.id,
          status: "pending_confirmation",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O status do agendamento informado é inválido.",
        action: "Utilize um dos status válidos.",
        status_code: 400,
      });
    });

    test("Com dados válidos, porém `class_category` inexistente", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);

      const response = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: createdUserInstructor.id,
          class_category: "C",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "A categoria da aula informada é inválida.",
        action: "Utilize uma das categorias de aula válidas (A, B).",
        status_code: 400,
      });
    });

    test("Com `role: student` válido mirando usuário com `role: instructor` e conta ativa", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);

      const appointmentStartsAt = new Date();
      appointmentStartsAt.setDate(appointmentStartsAt.getDate() + 2);
      appointmentStartsAt.setHours(18);
      appointmentStartsAt.setMinutes(30);
      appointmentStartsAt.setSeconds(0);
      appointmentStartsAt.setMilliseconds(0);

      const appointmentEndsAt = new Date(appointmentStartsAt);
      appointmentEndsAt.setHours(appointmentEndsAt.getHours() + 1);

      const response = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: createdUserInstructor.id,
          class_category: "B",
          duration_time: "01:00",
          starts_at: appointmentStartsAt.toISOString(),
          ends_at: appointmentEndsAt.toISOString(),
          price: 100.0,
          observations: "Aula de teste",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        day_of_week: responseBody.day_of_week,
        class_category: "B",
        duration_time: "01:00:00",
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        price: "100.00",
        observations: "Aula de teste",
        status: "reserved",
        reserved_at: responseBody.reserved_at,
        confirmed_at: null,
        paid_at: null,
        completed_at: null,
        canceled_at: null,
        canceled_by: null,
        canceled_reason: null,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.starts_at)).not.toBeNaN();
      expect(Date.parse(responseBody.ends_at)).not.toBeNaN();
      expect(Date.parse(responseBody.reserved_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Com dados válidos, os próximos 3 dias intercalados no mesmo horário.", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);

      const appointmentStartsAt = new Date();
      appointmentStartsAt.setHours(18);
      appointmentStartsAt.setMinutes(30);
      appointmentStartsAt.setSeconds(0);
      appointmentStartsAt.setMilliseconds(0);

      const appointmentEndsAt = new Date(appointmentStartsAt);
      appointmentEndsAt.setHours(appointmentEndsAt.getHours() + 1);

      // reservando o primeiro agendamento para daqui a 1 dia
      appointmentStartsAt.setDate(appointmentStartsAt.getDate() + 1);
      appointmentEndsAt.setDate(appointmentEndsAt.getDate() + 1);

      const response1 = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: createdUserInstructor.id,
          class_category: "B",
          duration_time: "01:00",
          starts_at: appointmentStartsAt.toISOString(),
          ends_at: appointmentEndsAt.toISOString(),
          price: 100.0,
          observations: "Aula de teste",
        }),
      });

      expect(response1.status).toBe(201);

      const response1Body = await response1.json();

      expect(response1Body).toEqual({
        id: response1Body.id,
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        day_of_week: response1Body.day_of_week,
        class_category: "B",
        duration_time: "01:00:00",
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        price: "100.00",
        observations: "Aula de teste",
        status: "reserved",
        reserved_at: response1Body.reserved_at,
        confirmed_at: null,
        paid_at: null,
        completed_at: null,
        canceled_at: null,
        canceled_by: null,
        canceled_reason: null,
        updated_at: response1Body.updated_at,
      });

      expect(uuidVersion(response1Body.id)).toBe(4);
      expect(Date.parse(response1Body.reserved_at)).not.toBeNaN();
      expect(Date.parse(response1Body.updated_at)).not.toBeNaN();

      // reservando o segundo agendamento para daqui a 3 dias
      appointmentStartsAt.setDate(appointmentStartsAt.getDate() + 2);
      appointmentEndsAt.setDate(appointmentEndsAt.getDate() + 2);

      const response2 = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: createdUserInstructor.id,
          class_category: "B",
          duration_time: "01:00",
          starts_at: appointmentStartsAt.toISOString(),
          ends_at: appointmentEndsAt.toISOString(),
          price: 100.0,
          observations: "Aula de teste",
        }),
      });

      expect(response2.status).toBe(201);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        day_of_week: response2Body.day_of_week,
        class_category: "B",
        duration_time: "01:00:00",
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        price: "100.00",
        observations: "Aula de teste",
        status: "reserved",
        reserved_at: response2Body.reserved_at,
        confirmed_at: null,
        paid_at: null,
        completed_at: null,
        canceled_at: null,
        canceled_by: null,
        canceled_reason: null,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.reserved_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();

      // reservando o segundo agendamento para daqui a 5 dias
      appointmentStartsAt.setDate(appointmentStartsAt.getDate() + 2);
      appointmentEndsAt.setDate(appointmentEndsAt.getDate() + 2);
      const response3 = await fetch(`${webserver.origin}/api/v1/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          instructor_id: createdUserInstructor.id,
          class_category: "B",
          duration_time: "01:00",
          starts_at: appointmentStartsAt.toISOString(),
          ends_at: appointmentEndsAt.toISOString(),
          price: 100.0,
          observations: "Aula de teste",
        }),
      });

      expect(response3.status).toBe(201);

      const response3Body = await response3.json();

      expect(response3Body).toEqual({
        id: response3Body.id,
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        day_of_week: response3Body.day_of_week,
        class_category: "B",
        duration_time: "01:00:00",
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        price: "100.00",
        observations: "Aula de teste",
        status: "reserved",
        reserved_at: response3Body.reserved_at,
        confirmed_at: null,
        paid_at: null,
        completed_at: null,
        canceled_at: null,
        canceled_by: null,
        canceled_reason: null,
        updated_at: response3Body.updated_at,
      });

      expect(uuidVersion(response3Body.id)).toBe(4);
      expect(Date.parse(response3Body.reserved_at)).not.toBeNaN();
      expect(Date.parse(response3Body.updated_at)).not.toBeNaN();
    });
  });
});
