import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { debounce } from '../lib/debounce';

interface SearchBarProps {
  value: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

const SearchBar = ({
  value,
  onSearch,
  placeholder = 'Search bundles by name, service, or provider...',
  debounceMs = 300,
}: SearchBarProps) => {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const debouncedSearch = useMemo(() => debounce(onSearch, debounceMs), [onSearch, debounceMs]);

  useEffect(
    () => () => {
      debouncedSearch.cancel();
    },
    [debouncedSearch],
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    debouncedSearch(nextValue);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    debouncedSearch.cancel();
    onSearch(inputValue.trim());
  };

  const handleClear = () => {
    setInputValue('');
    debouncedSearch.cancel();
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-soft">
      <div className="flex w-full items-center gap-3">
        <span aria-hidden className="text-slate-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="search"
          value={inputValue}
          onChange={handleChange}
          aria-label="Search bundles"
          placeholder={placeholder}
          className="flex-1 border-none bg-transparent text-lg font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      {inputValue ? (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500 transition hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          Clear
        </button>
      ) : null}
      <button
        type="submit"
        className="rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
