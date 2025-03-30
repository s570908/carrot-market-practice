import { Post } from "@prisma/client";

export interface WritePostParams {
  validForm: {
    question: string;
    latitude?: number;
    longitude?: number;
  };
}

export interface WriteForm {
  question: string;
}

export interface WriteResponse {
  ok: boolean;
  post: Post;
}
