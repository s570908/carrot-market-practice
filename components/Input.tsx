import type { UseFormRegisterReturn } from "react-hook-form";

interface InputProps {
  label: string;
  name: string;
  kind?: "text" | "phone" | "price";
  type: string;
  register: UseFormRegisterReturn;
  required?: boolean;
  placeholder?: string;
  error?: string; // error 속성 추가
}

export default function Input({
  label,
  name,
  kind = "text",
  register,
  type,
  required,
  placeholder,
  error, // error 매개변수 추가
}: InputProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={name}>
        {label}
      </label>
      {kind === "text" ? (
        <div className="relative flex items-center rounded-md shadow-sm">
          <input
            id={name}
            required={required}
            {...register}
            type={type}
            placeholder={placeholder}
            className="w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
          />
        </div>
      ) : null}
      {kind === "price" ? (
        <div className="relative flex items-center rounded-md shadow-sm">
          <div className="pointer-events-none absolute left-0 flex items-center justify-center pl-3">
            <span className="text-sm text-gray-500">￦</span>
          </div>
          <input
            id={name}
            required={required}
            {...register}
            type={type}
            placeholder={placeholder}
            className="w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pl-7 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
          />
        </div>
      ) : null}
      {kind === "phone" ? (
        <div className="flex rounded-md shadow-sm">
          <span className="flex select-none items-center justify-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
            +82
          </span>
          <input
            id={name}
            required={required}
            {...register}
            type={type}
            placeholder={placeholder}
            className="w-full appearance-none rounded-md rounded-l-none border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
          />
        </div>
      ) : null}

      {/* 오류 메시지 표시 부분 추가 */}
      {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
    </div>
  );
}
