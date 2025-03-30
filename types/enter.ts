export type MethodType = "email" | "phone";

export interface EnterForm {
  email?: string;
  phone?: string;
}

export interface TokenForm {
  token: string;
}

export interface BaseMutation {
  ok: boolean;
}
