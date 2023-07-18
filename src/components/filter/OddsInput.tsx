import { AmericanOdds } from "../../enums";
import "./OddsInput.css";
import { useState, ChangeEvent } from "react";

interface OddsInputProps {
  sign: string;
  value: AmericanOdds;
  setValue: React.Dispatch<React.SetStateAction<AmericanOdds>>;
}

function convertToAmericanOdds(str: string, positive: boolean): AmericanOdds {
  const number = parseFloat(str);
  if (isNaN(number)) {
    return null;
  }
  if (positive) return { value: number };
  else return { value: -number };
}

function convertFromAmericanOdds(americanOdds: AmericanOdds): string {
  if (americanOdds === null) {
    return "";
  }
  return Math.abs(americanOdds.value).toString();
}

export default function OddsInput({ sign, value, setValue }: OddsInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;

    const numericValue = inputValue.replace(/^0+/, "").replace(/\D/g, "");
    setValue(convertToAmericanOdds(numericValue, sign === "+"));
  };

  const handleBlur = () => {
    if (value && Math.abs(value.value) < 100) {
      setValue(null);
    }
  };

  return (
    <div className="odds-input">
      <span className="input-prefix">{sign}</span>
      <input
        className="min-odds-input"
        type="text"
        inputMode="numeric"
        maxLength={4}
        pattern="[0-9]+"
        placeholder="500"
        value={convertFromAmericanOdds(value)}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </div>
  );
}
