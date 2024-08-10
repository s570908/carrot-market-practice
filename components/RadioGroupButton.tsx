import React, { useState, ChangeEvent } from "react";

interface Option {
  value: string;
  label: string;
}

interface RadioButtonGroupProps {
  options: Option[];
  selectedOption: string; // Controlled selected value
  onChange?: (value: string) => void; // Prop for handling option changes
}

const RadioButtonGroup: React.FC<RadioButtonGroupProps> = ({
  options,
  selectedOption,
  onChange,
}) => {
  const handleOptionChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;

    console.log("event.target.value: ", value);

    if (onChange) {
      onChange(value); // Call the custom onChange handler if provided
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex gap-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center rounded-full border-2 px-1 py-1 text-sm ${
              selectedOption === option.value
                ? "border-blue-500 bg-blue-500 text-white"
                : "border-gray-300 bg-white text-black"
            }`}
          >
            <input
              type="radio"
              name="options"
              value={option.value}
              checked={selectedOption === option.value}
              onChange={handleOptionChange}
              className="hidden"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
};

export default RadioButtonGroup;
