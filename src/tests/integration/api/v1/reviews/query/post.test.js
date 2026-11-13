import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/reviews/query", () => {
  describe("Usuário anônimo", () => {
    test("Sem permissão para buscar avaliações de `instructor`", async () => {
      const createdUser = await orchestrator.createUser({
        role: "instructor",
      });
      const response = await fetch(`${webserver.origin}/api/v1/reviews/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewer_user_id: createdUser.id,
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:session"',
        status_code: 403,
      });
    });

    test("Sem permissão para buscar avaliações de `student`", async () => {
      const createdUser = await orchestrator.createUser({
        role: "student",
      });
      const response = await fetch(`${webserver.origin}/api/v1/reviews/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewer_user_id: createdUser.id,
        }),
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:session"',
        status_code: 403,
      });
    });

    test("Sem permissão para buscar avaliações de avaliaçãos", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/reviews/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointment_id: "01234567-8910-aaaa-bbbb-cccdddeeefff",
        }),
      });

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
    test("Perfil `student` buscando avaliação de `student` diferente", async () => {
      const createdUserStudent1 = await orchestrator.createUser({
        role: "student",
      });
      const activatedStudent1 =
        await orchestrator.activateUser(createdUserStudent1);
      const sessionObjectStudent1 =
        await orchestrator.createSession(activatedStudent1);

      const createdUserStudent2 = await orchestrator.createUser({
        role: "student",
      });

      const response = await fetch(`${webserver.origin}/api/v1/reviews/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObjectStudent1.token}`,
        },
        body: JSON.stringify({
          filters: {
            reviewer_user_id: createdUserStudent2.id,
          },
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message:
          "Você não possui permissão para buscar avaliações de outro aluno.",
        action:
          "Verifique se você possui a feature necessária para buscar essas avaliações.",
        status_code: 403,
      });
    });

    test("Perfil `instructor` buscando avaliação de `instructor` diferente", async () => {
      const createdUserInstructor1 = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedInstructor1 = await orchestrator.activateUser(
        createdUserInstructor1,
      );
      const sessionObjectInstructor1 =
        await orchestrator.createSession(activatedInstructor1);

      const createdUserInstructor2 = await orchestrator.createUser({
        role: "instructor",
      });

      const response = await fetch(`${webserver.origin}/api/v1/reviews/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObjectInstructor1.token}`,
        },
        body: JSON.stringify({
          filters: {
            reviewer_user_id: createdUserInstructor2.id,
          },
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(403);
      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message:
          "Você não possui permissão para buscar avaliações de outro instrutor.",
        action:
          "Verifique se você possui a feature necessária para buscar essas avaliações.",
        status_code: 403,
      });
    });

    test("Perfil `student` buscando avaliações concedidas como `reviewer_user_id`", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedStudent =
        await orchestrator.activateUser(createdUserStudent);
      const sessionObjectStudent =
        await orchestrator.createSession(activatedStudent);
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const createdUserInstructor2 = await orchestrator.createUser({
        role: "instructor",
      });
      const createdStudentReview = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: null,
        context: "general",
        rating: 4,
        comment: "Eu recomendo este instrutor para alunos com medo de dirigir.",
      });
      expect(uuidVersion(createdStudentReview.id)).toBe(4);

      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor2.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const createdStudentReview2 = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor2.id,
        appointment_id: createdStudentAppointment.id,
        context: "appointment",
        rating: 4,
        comment: "Eu recomendo este instrutor para alunos com medo de dirigir.",
      });
      expect(uuidVersion(createdStudentReview2.id)).toBe(4);

      const createdInstructorReview3 = await orchestrator.createReview({
        reviewer_user_id: createdUserInstructor.id,
        reviewed_user_id: createdUserStudent.id,
        appointment_id: null,
        context: "general",
        rating: 5,
        comment:
          "Aluno exemplar que está dirigindo com respeito ao trânsito e pedestres.",
      });
      expect(uuidVersion(createdInstructorReview3.id)).toBe(4);

      const response = await fetch(`${webserver.origin}/api/v1/reviews/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObjectStudent.token}`,
        },
        body: JSON.stringify({
          filters: {
            reviewer_user_id: createdUserStudent.id,
          },
          sort: {
            created_at: "desc",
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody.total).toBe(2);

      responseBody.reviews.forEach((review) => {
        expect(review.reviewer_user_id).toBe(createdUserStudent.id);
        expect(review.rating).toBe(4);
        expect(review.comment).toBe(
          "Eu recomendo este instrutor para alunos com medo de dirigir.",
        );
      });
    });

    test("Perfil `student` buscando avaliações recebidas como `reviewed_user_id`", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedStudent =
        await orchestrator.activateUser(createdUserStudent);
      const sessionObjectStudent =
        await orchestrator.createSession(activatedStudent);

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });

      const createdInstructorReview = await orchestrator.createReview({
        reviewer_user_id: createdUserInstructor.id,
        reviewed_user_id: createdUserStudent.id,
        appointment_id: null,
        context: "general",
        rating: 5,
        comment:
          "Aluno exemplar que está dirigindo com respeito ao trânsito e pedestres.",
      });
      expect(uuidVersion(createdInstructorReview.id)).toBe(4);

      const createdStudentReview = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: null,
        context: "general",
        rating: 4,
        comment: "Eu recomendo este instrutor para alunos com medo de dirigir.",
      });
      expect(uuidVersion(createdStudentReview.id)).toBe(4);

      const response = await fetch(`${webserver.origin}/api/v1/reviews/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObjectStudent.token}`,
        },
        body: JSON.stringify({
          filters: {
            reviewed_user_id: createdUserStudent.id,
          },
          sort: {
            created_at: "desc",
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody.total).toBe(1);

      responseBody.reviews.forEach((review) => {
        expect(review.reviewed_user_id).toBe(createdUserStudent.id);
        expect(review.reviewer_user_id).toBe(createdUserInstructor.id);
        expect(review.context).toBe("general");
        expect(review.rating).toBe(5);
        expect(review.comment).toBe(
          "Aluno exemplar que está dirigindo com respeito ao trânsito e pedestres.",
        );
      });
    });

    test("Perfil `instructor` buscando avaliações concedidas como `reviewer_user_id`", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedInstructor = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObjectInstructor =
        await orchestrator.createSession(activatedInstructor);
      const createdUserInstructor2 = await orchestrator.createUser({
        role: "instructor",
      });
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const createdInstructorReview = await orchestrator.createReview({
        reviewer_user_id: createdUserInstructor.id,
        reviewed_user_id: createdUserStudent.id,
        appointment_id: null,
        context: "general",
        rating: 4,
        comment: "Aluno dedicado!",
      });
      expect(uuidVersion(createdInstructorReview.id)).toBe(4);

      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const createdInstructorReview2 = await orchestrator.createReview({
        reviewer_user_id: createdUserInstructor2.id,
        reviewed_user_id: createdUserStudent.id,
        appointment_id: createdStudentAppointment.id,
        context: "appointment",
        rating: 3,
        comment: "Aluno atencioso!",
      });
      expect(uuidVersion(createdInstructorReview2.id)).toBe(4);

      const createdInstructorReview3 = await orchestrator.createReview({
        reviewer_user_id: createdUserInstructor.id,
        reviewed_user_id: createdUserStudent.id,
        appointment_id: null,
        context: "general",
        rating: 4,
        comment: "Aluno dedicado!",
      });
      expect(uuidVersion(createdInstructorReview3.id)).toBe(4);

      const createdStudentReview = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: null,
        context: "general",
        rating: 4,
        comment: "Eu recomendo este instrutor para alunos com medo de dirigir.",
      });
      expect(uuidVersion(createdStudentReview.id)).toBe(4);

      const response = await fetch(`${webserver.origin}/api/v1/reviews/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObjectInstructor.token}`,
        },
        body: JSON.stringify({
          filters: {
            reviewer_user_id: createdUserInstructor.id,
          },
          sort: {
            created_at: "desc",
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody.total).toBe(2);

      responseBody.reviews.forEach((review) => {
        expect(review.reviewer_user_id).toBe(createdUserInstructor.id);
        expect(review.rating).toBe(4);
        expect(review.comment).toBe("Aluno dedicado!");
      });
    });

    test("Perfil `instructor` buscando avaliações recebidas como `reviewed_user_id`", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedInstructor = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObjectInstructor =
        await orchestrator.createSession(activatedInstructor);
      const createdUserInstructor2 = await orchestrator.createUser({
        role: "instructor",
      });
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const createdStudentReview = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: null,
        context: "general",
        rating: 4,
        comment: "Eu recomendo este instrutor para alunos com medo de dirigir.",
      });
      expect(uuidVersion(createdStudentReview.id)).toBe(4);

      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const createdInstructorReview = await orchestrator.createReview({
        reviewer_user_id: createdUserInstructor.id,
        reviewed_user_id: createdUserStudent.id,
        appointment_id: createdStudentAppointment.id,
        context: "appointment",
        rating: 3,
        comment: "Aluno atencioso!",
      });
      expect(uuidVersion(createdInstructorReview.id)).toBe(4);

      const createdStudentReview2 = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor2.id,
        appointment_id: null,
        context: "general",
        rating: 4,
        comment: "Eu recomendo este instrutor para alunos com medo de dirigir.",
      });
      expect(uuidVersion(createdStudentReview2.id)).toBe(4);

      const response = await fetch(`${webserver.origin}/api/v1/reviews/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObjectInstructor.token}`,
        },
        body: JSON.stringify({
          filters: {
            reviewed_user_id: createdUserInstructor.id,
          },
          sort: {
            created_at: "desc",
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody.total).toBe(1);

      responseBody.reviews.forEach((review) => {
        expect(review.reviewed_user_id).toBe(createdUserInstructor.id);
        expect(review.rating).toBe(4);
        expect(review.comment).toBe(
          "Eu recomendo este instrutor para alunos com medo de dirigir.",
        );
      });
    });

    test("Perfil `student` buscando avaliações por `appointment_id` de outro aluno", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedStudent =
        await orchestrator.activateUser(createdUserStudent);
      const sessionObjectStudent =
        await orchestrator.createSession(activatedStudent);
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const createdUserStudent2 = await orchestrator.createUser({
        role: "student",
      });
      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent2.id,
        instructor_id: createdUserInstructor.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const createdStudentReview2 = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent2.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: createdStudentAppointment.id,
        context: "appointment",
        rating: 4,
        comment: "A aula foi muito boa!",
      });
      expect(uuidVersion(createdStudentReview2.id)).toBe(4);

      const response = await fetch(`${webserver.origin}/api/v1/reviews/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObjectStudent.token}`,
        },
        body: JSON.stringify({
          filters: {
            appointment_id: createdStudentAppointment.id,
          },
          sort: {
            created_at: "desc",
          },
          pagination: {
            page: 1,
            limit: 10,
          },
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

    test("Perfil `instructor` buscando avaliações por `appointment_id` de outro instrutor", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedInstructor = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObjectInstructor =
        await orchestrator.createSession(activatedInstructor);
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const createdUserInstructor2 = await orchestrator.createUser({
        role: "instructor",
      });
      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor2.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const createdInstructorReview = await orchestrator.createReview({
        reviewer_user_id: createdUserInstructor2.id,
        reviewed_user_id: createdUserStudent.id,
        appointment_id: createdStudentAppointment.id,
        context: "appointment",
        rating: 4,
        comment: "A aula foi muito boa!",
      });
      expect(uuidVersion(createdInstructorReview.id)).toBe(4);

      const response = await fetch(`${webserver.origin}/api/v1/reviews/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObjectInstructor.token}`,
        },
        body: JSON.stringify({
          filters: {
            appointment_id: createdStudentAppointment.id,
          },
          sort: {
            created_at: "desc",
          },
          pagination: {
            page: 1,
            limit: 10,
          },
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

    test("Perfil `student` buscando avaliações por `appointment_id`", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedStudent =
        await orchestrator.activateUser(createdUserStudent);
      const sessionObjectStudent1 =
        await orchestrator.createSession(activatedStudent);
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        status: "completed",
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);
      expect(createdStudentAppointment.status).toBe("completed");

      const createdStudentReview1 = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: createdStudentAppointment.id,
        context: "appointment",
        rating: 4,
        comment: "A aula foi muito boa!",
      });
      expect(uuidVersion(createdStudentReview1.id)).toBe(4);

      const createdStudentReview2 = await orchestrator.createReview({
        reviewer_user_id: createdUserStudent.id,
        reviewed_user_id: createdUserInstructor.id,
        appointment_id: null,
        context: "general",
        rating: 4,
        comment: "Eu recomendo este instrutor para alunos com medo de dirigir.",
      });
      expect(uuidVersion(createdStudentReview2.id)).toBe(4);

      const createdInstructorReview1 = await orchestrator.createReview({
        reviewer_user_id: createdUserInstructor.id,
        reviewed_user_id: createdUserStudent.id,
        appointment_id: createdStudentAppointment.id,
        context: "appointment",
        rating: 4,
        comment: "A aula foi muito boa!",
      });
      expect(uuidVersion(createdInstructorReview1.id)).toBe(4);

      const response = await fetch(`${webserver.origin}/api/v1/reviews/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${sessionObjectStudent1.token}`,
        },
        body: JSON.stringify({
          filters: {
            appointment_id: createdStudentAppointment.id,
          },
          sort: {
            created_at: "desc",
          },
          pagination: {
            page: 1,
            limit: 10,
          },
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(200);
      expect(responseBody.total).toBe(2);

      responseBody.reviews.forEach((review) => {
        expect(review.appointment_id).toBe(createdStudentAppointment.id);
        expect(review.rating).toBe(4);
        expect(review.comment).toBe("A aula foi muito boa!");
      });
    });
  });
});
