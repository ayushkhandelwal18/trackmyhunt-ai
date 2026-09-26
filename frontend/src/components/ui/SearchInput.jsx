import { Search } from "lucide-react";

function SearchInput({ value, onChange, placeholder = "Search..." }) {
  return <label className="app-search"><Search size={17} /><span className="sr-only">{placeholder}</span><input value={value} onChange={onChange} placeholder={placeholder} /></label>;
}

export default SearchInput;