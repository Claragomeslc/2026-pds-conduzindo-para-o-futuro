import { Heading, Stack, Text } from "@primer/react";
import DefaultLayout from "interface/DefaultLayout";

// RF18/RF23: página com perguntas frequentes sobre como tirar a habilitação
const questions = [
  {
    question: "Quem pode tirar a CNH?",
    answer:
      "Pessoas com 18 anos ou mais, que saibam ler e escrever e tenham CPF e documento de identidade.",
  },
  {
    question: "Quais são as etapas?",
    answer:
      "1) Abrir o processo no Detran do seu estado. 2) Fazer o exame médico e o psicológico. 3) Fazer a prova teórica. 4) Fazer as aulas práticas. 5) Fazer a prova prática.",
  },
  {
    question: "Ainda é obrigatório fazer autoescola?",
    answer:
      "Pelas regras novas, o aluno pode fazer as aulas práticas com um instrutor autônomo credenciado. É para isso que serve o Conduzindo Para O Futuro: ligar você a esses instrutores.",
  },
  {
    question: "Qual a diferença entre as categorias A e B?",
    answer:
      "A categoria A é para motos. A categoria B é para carros. Quem tem as duas tem a categoria AB.",
  },
  {
    question: "Quanto tempo leva?",
    answer:
      "Depende do Detran e do seu ritmo, mas costuma levar de 2 a 6 meses.",
  },
  {
    question: "Onde conferir as informações oficiais?",
    answer:
      "No site do Detran do seu estado e no portal gov.br. As regras podem mudar, então sempre confira lá.",
  },
];

export default function LicensePage() {
  return (
    <DefaultLayout metadata={{ title: "Como tirar a habilitação" }}>
      <Stack gap="normal">
        <Heading as="h1">Como tirar a habilitação</Heading>

        {questions.map((item) => (
          <div key={item.question}>
            <Heading as="h2" variant="small">
              {item.question}
            </Heading>
            <Text as="p">{item.answer}</Text>
          </div>
        ))}
      </Stack>
    </DefaultLayout>
  );
}
