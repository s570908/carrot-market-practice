import { Stream } from "@prisma/client";

export interface CreateForm {
  name: string;
  price: number;
  description: string;
}

export interface CreateResponse {
  ok: boolean;
  message?: string; // 성공 또는 오류 메시지
  error?: string; // 실패 시 오류 세부 정보
  stream?: Stream; // 선택적, 성공 시에만 존재
}
