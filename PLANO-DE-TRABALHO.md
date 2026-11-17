# Plano de Trabalho – Conduzindo Para O Futuro

> Guia para acompanhar o desenvolvimento por releases. Marque `[x]` conforme for concluindo.
> Repositório: https://github.com/Claragomeslc/2026-pds-conduzindo-para-o-futuro

---

## 1. Como o projeto está hoje

**Tecnologias que o código usa de verdade:** Next.js + React (front), rotas de API do Next (back), PostgreSQL no Docker, Jest para testes e Mailcatcher para ver os e-mails em `http://localhost:1080`.

> O README ainda fala em **WordPress/PHP/MySQL**, mas o projeto não usa nada disso. Por isso as notas "(Verificar com o WordPress)" no RF16 e no RF19 não valem mais. Vale corrigir o README.

> A pasta baixada em `.zip` **não é um repositório git** (não tem histórico nem branches). Clone o repositório (Passo 0).

### Branches no GitHub

| Branch | O que tem | Situação |
|---|---|---|
| `main` | Base estável | Não mexer direto |
| `release/1.1.0` | Back-end com os campos novos (fullname, cpf, birth_date, phone, role, cnh, cnh_category, instructor_credential, crv) e as páginas `/cadastro/confirmar` e `/cadastro/ativar/[token]` | PR #2 já foi juntado aqui |
| `login/cadastro` | Telas novas de login e cadastro, **só visuais** | **PR #1 aberto → `release/1.1.0`**, sem conflitos |
| `backend/query-users` | Busca de usuários (base para o RF19) | Já existe |
| `backend/create-instructors-availability` | Agenda do instrutor (RF04 e RF05) | Já existe |
| `backend/create-appointments` | Agendamento de aulas (RF06, RF09 a RF11, RF22) | Já existe |

O back-end está bem adiantado. **O que falta é ligar as telas à API.** Hoje o `handleSubmit` do cadastro e o do login só fazem `event.preventDefault()`.

### Diferenças entre a tela de cadastro e a API

| Tela (`pages/cadastro/index.js`) | API (`release/1.1.0`) | O que fazer |
|---|---|---|
| `name="name"` | espera `fullname` | Trocar para `fullname` |
| Seletor aluno/instrutor (só visual) | espera `role`: `"student"` ou `"instructor"` | Enviar o `role` junto |
| CPF com máscara `000.000.000-00` | coluna `varchar(11)`, só números | Tirar pontos e traço antes de enviar |
| Campo "CRV" | campo `crv` | Manter `name="crv"` e mudar só o texto para "CRLV" |
| Não existe | `cnh_category` (padrão "B") | Adicionar um select de categoria para o instrutor (vai servir para o filtro do RF19) |
| Sem tratamento de erro | devolve `{ message, action }` | Mostrar a mensagem na tela |

### Outros pontos de atenção

- **Login:** a API `POST /api/v1/sessions` recebe só `{ email, password }`. O seletor aluno/instrutor na tela de login não é necessário, porque o papel já vem do banco.
- **O usuário precisa ativar a conta pelo e-mail antes de entrar.** Sem ativar, ele não tem permissão de login e a API responde 403. Fluxo para testar: cadastro → abrir `localhost:1080` → clicar no link → fazer login.
- **A migration original foi alterada** na release (o `create-users` mudou e o `add-features` foi apagado). Se você já tinha rodado o projeto antes, o banco antigo fica errado. Rode `npm run services:down` antes do `npm run dev` para recriar o banco.
- **O back-end não verifica campos obrigatórios.** Se o `fullname` ou o `cpf` não chegarem, o banco recusa e a API devolve erro 500 em vez de uma mensagem clara. O `phone` nem é obrigatório no banco, mas o RF01 pede. Sugestão para quem cuida do back: validar `fullname`, `cpf`, `birth_date` e `phone` em `models/user.js`, e para instrutor também `instructor_credential`, `cnh` e `crv`.

---

## 2. Requisitos agrupados por versão

