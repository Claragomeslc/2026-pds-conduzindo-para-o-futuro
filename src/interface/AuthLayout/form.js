import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCar,
  faEye,
  faEyeSlash,
  faLock,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import {
  faAddressCard,
  faCalendar,
  faClipboard,
  faEnvelope,
  faIdBadge,
  faIdCard,
  faUser,
} from "@fortawesome/free-regular-svg-icons";
import styles from "./index.module.css";

// Utilizando os icones do FontAwesome de forma dinamica

export function Icon({ icon, size = 20 }) {
  return (
    <FontAwesomeIcon
      icon={icon}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export const icons = {
  person: <Icon icon={faUser} />,
  car: <Icon icon={faCar} />,
  email: <Icon icon={faEnvelope} />,
  lock: <Icon icon={faLock} />,
  clipboard: <Icon icon={faClipboard} />,
  document: <Icon icon={faIdCard} />,
  calendar: <Icon icon={faCalendar} />,
  phone: <Icon icon={faPhone} />,
  badge: <Icon icon={faIdBadge} />,
  license: <Icon icon={faAddressCard} />,
};

export function Form({ onSubmit, children }) {
  return (
    <form className={styles.form} onSubmit={onSubmit}>
      {children}
    </form>
  );
}

// Component reutilizável para criar campos de formulário

export function Field({
  label,
  name,
  type = "text",
  placeholder,
  icon,
  autoComplete,
  minLength,
  required = true,
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.fieldControl}>
        <span className={styles.fieldIcon}>{icon}</span>
        <input
          className={styles.fieldInput}
          name={name}
          type={isPassword && passwordVisible ? "text" : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
        />
        {isPassword && (
          <button
            type="button"
            className={styles.passwordToggle}
            aria-label={passwordVisible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={passwordVisible}
            onClick={() => setPasswordVisible((visible) => !visible)}
          >
            <Icon icon={passwordVisible ? faEyeSlash : faEye} size={16} />
          </button>
        )}
      </span>
    </label>
  );
}

// Logica para escolher o usuário Aluno || Instrutor

const roles = {
  student: { title: "Sou aluno", hint: "Quero aprender", icon: icons.person },
  instructor: {
    title: "Sou instrutor",
    hint: "Quero ensinar",
    icon: icons.car,
  },
};

export function RoleSelector({ value, onChange }) {
  return (
    <div className={styles.roleGroup}>
      <h6 className={styles.roleQuestion}>
        Como você vai usar o Conduzindo Para O Futuro?
      </h6>

      <div className={styles.roleOptions}>
        {Object.entries(roles).map(([role, { title, hint, icon }]) => {
          const selected = value === role;

          return (
            <button
              key={role}
              type="button"
              className={`${styles.roleOption} ${selected ? styles.roleOptionSelected : ""}`}
              aria-pressed={selected}
              onClick={() => onChange(role)}
            >
              <span className={styles.roleIcon}>{icon}</span>
              <span>
                <span className={styles.roleTitle}>{title}</span>
                <span className={styles.roleHint}>{hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Component reutilizável para criar seções de formulário

export function Section({ title, hint, icon, children }) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>
        <span>
          <span className={styles.sectionTitle}>{title}</span>
          <span className={styles.sectionHint}>{hint}</span>
        </span>
      </div>
      <div className={styles.sectionGrid}>{children}</div>
    </div>
  );
}

export function FormRow({ children }) {
  return <div className={styles.formRow}>{children}</div>;
}

export function Checkbox({ name, required, small, children }) {
  return (
    <label
      className={`${styles.checkbox} ${small ? styles.checkboxSmall : ""}`}
    >
      <input
        className={styles.checkboxInput}
        type="checkbox"
        name={name}
        required={required}
      />
      <span>{children}</span>
    </label>
  );
}

export function TextButton({ children, inline, onClick }) {
  return (
    <button
      type="button"
      className={inline ? styles.inlineLink : styles.textButton}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function SubmitButton({ loading, children }) {
  return (
    <button type="submit" className={styles.submit} disabled={loading}>
      {children}
      <span className={styles.submitArrow}>
        <Icon icon={faArrowRight} size={16} />
      </span>
    </button>
  );
}

export function FormError({ error }) {
  if (!error) return null;

  return (
    <div className={styles.error} role="alert">
      <strong>{error.message}</strong>
      {error.action && <span>{error.action}</span>}
    </div>
  );
}

// Função que lida com erros de API - Deve ser utilizada em cada endpoint

export async function readApiError(response) {
  try {
    const body = await response.json();
    return { message: body.message, action: body.action };
  } catch {
    return {
      message: "Não foi possível completar a operação.",
      action: "Tente novamente em alguns instantes.",
    };
  }
}
