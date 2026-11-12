import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("Caso de uso: Fluxo de agendamento e realização da aula (completo com sucesso)", () => {

  let createdUserInstructor;
  let createdUserInstructorSession;
  let createdUserStudent;
  let createdUserStudentSession;
  let createdInstructorAvailability;
  let createdAppointment;

  test("Criar conta de usuário instrutor e fazer login", async () => {
    
    createdUserInstructor = await orchestrator.createUser({
      role: "instructor",
      cnh_category: "B",
    });
    expect(createdUserInstructor.role).toBe("instructor");

    const activatedUser = await orchestrator.activateUser(createdUserInstructor);
    createdUserInstructorSession = await orchestrator.createSession(activatedUser);
    
    expect(createdUserInstructorSession.user_id).toBe(createdUserInstructor.id);
  });

  test("Criar conta de usuário aluno e fazer login", async () => {
    
    createdUserStudent = await orchestrator.createUser({
      role: "student",
    });
    expect(createdUserStudent.role).toBe("student");

    const activatedUser = await orchestrator.activateUser(createdUserStudent);
    createdUserStudentSession = await orchestrator.createSession(activatedUser);

    expect(createdUserStudentSession.user_id).toBe(createdUserStudent.id);
  });

  test("Criar disponibilidade para agendamentos do instrutor", async () => {
    
     const response = await fetch(
        `${webserver.origin}/api/v1/instructors/${createdUserInstructor.username}/availabilities`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${createdUserInstructorSession.token}`,
          },
          body: JSON.stringify({
            instructor_id: createdUserInstructor.id,
            day_of_week: "saturday",
            start_time: "10:00",
            end_time: "10:50",
          }),
        },
      );

      expect(response.status).toBe(201);

      createdInstructorAvailability = await response.json();

      expect(createdInstructorAvailability).toEqual({
        id: createdInstructorAvailability.id,
        instructor_id: createdUserInstructor.id,
        day_of_week: "saturday",
        start_time: "10:00:00",
        end_time: "10:50:00",
        status: "open",
        created_at: createdInstructorAvailability.created_at,
        updated_at: createdInstructorAvailability.updated_at,
      });
  });

  test("Aluno reserva agendamento de aula com o instrutor", async () => {
    const nextDay = 
      orchestrator.getNextDayByDayOfWeek(createdInstructorAvailability.day_of_week);
    const startTime = createdInstructorAvailability.start_time;
    const endTime = createdInstructorAvailability.end_time;

    const fullDateString = nextDay.toISOString().split("T")[0];
    const appointmentStartsAt = new Date(`${fullDateString}T${startTime}Z`);
    const appointmentEndsAt = new Date(`${fullDateString}T${endTime}Z`);

    const diffInMs = Math.abs(appointmentEndsAt - appointmentStartsAt);
    const decimalHours = diffInMs / 3600000;
    const durationTime = new Date(0,0);
    durationTime.setMinutes(+Math.round(decimalHours * 60)); 
    const durationTimeString = `0${durationTime.getHours()}:${durationTime.getMinutes()}`;

    const response = await fetch(`${webserver.origin}/api/v1/appointments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session_id=${createdUserStudentSession.token}`,
      },
      body: JSON.stringify({
        instructor_id: createdUserInstructor.id,
        class_category: createdUserInstructor.cnh_category,
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        duration_time: durationTimeString,
        price: 180.0,
        observations: "Aula do teste de fluxo completo",
      }),
    });
    
    expect(response.status).toBe(201);
    createdAppointment = await response.json();

    expect(createdAppointment).toEqual({
      id: createdAppointment.id,
      student_id: createdUserStudent.id,
      instructor_id: createdUserInstructor.id,
      day_of_week: createdInstructorAvailability.day_of_week,
      class_category: createdUserInstructor.cnh_category,
      duration_time: `${durationTimeString}:00`,
      starts_at: appointmentStartsAt.toISOString(),
      ends_at: appointmentEndsAt.toISOString(),
      price: "180.00",
      observations: "Aula do teste de fluxo completo",
      status: "reserved",
      reserved_at: createdAppointment.reserved_at,
      confirmed_at: null,
      paid_at: null,
      completed_at: null,
      canceled_at: null,
      canceled_by: null,
      canceled_reason: null,
      updated_at: createdAppointment.updated_at,
    });

    expect(uuidVersion(createdAppointment.id)).toBe(4);
    expect(Date.parse(createdAppointment.reserved_at)).not.toBeNaN();
    expect(Date.parse(createdAppointment.updated_at)).not.toBeNaN();
    expect(createdAppointment.starts_at > createdAppointment.reserved_at).toBe(true);
  });
  
  test("Instrutor confirma agendamento de aula com o aluno e aguarda o pagamento", async () => {
    const response = await fetch(
      `${webserver.origin}/api/v1/appointments/${createdAppointment.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${createdUserInstructorSession.token}`,
        },
        body: JSON.stringify({
          status: "pending_payment",
        }),
      },
    );

    const responseBody  = await response.json();
    expect(response.status).toBe(200);

    expect(responseBody).toEqual({
      id: createdAppointment.id,
      student_id: createdUserStudent.id,
      instructor_id: createdUserInstructor.id,
      day_of_week: createdInstructorAvailability.day_of_week,
      class_category: createdUserInstructor.cnh_category,
      duration_time: createdAppointment.duration_time,
      starts_at: createdAppointment.starts_at,
      ends_at: createdAppointment.ends_at,
      price: createdAppointment.price,
      observations: createdAppointment.observations,
      status: "pending_payment",
      reserved_at: createdAppointment.reserved_at,
      confirmed_at: responseBody.confirmed_at,
      paid_at: null,
      completed_at: null,
      canceled_at: null,
      canceled_by: null,
      canceled_reason: null,
      updated_at: responseBody.updated_at,
    });

    createdAppointment = responseBody;

    expect(Date.parse(responseBody.reserved_at)).not.toBeNaN();
    expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    expect(responseBody.confirmed_at > responseBody.reserved_at).toBe(true);
  });

  test("Aluno realiza o pagamento e tem a aula agendada com o instrutor", async () => {
    const response = await fetch(
      `${webserver.origin}/api/v1/appointments/${createdAppointment.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${createdUserStudentSession.token}`,
        },
        body: JSON.stringify({
          status: "booked",
        }),
      },
    );

    const responseBody  = await response.json();
    expect(response.status).toBe(200);

    expect(responseBody).toEqual({
      id: createdAppointment.id,
      student_id: createdUserStudent.id,
      instructor_id: createdUserInstructor.id,
      day_of_week: createdInstructorAvailability.day_of_week,
      class_category: createdUserInstructor.cnh_category,
      duration_time: createdAppointment.duration_time,
      starts_at: createdAppointment.starts_at,
      ends_at: createdAppointment.ends_at,
      price: createdAppointment.price,
      observations: createdAppointment.observations,
      status: "booked",
      reserved_at: createdAppointment.reserved_at,
      confirmed_at: createdAppointment.confirmed_at,
      paid_at: responseBody.paid_at,
      completed_at: null,
      canceled_at: null,
      canceled_by: null,
      canceled_reason: null,
      updated_at: responseBody.updated_at,
    });

    createdAppointment = responseBody;

    expect(Date.parse(createdAppointment.reserved_at)).not.toBeNaN();
    expect(Date.parse(createdAppointment.updated_at)).not.toBeNaN();
    expect(responseBody.paid_at > responseBody.confirmed_at).toBe(true);
  });

  test("Instrutor realiza a aula agendada com o aluno e altera status para concluído", async () => {
    const response = await fetch(
      `${webserver.origin}/api/v1/appointments/${createdAppointment.id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${createdUserStudentSession.token}`,
        },
        body: JSON.stringify({
          status: "completed",
        }),
      },
    );

    const responseBody  = await response.json();
    expect(response.status).toBe(200);

    expect(responseBody).toEqual({
      id: createdAppointment.id,
      student_id: createdUserStudent.id,
      instructor_id: createdUserInstructor.id,
      day_of_week: createdInstructorAvailability.day_of_week,
      class_category: createdUserInstructor.cnh_category,
      duration_time: createdAppointment.duration_time,
      starts_at: createdAppointment.starts_at,
      ends_at: createdAppointment.ends_at,
      price: createdAppointment.price,
      observations: createdAppointment.observations,
      status: "completed",
      reserved_at: createdAppointment.reserved_at,
      confirmed_at: createdAppointment.confirmed_at,
      paid_at: createdAppointment.paid_at,
      completed_at: responseBody.completed_at,
      canceled_at: null,
      canceled_by: null,
      canceled_reason: null,
      updated_at: responseBody.updated_at,
    });

    createdAppointment = responseBody;

    expect(Date.parse(responseBody.reserved_at)).not.toBeNaN();
    expect(Date.parse(responseBody.updated_at)).not.toBeNaN();
    expect(responseBody.completed_at > responseBody.paid_at).toBe(true);
  });

});
