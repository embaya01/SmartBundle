export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  wait = 300,
) {
  let timer: number | undefined;

  const debounced = (...args: TArgs) => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }

    timer = window.setTimeout(() => {
      fn(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timer = undefined;
    }
  };

  return debounced;
}
