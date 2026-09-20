import { Banner } from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function ActivateUserPage() {
  const router = useRouter();
  const { activationTokenId } = router.query;

  const [activationStatus, setIsActivationStatus] = useState("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!activationTokenId) {
      return;
    }

    sendActivationRequest();

    async function sendActivationRequest() {
      try {
        const response = await fetch(
          `/api/v1/activations/${activationTokenId}`,
          {
            method: "PATCH",
            signal: AbortSignal.timeout(5000),
          },
        );

        if (response.status === 200) {
          setIsActivationStatus("success");
          return;
        }

        const activationResponseBody = await response.json();
        setErrorMessage(
          `${activationResponseBody.message} ${activationResponseBody.action}`,
        );
        setIsActivationStatus("failure");
      } catch (error) {
        if (error.name === "TimeoutError") {
          setErrorMessage(
            "O servidor demorou para responder. Tente novamente mais tarde.",
          );
        } else {
          setErrorMessage(
            "Ocorreu um erro ao tentar ativar a sua conta. Tente novamente mais tarde.",
          );
        }
        setIsActivationStatus("failure");
      }
    }
  }, [activationTokenId]);

  return (
    <DefaultLayout
      contentWidth="small"
      metadata={{
        title: "Ative sua conta",
      }}
    >
      {activationStatus === "loading" && (
        <Banner variant="info">
          <Banner.Title>
            Por favor, aguarde enquanto ativamos sua conta.
          </Banner.Title>
        </Banner>
      )}
      {activationStatus === "success" && (
        <Banner variant="success">
          <Banner.Title>Conta ativada com sucesso</Banner.Title>
          <Banner.Description>
            Você já pode fazer o login com seu e-mail e senha.
          </Banner.Description>
          <Banner.PrimaryAction href="/login">Login</Banner.PrimaryAction>
        </Banner>
      )}
      {activationStatus === "failure" && (
        <Banner variant="critical">
          <Banner.Title>Não foi possível ativar a sua conta</Banner.Title>
          <Banner.Description>{errorMessage}</Banner.Description>
        </Banner>
      )}
    </DefaultLayout>
  );
}
