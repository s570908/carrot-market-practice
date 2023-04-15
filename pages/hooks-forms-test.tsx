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
}

export default function Forms() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {},
  });
  const onValid = (data: LoginForm) => {
    console.log("im valid bby");
  };
  const onInvalid = (errors: FieldErrors) => {
    console.log("에러 메시지", errors);
  };
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
          {...register("email", { required: "Email is required" })}
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
          <br /> {errors.password?.message}
        </div>
      )}
    </div>
  );
}
