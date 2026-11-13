import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/appointments/query", () => {
  describe("Usuário anônimo", () => {
    test("Sem permissão para buscar agendamentos de `instructor`", async () => {
      const createdUser = await orchestrator.createUser({
        role: "instructor",
      });
      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instructor_id: createdUser.id,
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "read:session"',
        status_code: 403,
      });
    });

    test("Sem permissão para buscar agendamentos de `student`", async () => {
      const createdUser = await orchestrator.createUser({
        role: "student",
      });
      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instructor_id: createdUser.id,
          }),
        },
      );

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
    test("Perfil `student` buscando agendamento de `student` diferente", async () => {
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

      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObjectStudent1.token}`,
          },
          body: JSON.stringify({
            filters: {
              student_id: createdUserStudent2.id,
            },
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message:
          "Você não possui permissão para buscar agendamentos de outro aluno.",
        action:
          "Verifique se você possui a feature necessária para buscar esses agendamentos.",
        status_code: 403,
      });
    });

    test("Perfil `instructor` buscando agendamento de `instructor` diferente", async () => {
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

      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObjectInstructor1.token}`,
          },
          body: JSON.stringify({
            filters: {
              instructor_id: createdUserInstructor2.id,
            },
          }),
        },
      );

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message:
          "Você não possui permissão para buscar agendamentos de outro instrutor.",
        action:
          "Verifique se você possui a feature necessária para buscar esses agendamentos.",
        status_code: 403,
      });
    });

    test("Perfil `student` com 4 agendamentos válidos e `instructor` diferente, buscar 2 nos próximos 2 dias", async () => {
      const createdUserStudent = await orchestrator.createUser({
        role: "student",
      });
      const activatedStudent =
        await orchestrator.activateUser(createdUserStudent);
      const sessionObjectStudent =
        await orchestrator.createSession(activatedStudent);

      const createdUserInstructor1 = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor1);

      const appointmentStartsAt = new Date();
      appointmentStartsAt.setHours(18, 30, 0, 0);

      const appointmentEndsAt = new Date(appointmentStartsAt);
      appointmentEndsAt.setHours(appointmentEndsAt.getHours() + 1);

      // reservando o primeiro agendamento para hoje
      await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor1.id,
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        observations: "Aula de teste 1",
      });

      // reservando o segundo agendamento para daqui a 1 dia
      appointmentStartsAt.setDate(appointmentStartsAt.getDate() + 1);
      appointmentEndsAt.setDate(appointmentEndsAt.getDate() + 1);

      await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor1.id,
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        observations: "Aula de teste 2",
      });

      // reservando o terceiro agendamento para daqui a 2 dias
      appointmentStartsAt.setDate(appointmentStartsAt.getDate() + 1);
      appointmentEndsAt.setDate(appointmentEndsAt.getDate() + 1);

      const createdUserInstructor2 = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor2);

      await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor2.id,
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        observations: "Aula de teste 3",
      });

      // reservando o quarto agendamento para daqui a 3 dias
      appointmentStartsAt.setDate(appointmentStartsAt.getDate() + 1);
      appointmentEndsAt.setDate(appointmentEndsAt.getDate() + 1);

      await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor2.id,
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        observations: "Aula de teste 4",
      });

      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObjectStudent.token}`,
          },
          body: JSON.stringify({
            filters: {
              starts_at: {
                from: new Date(
                  new Date().setDate(new Date().getDate() + 1),
                ).toISOString(),
                to: new Date(
                  new Date().setDate(new Date().getDate() + 2),
                ).toISOString(),
              },
            },
            sort: {
              starts_at: "asc",
            },
            pagination: {
              page: 1,
              limit: 10,
            },
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody.total).toBe(2);

      let count = 1;
      responseBody.appointments.forEach((appointment) => {
        count++;
        expect(appointment.student_id).toBe(createdUserStudent.id);
        let createdUserInstructorId = appointment.instructor_id;
        if (count === 2) {
          createdUserInstructorId = createdUserInstructor1.id;
        } else if (count === 3) {
          createdUserInstructorId = createdUserInstructor2.id;
        }
        expect(appointment.instructor_id).toBe(createdUserInstructorId);
        expect(appointment.status).toBe("reserved");
        expect(appointment.observations).toBe(`Aula de teste ${count}`);
      });
    });

    test("Perfil `student` com 2 agendamentos válidos e mesmo `instructor`, buscar 1 agendamento `status: booked`", async () => {
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
      await orchestrator.activateUser(createdUserInstructor);

      const appointmentStartsAt = new Date();
      appointmentStartsAt.setHours(18, 30, 0, 0);

      const appointmentEndsAt = new Date(appointmentStartsAt);
      appointmentEndsAt.setHours(appointmentEndsAt.getHours() + 1);

      // reservando o primeiro agendamento para daqui a 1 dia
      appointmentStartsAt.setDate(appointmentStartsAt.getDate() + 1);
      appointmentEndsAt.setDate(appointmentEndsAt.getDate() + 1);

      await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        observations: "Aula de teste 1",
      });

      // reservando o segundo agendamento para daqui a 3 dias
      appointmentStartsAt.setDate(appointmentStartsAt.getDate() + 2);
      appointmentEndsAt.setDate(appointmentEndsAt.getDate() + 2);

      await orchestrator.createAppointment({
        student_id: createdUserStudent.id,
        instructor_id: createdUserInstructor.id,
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        observations: "Aula de teste 2",
        status: "booked",
      });

      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObjectStudent.token}`,
          },
          body: JSON.stringify({
            filters: {
              status: "booked",
              starts_at: {
                from: new Date().toISOString(),
              },
            },
            sort: {
              starts_at: "asc",
            },
            pagination: {
              page: 1,
              limit: 10,
            },
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody.total).toBe(1);

      responseBody.appointments.forEach((appointment) => {
        expect(appointment.student_id).toBe(createdUserStudent.id);
        expect(appointment.instructor_id).toBe(createdUserInstructor.id);
        expect(appointment.observations).toBe("Aula de teste 2");
        expect(appointment.status).toBe("booked");
      });
    });

    test("Perfil `instructor` com 2 agendamentos válidos e `student` diferente, buscar os 2", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedInstructor = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObjectInstructor =
        await orchestrator.createSession(activatedInstructor);

      const createdUserStudent1 = await orchestrator.createUser({
        role: "student",
      });
      await orchestrator.activateUser(createdUserStudent1);

      const appointmentStartsAt = new Date();
      appointmentStartsAt.setHours(15, 0, 0, 0);

      const appointmentEndsAt = new Date();
      appointmentEndsAt.setHours(16, 0, 0, 0);

      await orchestrator.createAppointment({
        instructor_id: createdUserInstructor.id,
        student_id: createdUserStudent1.id,
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        observations: "Aula de teste 1",
      });

      const createdUserStudent2 = await orchestrator.createUser({
        role: "student",
      });
      await orchestrator.activateUser(createdUserStudent2);

      // reservando para o próximo dia
      appointmentStartsAt.setDate(appointmentStartsAt.getDate() + 1);
      appointmentEndsAt.setDate(appointmentEndsAt.getDate() + 1);

      await orchestrator.createAppointment({
        instructor_id: createdUserInstructor.id,
        student_id: createdUserStudent2.id,
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        observations: "Aula de teste 2",
      });

      const createdUserInstructor2 = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor2);

      await orchestrator.createAppointment({
        instructor_id: createdUserInstructor2.id,
        student_id: createdUserStudent1.id,
        starts_at: appointmentStartsAt.toISOString(),
        ends_at: appointmentEndsAt.toISOString(),
        observations: "Aula de teste 3",
      });

      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObjectInstructor.token}`,
          },
          body: JSON.stringify({
            filters: {},
            sort: {
              starts_at: "asc",
            },
            pagination: {
              page: 1,
              limit: 10,
            },
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody.total).toBe(2);

      let count = 0;
      responseBody.appointments.forEach((appointment) => {
        count++;
        expect(appointment.instructor_id).toBe(createdUserInstructor.id);
        expect(appointment.status).toBe("reserved");
        expect(appointment.observations).toBe(`Aula de teste ${count}`);
      });
    });

    test("Perfil `instructor` com 2 agendamentos válidos e `student` diferente, buscar 1 por `student`", async () => {
      const createdUserInstructor = await orchestrator.createUser({
        role: "instructor",
      });
      const activatedInstructor = await orchestrator.activateUser(
        createdUserInstructor,
      );
      const sessionObjectInstructor =
        await orchestrator.createSession(activatedInstructor);

      const createdUserStudent1 = await orchestrator.createUser({
        role: "student",
      });
      await orchestrator.activateUser(createdUserStudent1);

      await orchestrator.createAppointment({
        instructor_id: createdUserInstructor.id,
        student_id: createdUserStudent1.id,
        observations: "Aula de teste 1",
      });

      const createdUserStudent2 = await orchestrator.createUser({
        role: "student",
      });
      await orchestrator.activateUser(createdUserStudent2);

      await orchestrator.createAppointment({
        instructor_id: createdUserInstructor.id,
        student_id: createdUserStudent2.id,
        observations: "Aula de teste 2",
      });

      const createdUserInstructor2 = await orchestrator.createUser({
        role: "instructor",
      });
      await orchestrator.activateUser(createdUserInstructor2);

      await orchestrator.createAppointment({
        instructor_id: createdUserInstructor2.id,
        student_id: createdUserStudent1.id,
        observations: "Aula de teste 3",
      });

      const response = await fetch(
        `${webserver.origin}/api/v1/appointments/query`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: `session_id=${sessionObjectInstructor.token}`,
          },
          body: JSON.stringify({
            filters: {
              student_id: createdUserStudent1.id,
            },
          }),
        },
      );

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody.total).toBe(1);

      responseBody.appointments.forEach((appointment) => {
        expect(appointment.instructor_id).toBe(createdUserInstructor.id);
        expect(appointment.student_id).toBe(createdUserStudent1.id);
        expect(appointment.status).toBe("reserved");
        expect(appointment.observations).toBe("Aula de teste 1");
      });
    });
  });
});
