import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/appointments/[appointment_id]", () => {
  describe("Usuário anônimo", () => {
    test("Com próprio `student_id` existente", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);

      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/${createdStudentAppointment.id}`,
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
        action: 'Verifique se o seu usuário possui a feature "read:session"',
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Usuário padrão", () => {
    test("Com próprio `student_id` existente e `appointment_id` existente", async () => {
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

      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/${createdStudentAppointment.id}`,
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
        status: "reserved",
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        id: createdStudentAppointment.id,
        day_of_week: createdStudentAppointment.day_of_week,
        class_category: createdStudentAppointment.class_category,
        duration_time: createdStudentAppointment.duration_time,
        starts_at: createdStudentAppointment.starts_at.toISOString(),
        ends_at: createdStudentAppointment.ends_at.toISOString(),
        price: createdStudentAppointment.price,
        observations: createdStudentAppointment.observations,
        reserved_at: createdStudentAppointment.reserved_at.toISOString(),
        updated_at: createdStudentAppointment.updated_at.toISOString(),
        confirmed_at: null,
        paid_at: null,
        completed_at: null,
        canceled_at: null,
        canceled_by: null,
        canceled_reason: null,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.starts_at)).not.toBeNaN();
      expect(Date.parse(responseBody.ends_at)).not.toBeNaN();
      expect(Date.parse(responseBody.reserved_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    });
  });
});
