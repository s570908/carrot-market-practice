import { NextPage } from "next";
import { UseFormRegisterReturn } from "react-hook-form";

interface InputProps {
  register: UseFormRegisterReturn;
  label: string;
  name: string;
  kind?: "text" | "phone" | "price";
  type: string;
  placeholder?: string;
  //[key: string]: any;
}

// register
/* 
{
  onChange: ChangeHandler;
  onBlur: ChangeHandler;
  ref: RefCallBack;
  name: TFieldName;
  min?: string | number | undefined;
  max?: string | number | undefined;
  maxLength?: number | undefined;
  minLength?: number | undefined;
  pattern?: string | undefined;
  required?: boolean | undefined;
  disabled?: boolean | undefined;
} 
*/
//

const Input = ({ register, label, name, kind = "text", type, placeholder = "" }: InputProps) => {
  console.log("Input-- type, kind: ", type, kind);
  return (
    <div>
      {kind === "text" ? (
        <div>
          <label htmlFor={name} className="mb-2 block text-sm font-medium text-gray-700">
            {label}
          </label>
          <input
            type={type}
            {...register}
            id={name}
            placeholder={placeholder}
            className="w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
      ) : null}
      {kind === "phone" ? (
        <div>
          <label htmlFor={name} className="mb-2 block text-sm font-medium text-gray-700">
            {label}
          </label>
          <div className="flex">
            <span className="flex items-center justify-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500">
              +82
            </span>
            <input
              type={type}
              {...register}
              id={name}
              placeholder={placeholder}
              className="no-spinner w-full rounded-r-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      ) : null}
      {kind === "price" ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor={name}>
            {label}
          </label>
          <div className="relative flex items-center rounded-md shadow-sm">
            <div className="pointer-events-none absolute left-0 flex items-center justify-center pl-3">
              <span className="text-sm text-gray-500">$</span>
            </div>
            <input
              {...register}
              id="price"
              className="w-full appearance-none rounded-md border border-gray-300 px-3 py-2 pl-7 pr-14 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              type={type}
              placeholder={placeholder}
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
