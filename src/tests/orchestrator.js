import retry from "async-retry";
import { faker } from "@faker-js/faker";

import database from "infra/database.js";
import migrator from "models/migrator.js";
import user from "models/user.js";
import session from "models/session.js";
import activation from "models/activation.js";
import instructor from "models/instructor.js";
import appointment from "models/appointment.js";
import webserver from "infra/webserver.js";

const emailHttpUrl = `http://${process.env.EMAIL_HTTP_HOST}:${process.env.EMAIL_HTTP_PORT}`;

async function waitForAllServices() {
  process.stdout.write(
    `\n🟡 Aguardando todos os serviços ficarem disponíveis...\n\n`,
  );
  await waitForWebServer();
  await waitForEmailServer();

  async function waitForWebServer() {
    return retry(fetchStatusPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchStatusPage() {
      const response = await fetch(`${webserver.origin}/api/v1/status`);

      if (response.status !== 200) {
        throw Error();
      }
    }
  }

  async function waitForEmailServer() {
    return retry(fetchEmailPage, {
      retries: 100,
      maxTimeout: 1000,
    });

    async function fetchEmailPage() {
      const response = await fetch(emailHttpUrl);

      if (response.status !== 200) {
        throw Error();
      }
    }
  }
}

async function clearDatabase() {
  await database.query("drop schema public cascade; create schema public;");
}

async function runPendingMigrations() {
  await migrator.runPendingMigrations();
}

async function createUser(userObject) {
  return await user.create({
    fullname: userObject?.fullname || faker.person.fullName(),
    username:
      userObject?.username || faker.internet.username().replace(/[_.-]/g, ""),
    email: userObject?.email || faker.internet.email(),
    password: userObject?.password || "validpassword",
    status: userObject?.status || "pending_confirmation",
    role: userObject?.role || "user",
    cpf: userObject?.cpf || faker.string.numeric(11),
    birth_date: userObject?.birth_date || faker.date.past({ years: 31 }),
    phone: userObject?.phone || faker.phone.number({ style: "international" }),
    instructor_credential:
      userObject?.instructor_credential || faker.string.numeric(22),
    cnh: userObject?.cnh || faker.string.numeric(11),
    cnh_category: userObject?.cnh_category || "B",
    crv: userObject?.crv || faker.string.numeric(17),
  });
}

async function createSession(userObject) {
  return await session.create(userObject.id);
}

async function deleteAllEmails() {
  await fetch(`${emailHttpUrl}/messages`, {
    method: "DELETE",
  });
}

async function getLastEmail() {
  const emailListResponse = await fetch(`${emailHttpUrl}/messages`);
  const emailListBody = await emailListResponse.json();
  const lastEmailItem = emailListBody.pop();

  if (!lastEmailItem) {
    return null;
  }

  const emailTextResponse = await fetch(
    `${emailHttpUrl}/messages/${lastEmailItem.id}.plain`,
  );
  const emailTextBody = await emailTextResponse.text();

  lastEmailItem.text = emailTextBody;
  return lastEmailItem;
}

function extractUUID(text) {
  const match = text.match(/[0-9a-fA-F-]{36}/);
  return match ? match[0] : null;
}

async function activateUser(inactiveUser) {
  return await activation.activateUserByUserId(inactiveUser.id);
}

async function addFeaturesToUser(userObject, features) {
  const updatedUser = await user.addFeatures(userObject.id, features);
  return updatedUser;
}

async function createInstructorAvailability(availabilityObject) {
  const hours = faker.date.anytime().getHours();

  return await instructor.createAvailability({
    instructor_id: availabilityObject?.instructor_id || faker.string.uuid(),
    day_of_week:
      availabilityObject?.day_of_week ||
      faker.date.weekday().toLocaleLowerCase(),
    start_time: availabilityObject?.start_time || `${hours}:00`,
    end_time: availabilityObject?.end_time || `${hours}:50`,
    status: availabilityObject?.status || "open",
  });
}

async function createAppointment(appointmentObject) {
  const appointmentStartsAt = faker.date.anytime();
  appointmentStartsAt.setDate(appointmentStartsAt.getDate() + 5);
  appointmentStartsAt.setHours(appointmentStartsAt.getHours());
  appointmentStartsAt.setMinutes(0);
  appointmentStartsAt.setSeconds(0);
  appointmentStartsAt.setMilliseconds(0);

  const appointmentEndsAt = new Date(appointmentStartsAt);
  appointmentEndsAt.setHours(appointmentEndsAt.getHours() + 1);

  const hours = faker.date.anytime().getHours();

  const studentId = appointmentObject?.student_id || faker.string.uuid();
  return await appointment.create(studentId, {
    instructor_id: appointmentObject?.instructor_id || faker.string.uuid(),
    class_category: appointmentObject?.class_category || "B",
    duration_time: appointmentObject?.duration_time || `${hours}:00`,
    starts_at:
      appointmentObject?.starts_at || appointmentStartsAt.toISOString(),
    ends_at: appointmentObject?.ends_at || appointmentEndsAt.toISOString(),
    price: appointmentObject?.price || 100.0,
    observations: appointmentObject?.observations || "Aula de teste",
    status: appointmentObject?.status || "reserved",
  });
}

function getDayOfWeek(dateParam) {
  const newDate = new Date(dateParam);
  // Definindo hora para meia-noite para evitar problemas de fuso horário
  newDate.setHours(0, 0, 0, 0);
  const daysOfWeek = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return daysOfWeek[newDate.getDay()];
}

const orchestrator = {
  waitForAllServices,
  clearDatabase,
  runPendingMigrations,
  createUser,
  createSession,
  deleteAllEmails,
  getLastEmail,
  extractUUID,
  activateUser,
  addFeaturesToUser,
  createInstructorAvailability,
  createAppointment,
  getDayOfWeek,
};

export default orchestrator;
