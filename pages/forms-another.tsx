import React, { useState } from "react";
import { FieldErrors, useForm } from "react-hook-form";

// 적은 코드 라인
// 더 나은 유효성 검사
// 더 나은 오류(set, clear, display)
// input 컨트롤
// 이벤트 핸들링 단순화
// input을 쉽게 작성

interface LoginForm {
  username: string;
  password: string;
  email: string;
}

export default function Forms() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    mode: "onChange",
  });

  const onValid = (data: LoginForm) => {
    console.log("im valid");
  };
  const onInvalid = (errors: FieldErrors) => {
    console.log(errors);
  };
  return (
    <form onSubmit={handleSubmit(onValid, onInvalid)}>
      <input
        {...register("username", {
          required: "Username is required",
          minLength: {
            message: "이름은 최소 2글자 이상이어야 합니다.",
            value: 2,
          },
        })}
        type="text"
        placeholder="Username"
      />
      <input
        {...register("email", {
          required: "Email is required",
          validate: {
            notMail: (value: string) =>
              /[a-z0-9._%+-]+@[a-z0-9.-]+.[a-z]{2,3}$/.test(value) || "이메일 양식을 지켜라",
          },
        })}
        type="email"
        placeholder="Email"
      />
      {errors.email?.message}
      <input
        {...register("password", {
          required: "Password is required",
          validate: {
            notPwd: (value: string) =>
              /[a-z0-9]+[!@#$%^&]{1,}$/.test(value) || "비밀번호 양식을 지켜라",
          },
        })}
        type="password"
        placeholder="Password"
      />
      {errors.password?.message}
      <input type="submit" value="Create Account" />
    </form>
  );
}
