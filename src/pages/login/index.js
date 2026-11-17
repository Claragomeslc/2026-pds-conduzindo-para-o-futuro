import { useState } from "react";
import { useRouter } from "next/router";
import {
  Banner,
  Button,
  FormControl,
  Heading,
  Link,
  Stack,
  Text,
  TextInput,
} from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    // Pega os valores digitados nos campos do formulário
    const formData = new FormData(event.target);

    try {
      const response = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      });

      if (response.status === 201) {
        router.push("/");
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
    <DefaultLayout contentWidth="small" metadata={{ title: "Login" }}>
      <Stack gap="normal">
        <Heading as="h1">Entrar</Heading>

        {errorMessage && (
          <Banner
            variant="critical"
            title="Não foi possível entrar"
            description={errorMessage}
          />
        )}

        <form onSubmit={handleSubmit}>
          <Stack gap="normal">
            <FormControl required>
              <FormControl.Label>E-mail</FormControl.Label>
              <TextInput name="email" type="email" autoComplete="email" block />
            </FormControl>

            <FormControl required>
              <FormControl.Label>Senha</FormControl.Label>
              <TextInput
                name="password"
                type="password"
                autoComplete="current-password"
                block
              />
            </FormControl>

            <Button type="submit" variant="primary" loading={isLoading} block>
              Entrar
            </Button>
          </Stack>
        </form>

        <Text>
          Ainda não tem conta? <Link href="/cadastro">Cadastre-se</Link>
        </Text>
      </Stack>
    </DefaultLayout>
  );
}
