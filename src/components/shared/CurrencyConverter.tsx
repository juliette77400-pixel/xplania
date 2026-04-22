// ✨ NEW — Convertisseur de devise (Frankfurter API)
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRightLeft, Loader2, Coins } from "lucide-react";
import { convert, guessCurrency, SUPPORTED_CURRENCIES } from "@/lib/currency";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Props {
  destination?: string | null;
  defaultFrom?: string;
}

const CurrencyConverter = ({ destination, defaultFrom = "EUR" }: Props) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(() => guessCurrency(destination));
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setTo(guessCurrency(destination));
  }, [destination]);

  useEffect(() => {
    const value = parseFloat(amount);
    if (Number.isNaN(value) || value <= 0) {
      setResult(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(false);
    convert(value, from, to)
      .then((r) => {
        if (cancelled) return;
        setResult(r.result);
        setRate(r.rate);
      })
      .catch(() => !cancelled && setError(true))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [amount, from, to]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Coins className="w-4 h-4 text-primary" />
        {t("currency.title")}
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
        <div className="space-y-1">
          <Input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-sm"
            min="0"
          />
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-60">
              {SUPPORTED_CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="icon" onClick={swap} className="h-8 w-8" aria-label={t("currency.swap")}>
          <ArrowRightLeft className="w-4 h-4" />
        </Button>
        <div className="space-y-1">
          <div className="flex items-center justify-end h-9 px-3 rounded-md border border-input bg-muted/30 text-sm font-semibold">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : error ? "—" : result !== null ? result.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
          </div>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-60">
              {SUPPORTED_CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {rate && !error && (
        <p className="text-[11px] text-muted-foreground">
          1 {from} = {rate.toLocaleString(undefined, { maximumFractionDigits: 4 })} {to} · {t("currency.source")}
        </p>
      )}
      {error && <p className="text-[11px] text-destructive">{t("currency.error")}</p>}
    </div>
  );
};

export default CurrencyConverter;
