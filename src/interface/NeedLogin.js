import { Banner } from "@primer/react";
import NextLink from "next/link";
import styles from "./NeedLogin.module.css";

// Aviso mostrado nas páginas que só funcionam com login
export default function NeedLogin() {
  return (
    <Banner
      className={styles.banner}
      variant="warning"
      title="Você precisa entrar na sua conta"
      description="Faça login para acessar esta página."
      primaryAction={
        <Banner.PrimaryAction as={NextLink} href="/login">
          Login
        </Banner.PrimaryAction>
      }
    />
  );
}
