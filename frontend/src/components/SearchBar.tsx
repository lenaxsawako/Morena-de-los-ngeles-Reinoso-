import type { ChangeEvent } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Buscar libros...",
}: SearchBarProps) {
  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="
          w-full
          rounded-xl
          border
          px-4
          py-3
          outline-none
          focus:ring-2
          focus:ring-blue-500
        "
      />
    </div>
  );
}