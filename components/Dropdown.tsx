// import React, { useState } from "react";

// const Dropdown: React.FC = () => {
//   const [selectedValue, setSelectedValue] = useState<string>("판매중");

//   const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     const value = event.target.value;
//     setSelectedValue(value);
//     console.log("selectedValue: ", selectedValue);
//     console.log("To do send the selectedValue to api server");
//   };

//   const handleMouseDown = (
//     event: React.MouseEvent<HTMLSelectElement, MouseEvent>
//   ) => {
//     event.stopPropagation(); // Stop event propagation on mouse down
//   };

//   return (
//     <select
//       onClick={(e) => e.stopPropagation()}
//       value={selectedValue}
//       onChange={handleChange}
//       onMouseDown={handleMouseDown}
//       className="w-full p-2 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
//       style={{ width: "100px" }}
//     >
//       <option className="p-2" value="판매중">
//         판매중
//       </option>
//       <option className="p-2" value="예약중">
//         예약중
//       </option>
//       <option className="p-2" value="거래완료">
//         거래완료
//       </option>
//     </select>
//   );
// };

// export default Dropdown;

import React from "react";

// props로 options 배열과 선택 변경 핸들러를 받습니다.
function Dropdown({
  options,
  value,
  onChange,
}: {
  options: any;
  value: string;
  onChange: any;
}) {
  return (
    <select
      className="rounded-full"
      onClick={(e) => e.stopPropagation()}
      // value={value}
      value=""
      onChange={onChange}
    >
      <option value="" hidden>
        상태 변경
      </option>
      {options.map((option: any) =>
        option.active ? (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ) : (
          <option key={option.value} value={option.value} hidden>
            {option.label}
          </option>
        )
      )}
    </select>
  );
}

export default Dropdown;
