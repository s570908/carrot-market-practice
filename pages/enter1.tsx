import { useState } from "react";

type MethodType = "email" | "phone";

function cls(...classNames: string[]) {
  return classNames.join(" ");
}

export default function Enter() {
  const [method, setMethod] = useState<MethodType>("email");
  const onEmailClick = () => {
    setMethod("email");
  };
  const onPhoneClick = () => {
    setMethod("phone");
  };
  return (
    <div className="mt-16 px-4">
      <div className="text-center text-3xl font-bold">Enter to Carrot</div>

      <div className="mt-8 flex flex-col items-center ">
        <h5 className="text-center text-sm font-medium text-gray-500">Enter using:</h5>
        <div className="mt-8 grid w-full grid-cols-2 gap-16 border-b-2 border-gray-100">
          <button
            onClick={onEmailClick}
            className={cls(
              "border-b-2 pb-4 font-medium",
              method === "email" ? "text-orange-500 focus:border-orange-500" : "text-gray-500"
            )}
          >
            Email
          </button>
          <button
            onClick={onPhoneClick}
            className={cls(
              "border-b-2 pb-4 font-medium",
              method === "phone" ? "text-orange-500 focus:border-orange-500" : "text-gray-500"
            )}
          >
            phone
          </button>
        </div>
      </div>

      <form className="mt-8 flex flex-col">
        {method == "email" ? (
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              className="mt-2 w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500  focus:outline-none focus:ring-orange-500"
            />
            <button className="mt-6 w-full rounded-md bg-orange-500  px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600">
              Get login link
            </button>
          </div>
        ) : null}
        {method == "phone" ? (
          <div>
            <label htmlFor="phone" className="text-sm font-medium text-gray-700">
              Phone number
            </label>

            <div className="mt-2 flex">
              <div className="rounded-l-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-500">
                <span>+82</span>
              </div>
              <input
                id="phone"
                type="number"
                className="w-full rounded-r-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              />
            </div>
            <button className="mt-6 w-full rounded-md bg-orange-500  px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
              Get one-time password
            </button>
          </div>
        ) : null}
      </form>

      <div>Or enter with</div>

      <div>
        <div>비둘기 Input</div>
        <div>고양이 Input</div>
      </div>
    </div>
  );
}
