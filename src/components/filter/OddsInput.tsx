import "./OddsInput.css";
import { useState, ChangeEvent } from "react";

interface OddsInputProps {
  sign: string;
}

export default function OddsInput({ sign }: OddsInputProps) {
  const [value, setValue] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;

    const numericValue = inputValue.replace(/\D/g, "");
    setValue(numericValue);
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
        value={value}
        onChange={handleChange}
      ></input>
    </div>
  );
}
