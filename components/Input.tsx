import { NextPage } from "next";

interface InputProps {
  label: string;
  name: string;
  kind?: "text" | "phone";
  [key: string]: any;
}

const Input = ({ label, name, kind = "text", ...rest }: InputProps) => {
  return (
    <div>
      {kind === "text" ? (
        <div>
          <label htmlFor={name} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          <input
            id={name}
            className="mt-2 w-full appearance-none rounded-md border border-gray-300 py-2 px-3 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
            {...rest}
          />
        </div>
      ) : null}
      {kind === "phone" ? (
        <div>
          <label htmlFor={name} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          <div className="flex">
            <span className="mt-2 flex items-center justify-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 py-2 px-3 text-sm text-gray-500">
              +82
            </span>
            <input
              id={name}
              className="no-spinner mt-2 w-full rounded-r-md border border-gray-300 py-2 px-3 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              {...rest}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default Input;
