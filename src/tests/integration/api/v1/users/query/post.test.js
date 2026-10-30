import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/users/query", () => {
  describe("Usuário anônimo", () => {
    test("Sem permissão para buscar usuários", async () => {
      const response = await fetch(`${webserver.origin}/api/v1/users/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
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
    test("Com dados válidos buscando `role: instructor` e `cnh_category: B`", async () => {
      const instructor1 = await orchestrator.createUser({
        role: "instructor",
        cnh_category: "B",
      });
      await orchestrator.activateUser(instructor1);

      const instructor2 = await orchestrator.createUser({
        role: "instructor",
        cnh_category: "A",
      });
      await orchestrator.activateUser(instructor2);

      const instructor3 = await orchestrator.createUser({
        role: "instructor",
        cnh_category: "A",
      });
      await orchestrator.activateUser(instructor3);

      const instructor4 = await orchestrator.createUser({
        role: "instructor",
        cnh_category: "AB",
      });
      await orchestrator.activateUser(instructor4);

      const instructor5 = await orchestrator.createUser({
        role: "instructor",
        cnh_category: "B",
      });
      await orchestrator.activateUser(instructor5);

      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1SessionObject = await orchestrator.createSession(user1);
      const response = await fetch(`${webserver.origin}/api/v1/users/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1SessionObject.token}`,
        },
        body: JSON.stringify({
          filters: {
            role: "instructor",
            cnh_category: "B",
          },
          sort: [{ fullname: "asc" }, { birth_date: "desc" }],
          pagination: { page: 1, limit: 20 },
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody.total).toBe(3);

      responseBody.users.forEach((user) => {
        expect(user.status).toBe("active");
        expect(user.role).toBe("instructor");
        expect(user.cnh_category).toContain("B");
      });
    });

    test("Com dados válidos buscando `role: instructor` e `fullname: 'JóÀõ'`", async () => {
      const instructor1 = await orchestrator.createUser({
        role: "instructor",
        cnh_category: "B",
        fullname: "João Luiz Castro",
      });
      await orchestrator.activateUser(instructor1);

      const instructor2 = await orchestrator.createUser({
        role: "instructor",
        cnh_category: "A",
        fullname: "Maria João de Souza",
      });
      await orchestrator.activateUser(instructor2);

      const instructor3 = await orchestrator.createUser({
        role: "instructor",
        cnh_category: "A",
        fullname: "Carlos Santos",
      });
      await orchestrator.activateUser(instructor3);

      const instructor4 = await orchestrator.createUser({
        role: "instructor",
        cnh_category: "B",
        fullname: "João Almeida",
      });
      await orchestrator.activateUser(instructor4);

      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1SessionObject = await orchestrator.createSession(user1);
      const response = await fetch(`${webserver.origin}/api/v1/users/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1SessionObject.token}`,
        },
        body: JSON.stringify({
          filters: {
            role: "instructor",
            fullname: "JóÀõ",
          },
          sort: [{ fullname: "asc" }, { birth_date: "desc" }],
          pagination: { page: 1, limit: 20 },
        }),
      });

      const responseBody = await response.json();
      expect(response.status).toBe(200);

      expect(responseBody.total).toBe(3);

      responseBody.users.forEach((user) => {
        expect(user.status).toBe("active");
        expect(user.role).toBe("instructor");
        expect(user.fullname.toLowerCase()).toContain("joão");
      });
    });

    test("Com dados válidos buscando `role: student` e `fullname`: 'SíLVã'", async () => {
      const student1 = await orchestrator.createUser({
        role: "student",
        cnh_category: "B",
        fullname: "José da Silva",
      });
      await orchestrator.activateUser(student1);

      const student2 = await orchestrator.createUser({
        role: "student",
        cnh_category: "A",
        fullname: "Maria Oliveira Silva",
      });
      await orchestrator.activateUser(student2);

      const student3 = await orchestrator.createUser({
        role: "student",
        cnh_category: "A",
        fullname: "Silvia Seixas",
      });
      await orchestrator.activateUser(student3);

      const student4 = await orchestrator.createUser({
        role: "student",
        cnh_category: "A",
        fullname: "Silvana Almeida Costa",
      });
      await orchestrator.activateUser(student4);

      const user1 = await orchestrator.createUser();
      await orchestrator.activateUser(user1);
      const user1SessionObject = await orchestrator.createSession(user1);
      const response = await fetch(`${webserver.origin}/api/v1/users/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `session_id=${user1SessionObject.token}`,
        },
        body: JSON.stringify({
          filters: {
            role: "student",
            fullname: "SíLVã",
          },
          sort: [{ fullname: "asc" }, { username: "desc" }],
          pagination: { page: 1, limit: 20 },
        }),
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();
      expect(responseBody.total).toBe(3);

      responseBody.users.forEach((user) => {
        expect(user.status).toBe("active");
        expect(user.role).toBe("student");
        expect(user.fullname.toLowerCase()).toContain("silva");
      });
    });
  });
});
