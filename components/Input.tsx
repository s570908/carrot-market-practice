// interface InputProps {
//   label: string;
//   name: string;
//   kind?: "text" | "phone" | "price";
//   [key: string]: any;
// }

// /* defualt is kind="text" */
// const Input = ({ name, label, kind = "text", rest }: InputProps) => {
//   return (
//     <div>
//       <label htmlFor={name} className="text-sm font-medium text-gray-700">
//         {label}
//       </label>
//       {kind == "text" ? (
//         <div className="flex items-center mt-2 shadow-sm">
//           <input
//             id={name}
//             {...rest}
//             className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 rounded-md shadow-sm appearance-none focus:border-orange-500 focus:outline-none focus:ring-orange-500"
//           />
//         </div>
//       ) : null}
//       {kind == "phone" ? (
//         <div className="flex mt-2 rounded-md shadow-sm">
//           <span className="flex items-center justify-center px-3 text-sm text-gray-500 border border-r-0 border-gray-300 select-none rounded-l-md bg-gray-50">
//             +82
//           </span>
//           <input
//             id="input"
//             type="number"
//             className="w-full px-3 py-2 placeholder-gray-400 border border-gray-300 shadow-sm appearance-none rounded-r-md focus:border-orange-500 focus:outline-none focus:ring-orange-500"
//             required
//           />
//         </div>
//       ) : null}
//     </div>
//   );
// };

// export default Input;
interface InputProps {
  kind?: "text" | "phone";
  name: string;
  label: string;
  [key: string]: any;
}

const Input = ({ kind = "text", name, label, rest }: InputProps) => {
  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {kind == "text" ? (
        <input
          id={name}
          className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
          {...rest}
        />
      ) : null}
      {kind == "phone" ? (
        <div className="mt-2 flex rounded-md shadow-sm ">
          <span className="flex select-none items-center justify-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
            +82
          </span>
          <input
            id={name}
            className="w-full rounded-r-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
            {...rest}
          />
        </div>
      ) : null}
    </div>
  );
};

export default Input;
