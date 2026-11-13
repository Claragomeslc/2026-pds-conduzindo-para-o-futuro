import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/reviews/[review_id]", () => {
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
          method: "GET",
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
        action: 'Verifique se o seu usuário possui a feature "read:session"',
        status_code: 403,
      });
    });
  });

  describe("Usuário padrão", () => {
    test("Com `review_id` existente e `reviewer_user_id` diferente", async () => {
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
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
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

    test("Com próprio `student_id` existente e `review_id` existente", async () => {
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
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
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
        comment: createdStudentReview.comment,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Com próprio `instructor_id` existente e `review_id` existente", async () => {
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
      const createdInstructorReview = await orchestrator.createReview({
        reviewer_user_id: createdUserInstructor.id,
        reviewed_user_id: createdUserStudent.id,
        appointment_id: null,
      });
      expect(uuidVersion(createdInstructorReview.id)).toBe(4);

      const response = await fetch(
        `${webserver.origin}/api/v1/reviews/${createdInstructorReview.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: responseBody.id,
        reviewer_user_id: createdUserInstructor.id,
        reviewed_user_id: createdUserStudent.id,
        appointment_id: null,
        context: createdInstructorReview.context,
        rating: createdInstructorReview.rating,
        comment: createdInstructorReview.comment,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });

    test("Com próprio `student_id` + `appointment_id` existente e `review_id` existente", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedUser = await orchestrator.activateUser(createdUserStudent);
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });

      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);

      const createdStudentReview = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: createdStudentAppointment.id,
      });
      expect(uuidVersion(createdStudentReview.id)).toBe(4);

      const response = await fetch(
        `${webserver.origin}/api/v1/reviews/${createdStudentReview.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody).toEqual({
        id: responseBody.id,
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: createdStudentAppointment.id,
        context: createdStudentReview.context,
        rating: createdStudentReview.rating,
        comment: createdStudentReview.comment,
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });
  });
});
