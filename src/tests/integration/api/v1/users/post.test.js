import { version as uuidVersion } from "uuid";
import orchestrator from "tests/orchestrator.js";
import user from "models/user.js";
import password from "models/password.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users", () => {
  describe("Usuário anônimo", () => {
    test("Com dados únicos e válidos", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "maverick",
          email: "contato@conduzindoparaofuturo.com.br",
          password: "senha123",
          fullname: "Tom Cruzeiro",
          status: "pending_confirmation",
          role: "user",
          cpf: "12345678900",
          birth_date: "1994-07-17T00:00:00.000Z",
          phone: "+55 11 91234-5678",
          instructor_credential: "1234567890123456789012",
          cnh: "12345678901",
          cnh_category: "B",
          crv: "12345678901234567",
        }),
      });

      expect(response.status).toBe(201);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        id: responseBody.id,
        username: "maverick",
        features: ["read:activation_token"],
        created_at: responseBody.created_at,
        updated_at: responseBody.updated_at,
      });

      expect(uuidVersion(responseBody.id)).toBe(4);
      expect(Date.parse(responseBody.created_at)).not.toBeNaN();
      expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

      const userInDatabase = await user.findOneByUsername("maverick");
      const correctPasswordMatch = await password.compare(
        "senha123",
        userInDatabase.password,
      );

      const incorrectPasswordMatch = await password.compare(
        "SenhaErrada",
        userInDatabase.password,
      );

      expect(correctPasswordMatch).toBe(true);
      expect(incorrectPasswordMatch).toBe(false);
    });

    test("Com `email` duplicado", async () => {
      const response1 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado1",
          email: "duplicado@conduzindoparaofuturo.com.br",
          password: "senha123",
          fullname: "Tom Cruzeiro",
          status: "pending_confirmation",
          role: "user",
          cpf: "12345678911",
          birth_date: "1994-07-17T00:00:00.000Z",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "emailduplicado2",
          email: "Duplicado@conduzindoparaofuturo.com.br",
          password: "senha123",
          fullname: "Tom Cruzeiro",
          status: "pending_confirmation",
          role: "user",
          cpf: "12345678912",
          birth_date: "1994-07-17T00:00:00.000Z",
        }),
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O email informado já está sendo utilizado.",
        action: "Utilize outro email para realizar esta operação.",
        status_code: 400,
      });
    });

    test("Com `username` duplicado", async () => {
      const response1 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "usernameduplicado",
          email: "usernameduplicado1@conduzindoparaofuturo.com.br",
          password: "senha123",
          fullname: "Tom Cruzeiro",
          status: "pending_confirmation",
          role: "user",
          cpf: "12345678921",
          birth_date: "1994-07-17T00:00:00.000Z",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "UsernameDuplicado",
          email: "usernameduplicado2@conduzindoparaofuturo.com.br",
          password: "senha123",
          fullname: "Tom Cruzeiro",
          status: "pending_confirmation",
          role: "user",
          cpf: "12345678922",
          birth_date: "1994-07-17T00:00:00.000Z",
        }),
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O username informado já está sendo utilizado.",
        action: "Utilize outro username para realizar esta operação.",
        status_code: 400,
      });
    });

    test("Com `cpf` duplicado", async () => {
      const response1 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname: "CPF Duplicado",
          username: "cpfduplicado",
          email: "cpfduplicado1@aeropratica.club",
          password: "senha123",
          status: "pending_confirmation",
          role: "user",
          cpf: "12345678931",
          birth_date: "1994-07-17T00:00:00.000Z",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname: "CPF Duplicado 2",
          username: "cpfduplicado2",
          email: "cpfduplicado2@aeropratica.club",
          password: "senha123",
          status: "pending_confirmation",
          role: "user",
          cpf: "12345678931",
          birth_date: "1994-07-17T00:00:00.000Z",
        }),
      });

      expect(response2.status).toBe(400);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        name: "ValidationError",
        message: "O CPF informado já está sendo utilizado.",
        action: "Utilize outro CPF para realizar esta operação.",
        status_code: 400,
      });
    });

    test("Com `role` inválido", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname: "Trainador",
          username: "trainer",
          email: "treinador@aeropratica.club",
          password: "senha123",
          role: "trainer",
          status: "pending_confirmation",
          cpf: "12345678941",
          birth_date: "1994-07-17T00:00:00.000Z",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "O papel de usuário informado é inválido.",
        action: "Utilize um dos papéis de usuário válidos.",
        status_code: 400,
      });
    });

    test("Com `cnh_category` inválido", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullname: "Trainador",
          username: "trainer",
          email: "treinador@aeropratica.club",
          password: "senha123",
          role: "instructor",
          status: "pending_confirmation",
          cpf: "12345678941",
          birth_date: "1994-07-17T00:00:00.000Z",
          cnh_category: "D",
        }),
      });

      expect(response.status).toBe(400);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ValidationError",
        message: "A categoria da CNH informada é inválida.",
        action: "Utilize uma das categorias de CNH válidas (A, B, AB).",
        status_code: 400,
      });
    });
  });

  describe("Usuário padrão", () => {
    test("Com dados únicos e válidos", async () => {
      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1SessionObject = await orchestrator.createSession(user1);

      const user2Response = await fetch(`${webserver.origin}/api/v1/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1SessionObject.token}`,
        },
        body: JSON.stringify({
          username: "usuariologado",
          email: "usuariologado@conduzindoparaofuturo.com.br",
          password: "senha123",
          fullname: "Tom Cruzeiro",
          status: "pending_confirmation",
          role: "user",
          cpf: "12345678991",
          birth_date: "1994-07-17T00:00:00.000Z",
        }),
      });

      expect(user2Response.status).toBe(403);

      const user2ResponseBody = await user2Response.json();

      expect(user2ResponseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não possui permissão para executar esta ação.",
        action: 'Verifique se o seu usuário possui a feature "create:user"',
        status_code: 403,
      });
    });
  });
});
