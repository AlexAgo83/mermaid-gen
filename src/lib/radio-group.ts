export function getNextWrappedRadioValue<T>(
  values: readonly T[],
  currentValue: T,
  key: string,
) {
  const delta =
    key === "ArrowRight" || key === "ArrowDown"
      ? 1
      : key === "ArrowLeft" || key === "ArrowUp"
        ? -1
        : 0;

  if (delta === 0) {
    return null;
  }

  const currentIndex = values.indexOf(currentValue);

  if (currentIndex === -1) {
    return null;
  }

  return values[(currentIndex + delta + values.length) % values.length] ?? null;
}
