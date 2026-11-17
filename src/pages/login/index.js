import { useState } from "react";
import AuthLayout from "interface/AuthLayout";
import {
  Checkbox,
  Field,
  Form,
  FormRow,
  RoleSelector,
  SubmitButton,
  TextButton,
  icons,
} from "interface/AuthLayout/form";

export default function LoginPage() {
  return (
    <AuthLayout
      mode="login"
      metadata={{
        title: "Entrar",
        description: "Entre na sua conta do Conduzindo Para O Futuro",
      }}
    >
      <LoginForm />
    </AuthLayout>
  );
}

function LoginForm() {
  const [role, setRole] = useState("student");

  // Logica deve ser aplicado após API no ar

  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <>
      <RoleSelector value={role} onChange={setRole} />

      <Form onSubmit={handleSubmit}>
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
          placeholder="Digite sua senha"
          autoComplete="current-password"
          icon={icons.lock}
        />

        <FormRow>
          <Checkbox name="remember">Lembrar de mim</Checkbox>
          <TextButton>Esqueci a senha</TextButton>
        </FormRow>

        <SubmitButton>Entrar na minha conta</SubmitButton>
      </Form>
    </>
  );
}
