import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("PATCH /api/v1/appointments/[appointment_id]", () => {
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
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(403);

      expect(responseBody).toEqual({
        action: 'Verifique se o seu usuário possui a feature "update:user"',
        message: "Você não possui permissão para executar esta ação.",
        name: "ForbiddenError",
        status_code: 403,
      });
    });
  });

  describe("Usuário padrão", () => {
    test("Com próprio `student_id` e `appointment_id` existentes, altera `starts_at` e `ends_at` válidos", async () => {
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

      const appointmentStartsAt = new Date();
      appointmentStartsAt.setHours(18, 30, 0, 0);

      const appointmentEndsAt = new Date(appointmentStartsAt);
      appointmentEndsAt.setHours(appointmentEndsAt.getHours() + 1);

      // alterando reserva para daqui a 2 dias
      appointmentStartsAt.setDate(appointmentStartsAt.getDate() + 2);
      appointmentEndsAt.setDate(appointmentEndsAt.getDate() + 2);
      const startsAtDayOfWeek = orchestrator.getDayOfWeek(appointmentStartsAt);

      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/${createdStudentAppointment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            starts_at: appointmentStartsAt,
            ends_at: appointmentEndsAt,
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody).toEqual({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        id: createdStudentAppointment.id,
        class_category: createdStudentAppointment.class_category,
        duration_time: createdStudentAppointment.duration_time,
        day_of_week: startsAtDayOfWeek,
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        price: createdStudentAppointment.price,
        observations: createdStudentAppointment.observations,
        status: createdStudentAppointment.status,
        reserved_at: createdStudentAppointment.reserved_at.toISOString(),
        updated_at: responseBody.updated_at,
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

      expect(responseBody.updated_at > responseBody.reserved_at).toBe(true);
    });

    test("Com próprio `instructor_id` e `appointment_id` existentes, altera `status` para 'pending_payment'", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);

      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/${createdStudentAppointment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: "pending_payment",
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody).toEqual({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        id: createdStudentAppointment.id,
        class_category: createdStudentAppointment.class_category,
        duration_time: createdStudentAppointment.duration_time,
        day_of_week: createdStudentAppointment.day_of_week,
        starts_at: createdStudentAppointment.starts_at.toISOString(),
        ends_at: createdStudentAppointment.ends_at.toISOString(),
        price: createdStudentAppointment.price,
        observations: createdStudentAppointment.observations,
        status: "pending_payment",
        reserved_at: createdStudentAppointment.reserved_at.toISOString(),
        updated_at: responseBody.updated_at,
        confirmed_at: responseBody.confirmed_at,
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
      expect(Date.parse(responseBody.confirmed_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.reserved_at).toBe(true);
    });

    test("Com próprio `student_id` e `appointment_id` existentes, altera `status` para 'booked'", async () => {
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
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: "booked",
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody).toEqual({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        id: createdStudentAppointment.id,
        class_category: createdStudentAppointment.class_category,
        duration_time: createdStudentAppointment.duration_time,
        day_of_week: createdStudentAppointment.day_of_week,
        starts_at: createdStudentAppointment.starts_at.toISOString(),
        ends_at: createdStudentAppointment.ends_at.toISOString(),
        price: createdStudentAppointment.price,
        observations: createdStudentAppointment.observations,
        status: "booked",
        reserved_at: createdStudentAppointment.reserved_at.toISOString(),
        updated_at: responseBody.updated_at,
        confirmed_at: null,
        paid_at: responseBody.paid_at,
        completed_at: null,
        canceled_at: null,
        canceled_by: null,
        canceled_reason: null,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.starts_at)).not.toBeNaN();
      expect(Date.parse(responseBody.ends_at)).not.toBeNaN();
      expect(Date.parse(responseBody.reserved_at)).not.toBeNaN();
      expect(Date.parse(responseBody.paid_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.reserved_at).toBe(true);
    });

    test("Com próprio `instructor_id` e `appointment_id` existentes, altera `status` para 'completed'", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);

      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/${createdStudentAppointment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: "completed",
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody).toEqual({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        id: createdStudentAppointment.id,
        class_category: createdStudentAppointment.class_category,
        duration_time: createdStudentAppointment.duration_time,
        day_of_week: createdStudentAppointment.day_of_week,
        starts_at: createdStudentAppointment.starts_at.toISOString(),
        ends_at: createdStudentAppointment.ends_at.toISOString(),
        price: createdStudentAppointment.price,
        observations: createdStudentAppointment.observations,
        status: "completed",
        reserved_at: createdStudentAppointment.reserved_at.toISOString(),
        updated_at: responseBody.updated_at,
        confirmed_at: null,
        paid_at: null,
        completed_at: responseBody.completed_at,
        canceled_at: null,
        canceled_by: null,
        canceled_reason: null,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.starts_at)).not.toBeNaN();
      expect(Date.parse(responseBody.ends_at)).not.toBeNaN();
      expect(Date.parse(responseBody.reserved_at)).not.toBeNaN();
      expect(Date.parse(responseBody.completed_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.reserved_at).toBe(true);
    });

    test("Com próprio `student_id` e `appointment_id` existentes, altera `status` para 'canceled' com motivo", async () => {
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
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: "canceled",
            canceled_reason: `Motivo para cancelamento feito pelo aluno ${createdUserStudent.id}`,
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody).toEqual({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        id: createdStudentAppointment.id,
        class_category: createdStudentAppointment.class_category,
        duration_time: createdStudentAppointment.duration_time,
        day_of_week: createdStudentAppointment.day_of_week,
        starts_at: createdStudentAppointment.starts_at.toISOString(),
        ends_at: createdStudentAppointment.ends_at.toISOString(),
        price: createdStudentAppointment.price,
        observations: createdStudentAppointment.observations,
        status: "canceled",
        reserved_at: createdStudentAppointment.reserved_at.toISOString(),
        updated_at: responseBody.updated_at,
        confirmed_at: null,
        paid_at: null,
        completed_at: null,
        canceled_at: responseBody.canceled_at,
        canceled_by: createdUserStudent.id,
        canceled_reason: `Motivo para cancelamento feito pelo aluno ${createdUserStudent.id}`,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.starts_at)).not.toBeNaN();
      expect(Date.parse(responseBody.ends_at)).not.toBeNaN();
      expect(Date.parse(responseBody.reserved_at)).not.toBeNaN();
      expect(Date.parse(responseBody.canceled_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.reserved_at).toBe(true);
    });

    test("Com próprio `instructor_id` e `appointment_id` existentes, altera `status` para 'canceled' com motivo", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });

      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedUser = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObject = await orchestrator.createSession(activatedUser);

      const createdStudentAppointment = await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
      });
      expect(uuidVersion(createdStudentAppointment.id)).toBe(4);

      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/${createdStudentAppointment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObject.token}`,
          },
          body: JSON.stringify({
            status: "canceled",
            canceled_reason: `Motivo para cancelamento feito pelo instrutor ${createdUserInstructor.id}`,
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody).toEqual({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        id: createdStudentAppointment.id,
        class_category: createdStudentAppointment.class_category,
        duration_time: createdStudentAppointment.duration_time,
        day_of_week: createdStudentAppointment.day_of_week,
        starts_at: createdStudentAppointment.starts_at.toISOString(),
        ends_at: createdStudentAppointment.ends_at.toISOString(),
        price: createdStudentAppointment.price,
        observations: createdStudentAppointment.observations,
        status: "canceled",
        reserved_at: createdStudentAppointment.reserved_at.toISOString(),
        updated_at: responseBody.updated_at,
        confirmed_at: null,
        paid_at: null,
        completed_at: null,
        canceled_at: responseBody.canceled_at,
        canceled_by: createdUserInstructor.id,
        canceled_reason: `Motivo para cancelamento feito pelo instrutor ${createdUserInstructor.id}`,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.starts_at)).not.toBeNaN();
      expect(Date.parse(responseBody.ends_at)).not.toBeNaN();
      expect(Date.parse(responseBody.reserved_at)).not.toBeNaN();
      expect(Date.parse(responseBody.canceled_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      expect(responseBody.updated_at > responseBody.reserved_at).toBe(true);
    });
  });
});
