import { useState, useEffect, Dispatch, SetStateAction } from "react";

const useLocalStorageState = <T>(key: string, initialValue: T, normalize?: (value: T) => T): [T, Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    const localStorageValue = localStorage.getItem(key);
    const value = localStorageValue ? JSON.parse(localStorageValue) : initialValue;
    return normalize ? normalize(value) : value;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
};

export default useLocalStorageState;
