import type { ReactNode } from "react";

interface Props {
  selected: boolean;
  label: string;
  hint?: string;
  icon?: ReactNode;
  onClick: () => void;
  large?: boolean;
}

/** Selectable option pill with an optional one-line explanation underneath. */
const OptionButton = ({ selected, label, hint, icon, onClick, large }: Props) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`${large ? "px-5 py-3" : "px-4 py-2"} rounded-xl text-sm transition-all flex flex-col items-start text-left max-w-[15rem] ${
      selected ? "gradient-button text-primary-foreground" : "glass-card text-foreground hover:bg-muted"
    }`}
  >
    <span className="flex items-center gap-2 font-semibold">{icon}{label}</span>
    {hint && (
      <span className={`mt-0.5 text-xs leading-snug font-normal ${selected ? "text-primary-foreground/85" : "text-muted-foreground"}`}>
        {hint}
      </span>
    )}
  </button>
);

export default OptionButton;
