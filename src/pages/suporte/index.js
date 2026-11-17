import { useState } from "react";
import {
  Banner,
  Button,
  FormControl,
  Heading,
  Stack,
  TextInput,
  Textarea,
} from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";
import { callApi, errorText } from "interface/api";

// RF20: formulário de suporte (a mensagem chega por e-mail para a equipe)
export default function SupportPage() {
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const { ok, data } = await callApi("/api/v1/support", "POST", {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    });

    if (ok) {
      setMessage({
        variant: "success",
        text: "Mensagem enviada! Vamos responder por e-mail.",
      });
      event.target.reset();
    } else {
      setMessage({ variant: "critical", text: errorText(data) });
    }
  }

  return (
    <DefaultLayout contentWidth="small" metadata={{ title: "Suporte" }}>
      <form onSubmit={handleSubmit}>
        <Stack gap="normal">
          <Heading as="h1">Fale com o suporte</Heading>

          {message && <Banner variant={message.variant} title={message.text} />}

          <FormControl required>
            <FormControl.Label>Nome</FormControl.Label>
            <TextInput name="name" block />
          </FormControl>

          <FormControl required>
            <FormControl.Label>E-mail</FormControl.Label>
            <TextInput name="email" type="email" block />
          </FormControl>

          <FormControl required>
            <FormControl.Label>Mensagem</FormControl.Label>
            <Textarea name="message" block />
          </FormControl>

          <div>
            <Button type="submit" variant="primary">
              Enviar
            </Button>
          </div>
        </Stack>
      </form>
    </DefaultLayout>
  );
}
