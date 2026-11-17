import { useState } from "react";
import {
  Banner,
  Button,
  FormControl,
  Heading,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";
import NeedLogin from "interface/NeedLogin";
import { callApi, errorText, useUser } from "interface/api";

// RF21: o instrutor edita o próprio perfil (preço, região, descrição e telefone)
export default function ProfilePage() {
  const { user, isLoading } = useUser();
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    const { ok, data } = await callApi(
      `/api/v1/users/${user.username}`,
      "PATCH",
      {
        phone: formData.get("phone"),
        price: formData.get("price") || null,
        region: formData.get("region"),
        description: formData.get("description"),
      },
    );

    if (ok) {
      setMessage({ variant: "success", text: "Perfil salvo!" });
    } else {
      setMessage({ variant: "critical", text: errorText(data) });
    }
  }

  return (
    <DefaultLayout contentWidth="small" metadata={{ title: "Meu perfil" }}>
      <Stack gap="normal">
        <Heading as="h1">Meu perfil</Heading>

        {isLoading && <Text>Carregando...</Text>}
        {!isLoading && !user && <NeedLogin />}
        {user && user.role !== "instructor" && (
          <Text>Esta página é só para instrutores.</Text>
        )}

        {user && user.role === "instructor" && (
          <form onSubmit={handleSubmit}>
            <Stack gap="normal">
              {message && (
                <Banner variant={message.variant} title={message.text} />
              )}

              <Text>
                Estas informações aparecem para os alunos na busca de
                instrutores.
              </Text>

              <FormControl>
                <FormControl.Label>Telefone (WhatsApp)</FormControl.Label>
                <TextInput name="phone" defaultValue={user.phone} block />
              </FormControl>

              <FormControl>
                <FormControl.Label>Preço da aula (R$)</FormControl.Label>
                <TextInput
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={user.price}
                  block
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Região onde atende</FormControl.Label>
                <TextInput
                  name="region"
                  placeholder="Ex.: Centro, Curitiba"
                  defaultValue={user.region}
                  block
                />
              </FormControl>

              <FormControl>
                <FormControl.Label>Sobre você</FormControl.Label>
                <Textarea
                  name="description"
                  placeholder="Conte sua experiência, o carro que usa nas aulas..."
                  defaultValue={user.description}
                  block
                />
              </FormControl>

              <div>
                <Button type="submit" variant="primary">
                  Salvar
                </Button>
              </div>
            </Stack>
          </form>
        )}
      </Stack>
    </DefaultLayout>
  );
}
