import React, { useState, useRef, useEffect, useCallback } from "react";

// const Dropdown: React.FC = () => {
//   const [isOpen, setIsOpen] = useState<boolean>(false);
//   const [selectedValue, setSelectedValue] = useState<string>("");
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         dropdownRef.current &&
//         !dropdownRef.current.contains(event.target as Node)
//       ) {
//         setIsOpen(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [dropdownRef]);

//   const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     // form 제출 시 실행할 동작, 예를 들어 API 호출 등
//     alert(`선택된 값: ${selectedValue}`);
//   };

//   const handleSelect = (value: string) => {
//     setSelectedValue(value);
//     setIsOpen(false);
//   };

//   return (
//     <div className="relative" ref={dropdownRef}>
//       <form onSubmit={handleSubmit}>
//         <button
//           onClick={() => setIsOpen(!isOpen)}
//           className="px-4 py-2 text-white bg-blue-500 rounded focus:outline-none"
//           type="button"
//         >
//           {selectedValue || "판매중"}
//         </button>
//         {isOpen && (
//           <div className="absolute left-0 z-20 w-48 py-2 mt-2 bg-white rounded-md shadow-xl">
//             <button
//               onClick={() => handleSelect("판매중")}
//               className="text-sm중text-gray-700 block px-4 py-2 hover:bg-gray-100"
//             >
//               판매중
//             </button>
//             <button
//               onClick={() => handleSelect("예약중")}
//               className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//             >
//               예악됨
//             </button>
//             <button
//               onClick={() => handleSelect("판매완료")}
//               className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//             >
//               판매완료
//             </button>
//           </div>
//         )}
//         <input type="submit" hidden />
//       </form>
//     </div>
//   );
// };

const Dropdown: React.FC = () => {
  const [selectedValue, setSelectedValue] = useState<string>("초기값");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedValue(event.target.value);
    // handleSubmit()
  };


  const handleSubmit = useCallback(() => {
    console.log("handleSubmit: ", selectedValue);
    // form 제출 시 실행할 동작, 예를 들어 API 호출 등
    // alert(`선택된 값: ${selectedValue}`);
  }, [selectedValue]);

useEffect(() => {
  handleSubmit();
}, [handleSubmit, setSelectedValue])

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={selectedValue}
        onChange={handleChange}
        className="w-full p-2 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
        style={{ width: '100px' }}
      >
        <option className="p-2" value="판매중">판매중</option>
        <option className="p-2" value="예약중">예약중</option>
        <option className="p-2" value="거래완료">거래완료</option>
      </select>
      {/* <div>선택된 값: {selectedValue || '선택되지 않음'}</div> */}
    </form>
  );
};

export default Dropdown;
