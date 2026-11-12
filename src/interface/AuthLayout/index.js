import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { Manrope } from "next/font/google";
import { faRoad } from "@fortawesome/free-solid-svg-icons";
import { Icon } from "./form";
import styles from "./index.module.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const introByMode = {
  login: {
    title: "Bom ter você de volta.",
    subtitle:
      "Entre para continuar sua jornada com o Conduzindo Para O Futuro.",
  },
  signup: {
    title: "Comece uma nova rota.",
    subtitle: "Crie sua conta e conecte-se com quem quer ensinar ou aprender.",
  },
};

// Componente que renderiza a página principal do aplicativo, mantendo a padronização

export default function AuthLayout({ mode, metadata = {}, children }) {
  const intro = introByMode[mode];

  return (
    <>
      <Head>
        <title>
          {metadata.title
            ? `${metadata.title} · Conduzindo Para O Futuro`
            : "Conduzindo Para O Futuro"}
        </title>

        {metadata.description && (
          <meta name="description" content={metadata.description} />
        )}
      </Head>

      <main className={`${styles.page} ${manrope.className}`}>
        <div className={styles.shell}>
          <section className={styles.main}>
            <header className={styles.header}>
              <Logo />
              <span className={styles.tagline}>Sua jornada começa aqui.</span>
            </header>

            <div className={styles.content}>
              <div className={styles.intro}>
                <span className={styles.badge}>
                  <span className={styles.badgeDot} />
                  Direto, simples e seguro
                </span>
                <h1 className={styles.title}>{intro.title}</h1>
                <p className={styles.subtitle}>{intro.subtitle}</p>
              </div>

              <nav className={styles.tabs} aria-label="Acesso à conta">
                <ModeTab href="/login" active={mode === "login"}>
                  Entrar
                </ModeTab>
                <ModeTab href="/cadastro" active={mode === "signup"}>
                  Criar conta
                </ModeTab>
              </nav>

              {children}
            </div>

            <footer className={styles.footer}>
              <span>© {new Date().getFullYear()} Conduzindo Para O Futuro</span>
              <span>Feito para mover histórias.</span>
            </footer>
          </section>

          <Hero />
        </div>
      </main>
    </>
  );
}

function Logo() {
  return (
    <Link href="/" className={styles.logo}>
      <span className={styles.logoMark}>
        <Icon icon={faRoad} size={24} />
      </span>
      <span className={styles.logoText}>
        Conduzindo Para O Futuro<span className={styles.logoDot}>.</span>
      </span>
    </Link>
  );
}

function ModeTab({ href, active, children }) {
  return (
    <Link
      href={href}
      className={`${styles.tab} ${active ? styles.tabActive : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

const avatars = [
  { letter: "M", className: styles.avatarCoral },
  { letter: "R", className: styles.avatarSun },
  { letter: "A", className: styles.avatarMint },
];

function Hero() {
  return (
    <aside className={styles.hero}>
      <Image
        className={styles.heroImage}
        src="/images/aula-de-direcao.jpg"
        alt="Motorista sorrindo dentro de um carro"
        fill
        sizes="(min-width: 1024px) 50vw, 0px"
        priority
      />
      <div className={styles.heroGradient} />

      <div className={styles.heroPill}>
        <span className={styles.heroPillDot} />
        Mobilidade que aproxima
      </div>

      <div className={styles.heroBody}>
        <div className={styles.heroTags}>
          <span className={styles.heroTagPrimary}>Flexibilidade</span>
          <span className={styles.heroTagSecondary}>Confiança</span>
        </div>
        <blockquote className={styles.heroQuote}>
          Aprender a dirigir começa com a{" "}
          <span className={styles.heroHighlight}>conexão certa.</span>
        </blockquote>
        <p className={styles.heroText}>
          Encontre instrutores independentes, escolha seus horários e siga no
          seu ritmo — sem intermediários.
        </p>
        <div className={styles.heroPeople}>
          <div className={styles.avatars}>
            {avatars.map(({ letter, className }) => (
              <span key={letter} className={`${styles.avatar} ${className}`}>
                {letter}
              </span>
            ))}
          </div>
          <p className={styles.heroPeopleText}>
            <strong>Pessoas reais.</strong>
            Jornadas únicas.
          </p>
        </div>
      </div>

      <span className={styles.heroRing} />
    </aside>
  );
}
