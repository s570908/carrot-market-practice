import { BaseMutation, TokenForm } from "@/types";
import aclient from "./aclient";

export async function writeConfirm(validForm: TokenForm) {
  const response = await aclient.post<BaseMutation>(`/api/users/confirm`, validForm);
  return response.data;
}
