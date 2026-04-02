import { useEffect, useState } from "react";

export function useLocalStorageState(key: string, fallbackValue: string) {
  const [value, setValue] = useState(() => {
    if (typeof window === "undefined") {
      return fallbackValue;
    }

    const storedValue = window.localStorage.getItem(key);
    return storedValue ?? fallbackValue;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (value) {
      window.localStorage.setItem(key, value);
      return;
    }

    window.localStorage.removeItem(key);
  }, [key, value]);

  return [value, setValue] as const;
}
