import { FieldErrors, useForm } from "react-hook-form";

// Less code ( checked )
// Better validation
// Better Errors (set, clear, display)
// Have contro over inputs
// Dont deal with events ( checked )
// Easier Inputs ( checked )

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
  errors?: string;
}

export default function Forms() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    reset,
    resetField,
  } = useForm<LoginForm>({
    mode: "onChange",
    defaultValues: {
      //   username: "hyunseo",
    },
  });
  const onValid = (data: LoginForm) => {
    console.log("im valid bby");
    // setValue("username", "hello");
    setError("errors", { message: "Backend is offline sorry." });
    reset();
    resetField("password");
  };
  const onInvalid = (errors: FieldErrors) => {
    console.log(errors);
  };
  console.log("watch: email and username ", watch("email"), watch("username"));

  // $ yarn build를 할 때 다음과 같은 에러가 발생하여 setValue("username", "hello")를 코멘트아웃하였다.
  // build를 할 때 setValue를 수행하면 infinite loop가 발생하는 듯....
  // 에러....
  // Generating static pages (0/23)Error: Minified React error #301;
  // visit https://reactjs.org/docs/error-decoder.html?invariant=301 for the full message
  // or use the non-minified dev environment for full errors and additional helpful warnings.

  // setValue("username", "hello");

  return (
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
        {...register("email", {
          required: "Email is required",
          validate: {
            notGmail: (value) => !value.includes("@gmail.com") || "Gmail is not allowed",
          },
        })}
        type="email"
        placeholder="Email"
        className={`${
          Boolean(errors.email?.message)
            ? "border-red-500 outline-none focus:border-red-500 focus:outline-none focus:ring-0"
            : ""
        }`}
      />
      {errors.email?.message}
      <input
        {...register("password", { required: "Password is required" })}
        type="password"
        placeholder="Password"
      />
      <input type="submit" value="Create Account" />
      {errors.errors?.message}
    </form>
  );
}
