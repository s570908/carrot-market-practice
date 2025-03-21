"use client";
import React, { useState, useRef, useEffect } from "react";

const TimeInput = () => {
  const [value, setValue] = useState("");
  const [displayValue, setDisplayValue] = useState<number | null>(null);
  const [prevValue, setPrevValue] = useState("");

  interface CorrectInputProps {
    inputValue: string;
  }

  useEffect(() => {
    const now = new Date();
    let hours = now.getHours();
    if (hours > 12) {
      hours = hours - 12;
    }
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    setValue(formattedHours);
    setPrevValue(formattedHours);
  }, []);

  const correctInput = ({ inputValue }: CorrectInputProps): void => {
    console.log("correctInput--inputValue: ", inputValue);

    let valueTmp = inputValue.replace(/[^0-9]/g, "");

    console.log(
      "correctInput--initial: value[0], value[1]: ",
      valueTmp[0],
      valueTmp[1]
    );

    let firstDigit = parseInt(valueTmp[0]);
    let secondDigit: number | undefined = parseInt(valueTmp[1]);

    if (valueTmp.length === 2 && firstDigit * 10 + secondDigit > 12) {
      //console.log("correctInput--firstDigit, secondDigit: ", firstDigit, secondDigit);
      return;
    }

    if (valueTmp.length > 2) {
      valueTmp = valueTmp.slice(0, 2);
    }

    if (valueTmp.length === 2) {
      if (firstDigit === 1 && secondDigit > 2) {
        //secondDigit = firstDigit;
        secondDigit = undefined;
      }

      valueTmp = `${firstDigit}${secondDigit ?? ""}`;
    }

    if (valueTmp.length === 0) {
      valueTmp = "";
    }
    console.log(
      "correctInput--final: value[0], value[1]: ",
      valueTmp[0],
      valueTmp[1]
    );

    if (value.length === 2 && prevValue.length !== 2) {
      setPrevValue(value);
    }
    setValue(valueTmp);
  };

  const handleComplete = () => {
    const numberValue = parseInt(value, 10);
    setDisplayValue(isNaN(numberValue) ? null : numberValue);
    setPrevValue(value);
    console.log("완료 되었다. handleComplete--numberValue: ", numberValue);
  };

  useEffect(() => {
    if (
      value.length === 2 &&
      prevValue.length === 2 &&
      value[1] !== prevValue[1]
    ) {
      const numberValue = parseInt(value, 10);
      if (numberValue >= 0 && numberValue <= 12) {
        console.log("useEffect--prevValue, value: ", prevValue, value);
        handleComplete();
      }
    }
    //setPrevValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div>
      <label htmlFor="timeInput">시간 입력 (00~12):</label>
      <input
        type="text"
        id="timeInput"
        maxLength={2}
        value={value}
        onChange={(e) => correctInput({ inputValue: e.target.value })}
        placeholder={value}
      />
      <button onClick={handleComplete}>완료</button>
      <div>
        <p>
          완료되기전 숫자:{" "}
          {prevValue !== null && prevValue !== undefined ? prevValue : "00"}
        </p>
        <p>
          완료된 숫자:{" "}
          {displayValue !== null && displayValue !== undefined
            ? displayValue
            : "00"}
        </p>
      </div>
    </div>
  );
};

export default TimeInput;
