import { useState } from "react";
import RadioButtonGroup from "../components/RadioButtonGroup";
import { NextPage } from "next";

const Home: NextPage = () => {
  const [selectedOption, setSelectedOption] = useState<string>("전체"); // Default selection

  const options = [
    { value: "판매중", label: "판매중" },
    { value: "거래완료", label: "거래완료" },
    { value: "예약중", label: "예약중" },
    { value: "전체", label: "전체" },
  ];

  const handleOptionChange = (value: string) => {
    console.log("Selected value:", value); // Handle the selected value
    setSelectedOption(value); // Update the selected value in state
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <RadioButtonGroup
        options={options}
        selectedOption={selectedOption}
        onChange={handleOptionChange}
      />
    </div>
  );
};

export default Home;
