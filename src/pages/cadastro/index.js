import { useState } from "react";
import { useRouter } from "next/router";
import {
  Banner,
  Button,
  FormControl,
  Heading,
  Link,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Text,
  TextInput,
} from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState("student");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isInstructor = role === "instructor";

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    // Pega os valores digitados nos campos do formulário
    const formData = new FormData(event.target);

    const newUser = {
      role: role,
      fullname: formData.get("fullname"),
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      cpf: onlyNumbers(formData.get("cpf")), // o banco guarda só os 11 números
      birth_date: formData.get("birth_date"),
      phone: formData.get("phone"),
    };

    if (isInstructor) {
      newUser.instructor_credential = formData.get("instructor_credential");
      newUser.cnh = formData.get("cnh");
      newUser.cnh_category = formData.get("cnh_category");
      newUser.crv = formData.get("crv");
    }

    try {
      const response = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (response.status === 201) {
        router.push("/cadastro/confirmar");
        return;
      }

      // A API devolve { message, action } quando algo dá errado
      const responseBody = await response.json();
      setErrorMessage(`${responseBody.message} ${responseBody.action}`);
    } catch {
      setErrorMessage(
        "Não foi possível conectar ao servidor. Tente novamente.",
      );
    }

    setIsLoading(false);
  }

  return (
    <DefaultLayout contentWidth="small" metadata={{ title: "Cadastre-se" }}>
      <Stack gap="normal">
        <Heading as="h1">Criar conta</Heading>

        {errorMessage && (
          <Banner
            variant="critical"
            title="Não foi possível criar a conta"
            description={errorMessage}
          />
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="normal">
            <RadioGroup name="role" onChange={(value) => setRole(value)}>
              <RadioGroup.Label>Eu sou</RadioGroup.Label>
              <FormControl>
                <Radio value="student" checked={role === "student"} />
                <FormControl.Label>Aluno</FormControl.Label>
              </FormControl>
              <FormControl>
                <Radio value="instructor" checked={role === "instructor"} />
                <FormControl.Label>Instrutor</FormControl.Label>
              </FormControl>
            </RadioGroup>

            <Campo label="Nome completo" name="fullname" autoComplete="name" />
            <Campo
              label="Nome de usuário"
              name="username"
              autoComplete="username"
            />
            <Campo
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
            />
            <Campo
              label="Senha"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
            />
            <Campo label="CPF" name="cpf" placeholder="000.000.000-00" />
            <Campo label="Data de nascimento" name="birth_date" type="date" />
            <Campo
              label="Telefone"
              name="phone"
              type="tel"
              placeholder="(00) 00000-0000"
              autoComplete="tel"
            />

            {isInstructor && (
              <>
                <Heading as="h2" variant="small">
                  Dados do instrutor
                </Heading>
                <Campo
                  label="Credencial de instrutor"
                  name="instructor_credential"
                />
                <Campo label="CNH" name="cnh" />
                <FormControl required>
                  <FormControl.Label>Categoria da CNH</FormControl.Label>
                  <Select name="cnh_category" defaultValue="B" block>
                    <Select.Option value="A">A</Select.Option>
                    <Select.Option value="B">B</Select.Option>
                    <Select.Option value="AB">AB</Select.Option>
                  </Select>
                </FormControl>
                <Campo label="CRLV do veículo" name="crv" />
              </>
            )}

            <Button type="submit" variant="primary" loading={isLoading} block>
              Criar conta
            </Button>
          </Stack>
        </form>

        <Text>
          Já tem conta? <Link href="/login">Entrar</Link>
        </Text>
      </Stack>
    </DefaultLayout>
  );
}

// Campo de texto obrigatório com rótulo, para não repetir o mesmo código
function Campo({ label, name, ...props }) {
  return (
    <FormControl required>
      <FormControl.Label>{label}</FormControl.Label>
      <TextInput name={name} block {...props} />
    </FormControl>
  );
}

function onlyNumbers(text) {
  return text.replace(/\D/g, "");
}
