import { cls } from "@libs/utils";
import { useState } from "react";
import { FieldErrors, useForm } from "react-hook-form";

// Less code ( checked )
// Better validation
// Better Errors (set, clear, display)
// Have contro over inputs
// Dont deal with events ( checked )
// Easier Inputs ( checked )

interface LoginForm {
  username: string;
  password: string;
  email: string;
  errors?: string;
}

export default function Forms() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    resetField,
  } = useForm<LoginForm>({
    mode: "onChange",
    defaultValues: {
      username: "hyunseo",
    },
  });
  const onValid = (data: LoginForm) => {
    console.log("im valid bby. data: ", data);
    // 비동기 http post 수행 후 에러처리 시에 사용될 수 있다.
    if (data.email === "client0@client.com") {
      console.log("setError 들어가기 직전 data: ", data);
      setError(
        "email", // 에러 핸들링할 input요소 name
        { message: "금지된 이메일울 사용하셨습니다. 새로운 이메일을 넣으세요" }, // 에러 메세지
        { shouldFocus: true } // 에러가 발생한 input으로 focus 이동
      );
    } else {
      //reset();
      resetField("password");
    }
    console.log("after reset. data: ", data);
  };
  const onInvalid = (errors: FieldErrors) => {
    console.log("에러 메시지", errors);
  };
  console.log('watch("email"): ', watch("email"));
  return (
    <div>
      <form onSubmit={handleSubmit(onValid, onInvalid)}>
        <input
          {...register("username", {
            required: "Username is required",
            minLength: {
              message: "The username should be longer than 5 chars.",
              value: 5,
            },
          })}
          type="text"
          placeholder="Username"
        />
        <input
          className={cls(
            errors?.email?.message
              ? "border-red-500 outline-none focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1"
              : ""
          )}
          {...register("email", {
            required: "Email is required",
            validate: {
              notGmail: (value) => {
                if (value.includes("@gmail.com")) {
                  return "Gmail is not allowed";
                }
              },
            },
          })}
          type="email"
          placeholder="Email"
        />

        <input
          {...register("password", { required: "Password is required" })}
          type="password"
          placeholder="Password"
        />
        <input type="submit" value="Create Account" />
      </form>
      {errors && (
        <div>
          {errors.username?.message} <br /> {errors.email?.message}
          <br /> {errors.password?.message}{" "}
        </div>
      )}
    </div>
  );
}
