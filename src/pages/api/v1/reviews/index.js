import { createRouter } from "next-connect";
import controller from "infra/controller.js";
import user from "models/user.js";
import appointment from "models/appointment.js";
import review from "models/review.js";
import { ForbiddenError } from "infra/errors.js";

export default createRouter()
  .use(controller.injectAnonymousOrUser)
  .post(controller.canRequest("update:user"), postHandler)
  .handler(controller.errorHandlers);

async function postHandler(request, response) {
  const inputValues = request.body;

  const userReviewerTryingToPost = request.context.user;
  if (
    userReviewerTryingToPost.role !== "student" &&
    userReviewerTryingToPost.role !== "instructor"
  ) {
    throw new ForbiddenError({
      message: "Você não possui permissão para registrar uma avaliação.",
      action:
        "Verifique se você possui a feature necessária para registrar uma avaliação.",
    });
  }

  const targetUserReviewed = await user.findOneById(
    inputValues.reviewed_user_id,
  );
  if (
    targetUserReviewed.role !== "student" &&
    targetUserReviewed.role !== "instructor"
  ) {
    throw new ForbiddenError({
      message: "Você não possui permissão para avaliar este usuário.",
      action:
        "Verifique se você possui a feature necessária para avaliar um usuário que possui perfil de instrutor ou aluno.",
    });
  }

  if (
    userReviewerTryingToPost.role === "student" &&
    targetUserReviewed.role !== "instructor"
  ) {
    throw new ForbiddenError({
      message: "Você não possui permissão para avaliar este usuário.",
      action:
        "Verifique se você está avaliando um usuário que possui perfil de instrutor.",
    });
  }

  if (
    userReviewerTryingToPost.role === "instructor" &&
    targetUserReviewed.role !== "student"
  ) {
    throw new ForbiddenError({
      message: "Você não possui permissão para avaliar este usuário.",
      action:
        "Verifique se você está avaliando um usuário que possui perfil de aluno.",
    });
  }

  if (!targetUserReviewed.status || targetUserReviewed.status !== "active") {
    throw new ForbiddenError({
      message: "Você ainda não pode avaliar este usuário.",
      action:
        "Verifique se o usuário que você selecionou está ativo na aplicação.",
    });
  }

  if (inputValues.appointment_id) {
    const targetAppointment = await appointment.findOneById(
      inputValues.appointment_id,
      userReviewerTryingToPost.id,
    );
    if (targetAppointment.status !== "completed") {
      throw new ForbiddenError({
        message: "Você ainda não pode avaliar este agendamento de aula.",
        action:
          "Verifique se o agendamento de aula que você selecionou já foi concluído.",
      });
    }

    if (userReviewerTryingToPost.role === "student") {
      if (userReviewerTryingToPost.id !== targetAppointment.student_id) {
        throw new ForbiddenError({
          message: "Você não pode avaliar este agendamento de aula.",
          action:
            "Só é permitido avaliar um agendamento de aula em que você é o aluno.",
        });
      }

      if (inputValues.reviewed_user_id !== targetAppointment.instructor_id) {
        throw new ForbiddenError({
          message: "Você não pode avaliar este agendamento de aula.",
          action:
            "Verifique se o agendamento de aula que você selecionou é do mesmo instrutor a ser avaliado.",
        });
      }
    } else if (userReviewerTryingToPost.role === "instructor") {
      if (userReviewerTryingToPost.id !== targetAppointment.instructor_id) {
        throw new ForbiddenError({
          message: "Você não pode avaliar este agendamento de aula.",
          action:
            "Só é permitido avaliar um agendamento de aula em que você é o instructor.",
        });
      }

      if (inputValues.reviewed_user_id !== targetAppointment.student_id) {
        throw new ForbiddenError({
          message: "Você não pode avaliar este agendamento de aula.",
          action:
            "Verifique se o agendamento de aula que você selecionou é do mesmo aluno a ser avaliado.",
        });
      }
    }
  }

  const newReview = await review.create(
    userReviewerTryingToPost.id,
    inputValues,
  );

  return response.status(201).json(newReview);
}
