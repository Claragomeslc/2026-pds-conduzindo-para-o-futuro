import user from "models/user.js";
import activation from "models/activation.js";
import orchestrator from "tests/orchestrator.js";
import webserver from "infra/webserver.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Caso de uso: Fluxo de registro (completo com sucesso)", () => {
  let createUserResponseBody;
  let activationTokenId;
  let createSessionsResponseBody;

  test("Criar conta de usuário", async () => {
    const createUserResponse = await fetch(`${webserver.origin}/api/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "FluxoDeRegistro",
        email: "fluxo.de.registro@conduzindoparaofuturo.com.br",
        password: "FluxoDeRegistroPassword",
      }),
    });

    expect(createUserResponse.status).toBe(201);

    createUserResponseBody = await createUserResponse.json();

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "FluxoDeRegistro",
      features: ["read:activation_token"],
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });
  });

  test("Receber email de ativação", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail.sender).toBe("<contato@conduzindoparaofuturo.com.br>");
    expect(lastEmail.recipients[0]).toBe(
      "<fluxo.de.registro@conduzindoparaofuturo.com.br>",
    );
    expect(lastEmail.subject).toBe(
      "Ative sua conta no Conduzindo Para O Futuro!",
    );
    expect(lastEmail.text).toContain("FluxoDeRegistro");

    activationTokenId = orchestrator.extractUUID(lastEmail.text);

    expect(lastEmail.text).toContain(
      `${webserver.origin}/cadastro/ativar/${activationTokenId}`,
    );

    const activationTokenObject =
      await activation.findOneValidById(activationTokenId);

    expect(activationTokenObject.user_id).toBe(createUserResponseBody.id);
    expect(activationTokenObject.used_at).toBe(null);
  });

  test("Ativar conta", async () => {
    const activationResponse = await fetch(
      `${webserver.origin}/api/v1/activations/${activationTokenId}`,
      {
        method: "PATCH",
      },
    );

    expect(activationResponse.status).toBe(200);

    const activationResponseBody = await activationResponse.json();

    expect(Date.parse(activationResponseBody.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername("FluxoDeRegistro");
    expect(activatedUser.features).toEqual([
      "create:session",
      "read:session",
      "update:user",
    ]);
  });

  test("Login", async () => {
    const createSessionsResponse = await fetch(
      `${webserver.origin}/api/v1/sessions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: "fluxo.de.registro@conduzindoparaofuturo.com.br",
          password: "FluxoDeRegistroPassword",
        }),
      },
    );

    expect(createSessionsResponse.status).toBe(201);

    createSessionsResponseBody = await createSessionsResponse.json();

    expect(createSessionsResponseBody.user_id).toBe(createUserResponseBody.id);
  });

  test("Obter informações do usuário", async () => {
    const userResponse = await fetch(`${webserver.origin}/api/v1/user`, {
      headers: {
        cookie: `session_id=${createSessionsResponseBody.token}`,
      },
    });

    expect(userResponse.status).toBe(200);

    const userResponseBody = await userResponse.json();

    expect(userResponseBody.id).toBe(createUserResponseBody.id);
  });
});
