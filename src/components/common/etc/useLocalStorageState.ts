import { useState, useEffect, Dispatch, SetStateAction } from "react";

const useLocalStorageState = <T>(
  key: string,
  initialValue: T,
  normalize?: (value: T) => T,
): [T, Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const localStorageValue = localStorage.getItem(key);
      const value = localStorageValue ? JSON.parse(localStorageValue) : initialValue;
      return normalize ? normalize(value) : value;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Preferences still work when browser storage is unavailable.
    }
  }, [key, state]);

  return [state, setState];
};

export default useLocalStorageState;
