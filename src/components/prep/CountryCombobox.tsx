// Country field with suggestions (keyboard friendly). Stores the ISO code.
import { useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { countryList } from "@/lib/countries";

interface Props {
  label: string;
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  optional?: boolean;
  autoFocus?: boolean;
}

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const CountryCombobox = ({ label, value, onChange, placeholder, autoFocus }: Props) => {
  const id = useId();
  const selectedName = countryList.find((c) => c.code === value)?.name || "";
  const [query, setQuery] = useState(selectedName);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const q = normalize(query);
    if (!q || q === normalize(selectedName)) return [];
    const starts = countryList.filter((c) => normalize(c.name).startsWith(q));
    const contains = countryList.filter((c) => !normalize(c.name).startsWith(q) && normalize(c.name).includes(q));
    return [...starts, ...contains].slice(0, 6);
  }, [query, selectedName]);

  const pick = (code: string, name: string) => {
    onChange(code);
    setQuery(name);
    setOpen(false);
  };

  const onType = (text: string) => {
    setQuery(text);
    setOpen(true);
    setActive(0);
    const exact = countryList.find((c) => normalize(c.name) === normalize(text));
    onChange(exact ? exact.code : "");
  };

  const listId = `${id}-list`;
  const showList = open && matches.length > 0;

  return (
    <div className="relative space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        autoFocus={autoFocus}
        value={query}
        placeholder={placeholder}
        onChange={(e) => onType(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!showList) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, matches.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); const m = matches[active]; if (m) pick(m.code, m.name); }
          else if (e.key === "Escape") setOpen(false);
        }}
        className="h-12 text-base"
      />
      {showList && (
        <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-xl">
          {matches.map((c, i) => (
            <li key={c.code} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(c.code, c.name)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm ${i === active ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CountryCombobox;
