import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/reviews/[review_id]", () => {
  describe("Usuário anônimo", () => {
    test("Com próprio `student_id` existente", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const createdStudentReview = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: null,
      });
      expect(uuidVersion(createdStudentReview.id)).toBe(4);

      const response = await fetch(
        `${webserver.origin}/api/v1/reviews/${createdStudentReview.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

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
    test("Com próprio `student_id` e `review_id` existentes, porém `reviewer_user_id` diferente", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const createdUserStudent2 = await orchestrator.createUser({
        role: "student",
      });
      const createdStudentReview = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent2.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: null,
      });
      expect(uuidVersion(createdStudentReview.id)).toBe(4);

      const response = await fetch(
        `${webserver.origin}/api/v1/reviews/${createdStudentReview.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            rating: 5,
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(404);
      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O id informado não foi encontrado no sistema.",
        action: "Verifique se o id está digitado corretamente.",
        status_code: 404,
      });
    });

    test("Com próprio `student_id` e `review_id` existentes, altera `rating` inválido", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const createdStudentReview = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: null,
        rating: 3,
      });
      expect(uuidVersion(createdStudentReview.id)).toBe(4);

      const response = await fetch(
        `${webserver.origin}/api/v1/reviews/${createdStudentReview.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            rating: 9,
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(400);
      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "A nota da avaliação informado é inválida.",
        action: "Utilize uma nota válida (1, 2, 3, 4 ou 5).",
        status_code: 400,
      });
    });

    test("Com próprio `student_id` e `review_id` existentes, altera `rating` válido", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const createdStudentReview = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: null,
        rating: 3,
      });
      expect(uuidVersion(createdStudentReview.id)).toBe(4);

      const response = await fetch(
        `${webserver.origin}/api/v1/reviews/${createdStudentReview.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            rating: 4,
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: responseBody.id,
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: null,
        context: createdStudentReview.context,
        rating: 4,
        comment: createdStudentReview.comment,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });

    test("Com próprio `student_id` e `review_id` existentes, altera `comment` válido", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const createdStudentReview = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: null,
      });
      expect(uuidVersion(createdStudentReview.id)).toBe(4);

      const response = await fetch(
        `${webserver.origin}/api/v1/reviews/${createdStudentReview.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            comment:
              "Comentário alterado com sucesso após revisão da avaliação.",
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: responseBody.id,
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: null,
        context: createdStudentReview.context,
        rating: createdStudentReview.rating,
        comment: "Comentário alterado com sucesso após revisão da avaliação.",
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.created_at).toBe(true);
    });
  });
});
