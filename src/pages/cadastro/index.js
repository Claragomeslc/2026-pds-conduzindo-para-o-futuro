import { useState } from "react";
import AuthLayout from "interface/AuthLayout";
import {
  Checkbox,
  Field,
  Form,
  RoleSelector,
  Section,
  SubmitButton,
  TextButton,
  icons,
} from "interface/AuthLayout/form";

export default function RegisterPage() {
  return (
    <AuthLayout
      mode="signup"
      metadata={{
        title: "Cadastre-se",
        description: "Crie sua conta gratuitamente",
      }}
    >
      <RegisterForm />
    </AuthLayout>
  );
}

function RegisterForm() {
  const [role, setRole] = useState("student");

  // Tela apenas visual: o envio do formulário ainda não está conectado à API.
  function handleSubmit(event) {
    event.preventDefault();
  }

  const isInstructor = role === "instructor";

  return (
    <>
      <RoleSelector value={role} onChange={setRole} />

      <Form onSubmit={handleSubmit}>
        <Field
          label="Nome completo"
          name="name"
          placeholder="Como podemos te chamar?"
          autoComplete="name"
          icon={icons.person}
        />
        <Field
          label="Nome de usuário"
          name="username"
          placeholder="Ex.: maria.silva"
          autoComplete="username"
          icon={icons.person}
        />
        <Field
          label="E-mail"
          name="email"
          type="email"
          placeholder="voce@exemplo.com"
          autoComplete="email"
          icon={icons.email}
        />
        <Field
          label="Senha"
          name="password"
          type="password"
          placeholder="Mínimo de 8 caracteres"
          autoComplete="new-password"
          minLength={8}
          icon={icons.lock}
        />

        <Section
          title={isInstructor ? "Dados do instrutor" : "Dados pessoais"}
          hint="Usamos essas informações para validar seu perfil com segurança."
          icon={icons.clipboard}
        >
          <Field
            label="CPF"
            name="cpf"
            placeholder="000.000.000-00"
            icon={icons.document}
          />
          <Field
            label="Data de nascimento"
            name="birth_date"
            type="date"
            placeholder="dd/mm/aaaa"
            autoComplete="bday"
            icon={icons.calendar}
          />
          <Field
            label="Telefone"
            name="phone"
            type="tel"
            placeholder="(00) 00000-0000"
            autoComplete="tel"
            icon={icons.phone}
          />
          {isInstructor && (
            <>
              <Field
                label="Credencial de instrutor"
                name="instructor_credential"
                placeholder="Número da credencial"
                icon={icons.badge}
              />
              <Field
                label="CNH"
                name="cnh"
                placeholder="Número da CNH"
                icon={icons.license}
              />
              <Field
                label="CRV"
                name="crv"
                placeholder="Número do CRV do veículo"
                icon={icons.car}
              />
            </>
          )}
        </Section>

        <Checkbox name="terms" required small>
          Concordo com os <TextButton inline>Termos de Uso</TextButton> e a
          Política de Privacidade.
        </Checkbox>

        <SubmitButton>Criar minha conta</SubmitButton>
      </Form>
    </>
  );
}
