import email from "infra/email.js";
import orchestrator from "tests/orchestrator.js";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("infra/email.js", () => {
  test("Enviando email com `send()`", async () => {
    await orchestrator.deleteAllEmails();

    await email.send({
      from: "Conduzindo Para O Futuro <contato@conduzindoparaofuturo.com.br>",
      to: "contato@conduzindoparaofuturo.com.br",
      subject: "Teste de assunto",
      text: "Teste de corpo.",
    });

    await email.send({
      from: "Conduzindo Para O Futuro <contato@conduzindoparaofuturo.com.br>",
      to: "contato@conduzindoparaofuturo.com.br",
      subject: "Último email enviado",
      text: "Corpo do último email.",
    });

    const lastEmail = await orchestrator.getLastEmail();
    expect(lastEmail.sender).toBe("<contato@conduzindoparaofuturo.com.br>");
    expect(lastEmail.recipients[0]).toBe("<contato@conduzindoparaofuturo.com.br>");
    expect(lastEmail.subject).toBe("Último email enviado");
    expect(lastEmail.text).toBe("Corpo do último email.\r\n");
  });
});
