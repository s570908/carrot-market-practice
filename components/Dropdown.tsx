import React, { useState } from "react";

const Dropdown: React.FC = () => {
  const [selectedValue, setSelectedValue] = useState<string>("판매중");

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedValue(value);
    console.log("selectedValue: ", selectedValue);
    console.log("To do send the selectedValue to api server");
  };

  const handleMouseDown = (
    event: React.MouseEvent<HTMLSelectElement, MouseEvent>
  ) => {
    event.stopPropagation(); // Stop event propagation on mouse down
  };

  return (
    <select
      onClick={(e) => e.stopPropagation()}
      value={selectedValue}
      onChange={handleChange}
      onMouseDown={handleMouseDown}
      className="w-full p-2 bg-white border border-gray-300 rounded-md focus:border-blue-500 focus:outline-none"
      style={{ width: "100px" }}
    >
      <option className="p-2" value="판매중">
        판매중
      </option>
      <option className="p-2" value="예약중">
        예약중
      </option>
      <option className="p-2" value="거래완료">
        거래완료
      </option>
    </select>
  );
};

export default Dropdown;
