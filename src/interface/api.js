import { useEffect, useState } from "react";

// Faz uma chamada para a API e já transforma a resposta em objeto.
// Exemplo: const { ok, data } = await callApi("/api/v1/users/query", "POST", { filters: {} });
export async function callApi(url, method = "GET", body) {
  const options = { method, headers: {} };

  if (body) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  return { ok: response.ok, status: response.status, data };
}

// Monta o texto de erro que a API devolve ({ message, action })
export function errorText(data) {
  return `${data.message} ${data.action}`;
}

// Hook que descobre quem está logado.
// Devolve { user: null } quando ninguém fez login.
export function useUser() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        // 1) quem está logado (só devolve id e username)
        const session = await callApi("/api/v1/user");
        if (!session.ok) {
          setUser(null);
          return;
        }

        // 2) busca os dados completos (nome, papel, telefone...)
        const result = await callApi("/api/v1/users/query", "POST", {
          filters: { username: session.data.username },
        });
        setUser(result.data.users[0] || null);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  return { user, isLoading };
}

// Traduções usadas em várias telas
export const daysOfWeek = {
  monday: "Segunda-feira",
  tuesday: "Terça-feira",
  wednesday: "Quarta-feira",
  thursday: "Quinta-feira",
  friday: "Sexta-feira",
  saturday: "Sábado",
  sunday: "Domingo",
};

export const appointmentStatus = {
  reserved: "Aguardando confirmação",
  pending_payment: "Aguardando pagamento",
  booked: "Confirmada",
  completed: "Concluída",
  canceled: "Cancelada",
  free: "Livre",
};

export function formatPrice(price) {
  if (price === null || price === undefined) return "Não informado";
  return Number(price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDateTime(date) {
  return new Date(date).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
