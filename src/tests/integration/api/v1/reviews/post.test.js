import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/reviews", () => {
  describe("Usuário anônimo", () => {
    test("Com próprio `instructor_id` existente", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          context: "general",
          rating: 4,
          comment: "Aula excelente e explicação muito clara.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "update:user"',
        status_code: 403,
      });
    });
  });

  describe("Usuário padrão", () => {
    test("Com `role: user` inválido mirando `instructor` existente", async () => {
      const createdUser = await orchestrator.createUser({
        role: "user",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para registrar uma avaliação.",
        action:
          "Verifique se você possui a feature necessária para registrar uma avaliação.",
        status_code: 403,
      });
    });

    test("Com `role: user` inválido mirando `student` existente", async () => {
      const createdUser = await orchestrator.createUser({
        role: "user",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserStudent.id,
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para registrar uma avaliação.",
        action:
          "Verifique se você possui a feature necessária para registrar uma avaliação.",
        status_code: 403,
      });
    });

    test("Com `role: admin` inválido mirando `instructor` existente", async () => {
      const createdUser = await orchestrator.createUser({
        role: "admin",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para registrar uma avaliação.",
        action:
          "Verifique se você possui a feature necessária para registrar uma avaliação.",
        status_code: 403,
      });
    });

    test("Com `role: admin` inválido mirando `student` existente", async () => {
      const createdUser = await orchestrator.createUser({
        role: "admin",
      });
      const activatedUser = await orchestrator.activateUser(createdUser);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserStudent.id,
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para registrar uma avaliação.",
        action:
          "Verifique se você possui a feature necessária para registrar uma avaliação.",
        status_code: 403,
      });
    });

    test("Com `role: student` válido mirando `instructor` inexistente", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: "01234567-8910-aaaa-bbbb-cccdddeeefff",
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id está digitado corretamente.",
        status_code: 404,
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
      await orchestrator.activateUser(createdUser);

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUser.id,
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para avaliar este usuário.",
        action:
          "Verifique se você possui a feature necessária para avaliar um usuário que possui perfil de instrutor ou aluno.",
        status_code: 403,
      });
    });

    test("Com `role: student` válido mirando usuário com `role: admin` inválido", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUser = await orchestrator.createUser({
        role: "admin",
      });
      await orchestrator.activateUser(createdUser);

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUser.id,
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para avaliar este usuário.",
        action:
          "Verifique se você possui a feature necessária para avaliar um usuário que possui perfil de instrutor ou aluno.",
        status_code: 403,
      });
    });

    test("Com `role: instructor` válido mirando `student` inexistente", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: "01234567-8910-aaaa-bbbb-cccdddeeefff",
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id está digitado corretamente.",
        status_code: 404,
      });
    });

    test("Com `role: instructor` válido mirando usuário com `role: user` inválido", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUser = await orchestrator.createUser({
        role: "user",
      });
      await orchestrator.activateUser(createdUser);

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUser.id,
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para avaliar este usuário.",
        action:
          "Verifique se você possui a feature necessária para avaliar um usuário que possui perfil de instrutor ou aluno.",
        status_code: 403,
      });
    });

    test("Com `role: instructor` válido mirando usuário com `role: admin` inválido", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUser = await orchestrator.createUser({
        role: "admin",
      });
      await orchestrator.activateUser(createdUser);

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUser.id,
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para avaliar este usuário.",
        action:
          "Verifique se você possui a feature necessária para avaliar um usuário que possui perfil de instrutor ou aluno.",
        status_code: 403,
      });
    });

    test("Com `role: student` válido mirando `student` inválido", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserStudent2 = await orchestrator.createUser({
        role: "student",
      });

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserStudent2.id,
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para avaliar este usuário.",
        action:
          "Verifique se você está avaliando um usuário que possui perfil de instrutor.",
        status_code: 403,
      });
    });

    test("Com `role: instructor` válido mirando `instructor` inválido", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor2 = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor2);

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor2.id,
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para avaliar este usuário.",
        action:
          "Verifique se você está avaliando um usuário que possui perfil de aluno.",
        status_code: 403,
      });
    });

    test("Com `role: student` válido mirando `instructor` e conta não ativa", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você ainda não pode avaliar este usuário.",
        action:
          "Verifique se o usuário que você selecionou está ativo na aplicação.",
        status_code: 403,
      });
    });

    test("Com `role: instructor` válido mirando `student` e conta não ativa", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserStudent.id,
          context: "general",
          rating: 3,
          comment: "Comentário de exemplo desta avaliação.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você ainda não pode avaliar este usuário.",
        action:
          "Verifique se o usuário que você selecionou está ativo na aplicação.",
        status_code: 403,
      });
    });

    test("Com dados válidos, porém `context` inexistente", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          context: "feedback",
          rating: 5,
          comment:
            "O instrutor é excelente e suas instruções são claras e objetivas.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(400);
      expect(responseBody).toEqual({
        name: "ValidationError",
        action: "Utilize um dos contextos de avaliação válidos.",
        message: "O contexto da avaliação informado é inválido.",
        status_code: 400,
      });
    });

    test("Com dados válidos, porém `appointment_id` inexistente", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          appointment_id: "01234567-8910-aaaa-bbbb-cccdddeeefff",
          context: "appointment",
          rating: 3,
          comment: "Esta foi a minha primeira aula e eu gostei muito.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id está digitado corretamente.",
        status_code: 404,
      });
    });

    test("Com dados válidos, porém `appointment_id` com `status: reserved` inválido", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);

      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        status: "reserved",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("reserved");

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          appointment_id: createdStudentAppointment.id,
          context: "general",
          rating: 5,
          comment:
            "Nesta aula o instrutor me ajudou fazer a minha primeira baliza.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você ainda não pode avaliar este agendamento de aula.",
        action:
          "Verifique se o agendamento de aula que você selecionou já foi concluído.",
        status_code: 403,
      });
    });

    test("Com dados válidos, porém `appointment_id` com `status: pending_payment` inválido", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);

      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        status: "pending_payment",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("pending_payment");

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          appointment_id: createdStudentAppointment.id,
          context: "general",
          rating: 5,
          comment:
            "Nesta aula o instrutor me ajudou fazer a minha primeira baliza.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você ainda não pode avaliar este agendamento de aula.",
        action:
          "Verifique se o agendamento de aula que você selecionou já foi concluído.",
        status_code: 403,
      });
    });

    test("Com dados válidos, porém `appointment_id` com `status: booked` inválido", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);

      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        status: "booked",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("booked");

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          appointment_id: createdStudentAppointment.id,
          context: "general",
          rating: 5,
          comment:
            "Nesta aula o instrutor me ajudou fazer a minha primeira baliza.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você ainda não pode avaliar este agendamento de aula.",
        action:
          "Verifique se o agendamento de aula que você selecionou já foi concluído.",
        status_code: 403,
      });
    });

    test("Com dados válidos, porém `appointment_id` com `status: canceled` inválido", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);

      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        status: "canceled",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("canceled");

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          appointment_id: createdStudentAppointment.id,
          context: "general",
          rating: 5,
          comment:
            "Nesta aula o instrutor me ajudou fazer a minha primeira baliza.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você ainda não pode avaliar este agendamento de aula.",
        action:
          "Verifique se o agendamento de aula que você selecionou já foi concluído.",
        status_code: 403,
      });
    });

    test("Aluno com dados válidos, porém `appointment` com `student_id` diferente", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);
      const createdUserStudent2 = await orchestrator.createUser({
        role: "student",
      });
      await orchestrator.activateUser(createdUserStudent2);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);
      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent2.id,
        instructor_id: createdUserInstructor.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          appointment_id: createdStudentAppointment.id,
          context: "general",
          rating: 5,
          comment:
            "Nesta aula o instrutor me ajudou fazer a minha primeira baliza.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id está digitado corretamente.",
        status_code: 404,
      });
    });

    test("Aluno com dados válidos, porém `appointment` com `instructor_id` diferente", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);
      const createdUserInstructor2 = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor2);
      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor2.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          appointment_id: createdStudentAppointment.id,
          context: "general",
          rating: 5,
          comment:
            "Nesta aula o instrutor me ajudou fazer a minha primeira baliza.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não pode avaliar este agendamento de aula.",
        action:
          "Verifique se o agendamento de aula que você selecionou é do mesmo instrutor a ser avaliado.",
        status_code: 403,
      });
    });

    test("Instrutor com dados válidos, porém `appointment` com `student_id` diferente", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      await orchestrator.activateUser(createdUserStudent);
      const createdUserStudent2 = await orchestrator.createUser({
        role: "student",
      });
      await orchestrator.activateUser(createdUserStudent2);
      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent2.id,
        instructor_id: createdUserInstructor.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserStudent.id,
          appointment_id: createdStudentAppointment.id,
          context: "general",
          rating: 5,
          comment:
            "Nesta aula o instrutor me ajudou fazer a minha primeira baliza.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não pode avaliar este agendamento de aula.",
        action:
          "Verifique se o agendamento de aula que você selecionou é do mesmo aluno a ser avaliado.",
        status_code: 403,
      });
    });

    test("Instrutor com dados válidos, porém `appointment` com `instructor_id` diferente", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      await orchestrator.activateUser(createdUserStudent);
      const createdUserInstructor2 = await orchestrator.createUser({
        role: "student",
      });
      await orchestrator.activateUser(createdUserInstructor2);
      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor2.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserStudent.id,
          appointment_id: createdStudentAppointment.id,
          context: "general",
          rating: 5,
          comment:
            "Nesta aula o instrutor me ajudou fazer a minha primeira baliza.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id está digitado corretamente.",
        status_code: 404,
      });
    });

    test("Aluno com dados válidos, porém `review` com `reviewed_user_id` diferente", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);
      const createdUserInstructor2 = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor2);
      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor2.id,
          appointment_id: createdStudentAppointment.id,
          context: "general",
          rating: 5,
          comment:
            "Nesta aula o instrutor me ajudou fazer a minha primeira baliza.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não pode avaliar este agendamento de aula.",
        action:
          "Verifique se o agendamento de aula que você selecionou é do mesmo instrutor a ser avaliado.",
        status_code: 403,
      });
    });

    test("Instrutor com dados válidos, porém `review` com `reviewed_user_id` diferente", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      await orchestrator.activateUser(createdUserStudent);
      const createdUserStudent2 = await orchestrator.createUser({
        role: "student",
      });
      await orchestrator.activateUser(createdUserStudent2);
      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserStudent2.id,
          appointment_id: createdStudentAppointment.id,
          context: "general",
          rating: 5,
          comment:
            "Nesta aula o instrutor me ajudou fazer a minha primeira baliza.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não pode avaliar este agendamento de aula.",
        action:
          "Verifique se o agendamento de aula que você selecionou é do mesmo aluno a ser avaliado.",
        status_code: 403,
      });
    });

    test("Com `role: student` válido mirando `instructor` e conta ativa", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          context: "general",
          rating: 5,
          comment:
            "O instrutor é excelente e suas instruções são claras e objetivas.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(201);
      expect(responseBody).toEqual({
        id: responseBody.id,
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: null,
        context: "general",
        rating: 5,
        comment:
          "O instrutor é excelente e suas instruções são claras e objetivas.",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Com `role: instructor` válido mirando `student` e conta ativa", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      await orchestrator.activateUser(createdUserStudent);

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserStudent.id,
          context: "general",
          rating: 4,
          comment: "O aluno é bastante atencioso e sabe seguir as instruções.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(201);
      expect(responseBody).toEqual({
        id: responseBody.id,
        reviewer_user_id: createdUserInstructor.id,
        reviewed_user_id: createdUserStudent.id,
        appointment_id: null,
        context: "general",
        rating: 4,
        comment: "O aluno é bastante atencioso e sabe seguir as instruções.",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Aluno com dados válidos avaliando agendamento de aula concluído", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor);

      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserInstructor.id,
          appointment_id: createdStudentAppointment.id,
          context: "appointment",
          rating: 5,
          comment:
            "Nesta aula o instrutor me ajudou fazer a minha primeira baliza.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(201);
      expect(responseBody).toEqual({
        id: responseBody.id,
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: createdStudentAppointment.id,
        context: "appointment",
        rating: 5,
        comment:
          "Nesta aula o instrutor me ajudou fazer a minha primeira baliza.",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Instrutor com dados válidos avaliando agendamento de aula concluído", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      await orchestrator.activateUser(createdUserStudent);

      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const response = await fetch(`${webserver.origin}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObject.token}`,
        },
        body: JSON.stringify({
          reviewed_user_id: createdUserStudent.id,
          appointment_id: createdStudentAppointment.id,
          context: "appointment",
          rating: 4,
          comment: "Aula muito boa com aluno dedicado e sempre alerta.",
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(201);
      expect(responseBody).toEqual({
        id: responseBody.id,
        reviewer_user_id: createdUserInstructor.id,
        reviewed_user_id: createdUserStudent.id,
        appointment_id: createdStudentAppointment.id,
        context: "appointment",
        rating: 4,
        comment: "Aula muito boa com aluno dedicado e sempre alerta.",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });
  });
});
