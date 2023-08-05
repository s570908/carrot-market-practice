import { RegisterOptions, UseFormRegisterReturn } from "react-hook-form";

interface InputProps {
  label: string;
  name: string;
  kind?: "text" | "phone" | "price";
  register: UseFormRegisterReturn;
  type: string;
  placeholder?: string;
  // [key: string]: any;
}

/* defualt is kind="text" */
const Input = ({ kind = "text", name, label, register, type, placeholder }: InputProps) => {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {kind == "text" ? (
        <div className="mt-2 flex items-center shadow-sm">
          <input
            id={name}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
            {...register}
            type={type}
          />
        </div>
      ) : null}
      {kind == "phone" ? (
        <div className="mt-2 flex rounded-md shadow-sm ">
          <span className="flex select-none items-center justify-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
            +82
          </span>
          <input
            id={name}
            className="w-full rounded-r-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            {...register}
            type={type}
          />
        </div>
      ) : null}
      {kind == "price" ? (
        <div>
          <div className="relative mt-2 flex items-center rounded-md shadow-sm">
            <div className="pointer-events-none absolute left-0 flex items-center justify-center pl-3">
              <span className="text-sm text-gray-500">$</span>
            </div>
            <input
              id={name}
              {...register}
              className="w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pl-7 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              type={type}
              placeholder={placeholder}
              step="0.01"
            />
            <div className="pointer-events-none absolute right-0 flex items-center pr-3">
              <span className="text-gray-500">USD</span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Input;

/* 

import type { UseFormRegisterReturn } from "react-hook-form";

interface InputProps {
  label: string;
  name: string;
  kind?: "text" | "phone" | "price";
  type: string;
  register: UseFormRegisterReturn;
  placeholder?: string;
  value?: string;
}

export default function Input({
  label,
  name,
  kind = "text",
  register,
  type,
  placeholder,
  value,
}: InputProps) {
  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700" htmlFor={name}>
        {label}
      </label>
      {kind === "text" ? (
        <div className="relative flex items-center rounded-md shadow-sm">
          <input
            id={name}
            {...register}
            type={type}
            className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:border-orange-500 focus:outline-none focus:ring-orange-500"
            value={value}
          />
        </div>
      ) : null}
      {kind === "price" ? (
        <div className="relative flex items-center rounded-md shadow-sm">
          <div className="absolute left-0 flex items-center justify-center pl-3 pointer-events-none">
            <span className="text-sm text-gray-500">￦</span>
          </div>
          <input
            id={name}
            {...register}
            type={type}
            placeholder={placeholder}
            className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none pl-7 focus:border-orange-500 focus:outline-none focus:ring-orange-500"
          />
          <div className="absolute right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-gray-500">KRW</span>
          </div>
        </div>
      ) : null}
      {kind === "phone" ? (
        <div className="flex rounded-md shadow-sm">
          <span className="flex items-center justify-center px-3 text-sm text-gray-500 border border-r-0 border-gray-300 select-none rounded-l-md bg-gray-50">
            +82
          </span>
          <input
            id={name}
            {...register}
            type={type}
            className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md rounded-l-none shadow-sm appearance-none focus:border-orange-500 focus:outline-none focus:ring-orange-500"
          />
        </div>
      ) : null}
    </div>
  );
}

 */