| Release | Requisitos | Observação |
|---|---|---|
| **1.1.0 – Cadastro e Login** | RF01, RF02, RF03 | Documentos do RF02 = só os números (sem upload de arquivo) |
| **1.2.0 – Buscar instrutores / Perfil** | RF13, RF14, RF15, RF19, RF21 | Faltam colunas novas: `price`, `region`, `description` |
| **1.3.0 – Agenda e Aulas** | RF04, RF05, RF06, RF07, RF09, RF10, RF11, RF22 | O back já existe em duas branches. RF07 usa o mesmo envio de e-mail da ativação. Agenda própria, **sem Google** |
| **1.4.0 – Extras** | RF08, RF12, RF16, RF17, RF18/RF23, RF20 | Versões simples, explicadas abaixo |

### Simplificações sugeridas

- **RF12 chat:** um botão que abre o WhatsApp com o link `https://wa.me/55<telefone>`. Um chat próprio daria muito trabalho.
- **RF16 pagamento:** só mostrar o preço e combinar o pagamento direto com o instrutor. Pagamento real pela plataforma é complexo; justificar isso no documento.
- **RF18 e RF23** são o mesmo requisito repetido. Basta uma página fixa de perguntas frequentes (`/habilitacao`). Remova um dos dois da lista.
- **RF20 suporte:** um formulário que manda e-mail para a equipe (o envio de e-mail já existe em `infra/email.js`).
- **RF08 lembrete 24h:** precisa de uma tarefa agendada (cron), então deixe por último ou marque como "trabalho futuro". No RF08, troque também "consulta" por "aula".

---

## 3. Código para ligar o cadastro à API

Em `src/pages/cadastro/index.js`, o componente `Field` já repassa `name` e `required`. Por isso dá para usar `FormData` sem criar um `useState` para cada campo:

```js
const [errorMessage, setErrorMessage] = useState("");

async function handleSubmit(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));

  const requestBody = {
    ...data,
    role, // "student" ou "instructor"
    cpf: data.cpf.replace(/\D/g, ""), // só números
  };
  delete requestBody.terms;

  const response = await fetch("/api/v1/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (response.status === 201) {
    location.href = "/cadastro/confirmar";
    return;
  }

  const body = await response.json();
  setErrorMessage(`${body.message} ${body.action}`);
}
```

Também é preciso:

- trocar `name="name"` por `name="fullname"`;
- mostrar `{errorMessage && <p>{errorMessage}</p>}` acima do botão.

**Login** (`src/pages/login/index.js`): é igual. `POST /api/v1/sessions` com `{ email, password }`. Se a resposta for `201`, use `location.href = "/"`. Se não for, mostre a mensagem de erro.

---

## 4. Checklist na ordem

### Passo 0 – Preparar o ambiente

- [ ] Clonar o repositório: `git clone https://github.com/Claragomeslc/2026-pds-conduzindo-para-o-futuro.git`
- [ ] Entrar na pasta `src`, rodar `nvm use 24` e `npm install`
- [ ] Rodar `git checkout release/1.1.0` e depois `git pull`
- [ ] Rodar `npm run services:down` para apagar o banco antigo
- [ ] Rodar `npm run dev` e conferir `localhost:3000` e `localhost:1080`
- [ ] Rodar `npm test` e confirmar que tudo passa antes de mexer

### Passo 1 – Release 1.1.0 (Cadastro e Login: RF01, RF02, RF03)

- [ ] **Juntar o PR #1** (`login/cadastro` → `release/1.1.0`) no GitHub. Ele não tem conflitos.
- [ ] Rodar `git checkout release/1.1.0` e `git pull` para baixar as telas novas
- [ ] Criar a branch do front: `git checkout -b frontend/integrar-cadastro-login`
- [ ] Cadastro: trocar `name` por `fullname`
- [ ] Cadastro: enviar o `role`
- [ ] Cadastro: limpar o CPF (só números)
- [ ] Cadastro: mudar o texto "CRV" para "CRLV"
- [ ] Cadastro: adicionar o select `cnh_category` para o instrutor
- [ ] Cadastro: mostrar as mensagens de erro da API
- [ ] Login: chamar `POST /api/v1/sessions` e tirar o seletor aluno/instrutor (ou deixar só como enfeite)
- [ ] Testar na mão: cadastrar um aluno → ativar pelo e-mail em `localhost:1080` → fazer login
- [ ] Testar na mão: repetir com um instrutor
- [ ] Testar erros: e-mail repetido, CPF repetido, senha errada, login antes de ativar a conta
- [ ] Rodar `npm run lint:prettier:fix` e `npm run lint:eslint:check`
- [ ] Fazer commit no padrão do projeto (o commitlint exige, ex.: `feat: integra tela de cadastro com a API`)
- [ ] `git push -u origin frontend/integrar-cadastro-login`
- [ ] Abrir um PR com **base `release/1.1.0`** (não `main`)
- [ ] Pedir para quem cuida do back, num PR separado (`backend/validar-campos-obrigatorios` → `release/1.1.0`), a validação dos campos obrigatórios
- [ ] Depois dos dois PRs juntados: rodar `npm run services:down`, `npm run dev` e `npm test` na `release/1.1.0`
- [ ] Testar o fluxo completo de novo na `release/1.1.0`
- [ ] Atualizar o README (stack correta, como rodar)
- [ ] **Abrir o PR `release/1.1.0` → `main`**, revisar em equipe e juntar

### Passo 2 – Release 1.2.0 (Buscar instrutores e Perfil: RF13, RF14, RF15, RF19, RF21)

- [ ] Criar a `release/1.2.0` a partir da `main` já atualizada
- [ ] Back-end: nova migration com `price`, `region` e `description`
- [ ] Back-end: rota para o instrutor editar o perfil (RF21)
- [ ] Back-end: filtros na busca (RF19), aproveitando a `backend/query-users` depois de atualizá-la com a `release/1.2.0`
- [ ] Front-end (branch separada): página `/instrutores` com lista e filtros (região, categoria, preço)
- [ ] Front-end: página do instrutor (contato, preço, região)
- [ ] Front-end: tela "Meu perfil" do instrutor
- [ ] Abrir PRs do back e do front → `release/1.2.0`
- [ ] Testar tudo junto na `release/1.2.0`
- [ ] Abrir o PR `release/1.2.0` → `main`

### Passo 3 – Release 1.3.0 (Agenda e Aulas: RF04 a RF07, RF09 a RF11, RF22)

- [ ] Criar a `release/1.3.0` a partir da `main`
- [ ] Back-end: atualizar a `backend/create-instructors-availability` com a release e abrir PR
- [ ] Back-end: atualizar a `backend/create-appointments` com a release e abrir PR
- [ ] Back-end: confirmar que o cancelamento respeita as 48h (RF09, RF10)
- [ ] Back-end: confirmar que o horário cancelado volta a ficar livre (RF11)
- [ ] Back-end: e-mail de confirmação do agendamento (RF07)
- [ ] Front-end: tela do instrutor para cadastrar horários (RF04)
- [ ] Front-end: tela do aluno para escolher instrutor, data e horário (RF05, RF06)
- [ ] Front-end: tela "Minhas aulas" com botão de cancelar (RF22)
- [ ] Testar tudo junto na `release/1.3.0`
- [ ] Abrir o PR `release/1.3.0` → `main`

### Passo 4 – Release 1.4.0 (Extras)

- [ ] Criar a `release/1.4.0` a partir da `main`
- [ ] RF18/RF23: página fixa sobre o processo de habilitação
- [ ] RF12: botão de WhatsApp
- [ ] RF17: avaliação de 1 a 5 estrelas com comentário depois da aula (tabela nova `reviews`)
- [ ] RF20: formulário de suporte que manda e-mail
- [ ] RF16 e RF08: registrar no documento (E5) como "trabalho futuro", ou fazer só se sobrar tempo
- [ ] Testar tudo junto e abrir o PR `release/1.4.0` → `main`

---

## 5. Regras para a equipe (todas as releases)

- Nunca fazer commit direto na `main` nem na `release/*`. Sempre usar uma branch própria e abrir PR.
- Antes de abrir PR, rodar `git pull origin release/x.y.z` na sua branch para evitar conflitos.
- Todo PR precisa de `npm test` e do lint passando (o GitHub Actions já roda os dois).
- Mensagens de commit no padrão Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`…).

### Fluxo de branches

```
frontend/xxx ──PR──┐
                   ├──► release/x.y.z ──(testar junto)──PR──► main
backend/yyy  ──PR──┘
```
