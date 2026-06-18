import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDownUp, Loader2, Coins, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { guessCurrency } from "@/lib/currency";

interface Props {
  destination?: string | null;
  defaultFrom?: string;
}

// 50 most-used travel currencies with flag emoji + name
const CURRENCIES: { code: string; flag: string; name: string }[] = [
  { code: "EUR", flag: "🇪🇺", name: "Euro" },
  { code: "USD", flag: "🇺🇸", name: "US Dollar" },
  { code: "GBP", flag: "🇬🇧", name: "British Pound" },
  { code: "JPY", flag: "🇯🇵", name: "Japanese Yen" },
  { code: "THB", flag: "🇹🇭", name: "Thai Baht" },
  { code: "AUD", flag: "🇦🇺", name: "Australian Dollar" },
  { code: "CAD", flag: "🇨🇦", name: "Canadian Dollar" },
  { code: "CHF", flag: "🇨🇭", name: "Swiss Franc" },
  { code: "SGD", flag: "🇸🇬", name: "Singapore Dollar" },
  { code: "HKD", flag: "🇭🇰", name: "Hong Kong Dollar" },
  { code: "NZD", flag: "🇳🇿", name: "New Zealand Dollar" },
  { code: "MXN", flag: "🇲🇽", name: "Mexican Peso" },
  { code: "BRL", flag: "🇧🇷", name: "Brazilian Real" },
  { code: "INR", flag: "🇮🇳", name: "Indian Rupee" },
  { code: "IDR", flag: "🇮🇩", name: "Indonesian Rupiah" },
  { code: "MYR", flag: "🇲🇾", name: "Malaysian Ringgit" },
  { code: "PHP", flag: "🇵🇭", name: "Philippine Peso" },
  { code: "VND", flag: "🇻🇳", name: "Vietnamese Dong" },
  { code: "KRW", flag: "🇰🇷", name: "South Korean Won" },
  { code: "TWD", flag: "🇹🇼", name: "Taiwan Dollar" },
  { code: "ZAR", flag: "🇿🇦", name: "South African Rand" },
  { code: "AED", flag: "🇦🇪", name: "UAE Dirham" },
  { code: "SAR", flag: "🇸🇦", name: "Saudi Riyal" },
  { code: "QAR", flag: "🇶🇦", name: "Qatari Riyal" },
  { code: "KWD", flag: "🇰🇼", name: "Kuwaiti Dinar" },
  { code: "TRY", flag: "🇹🇷", name: "Turkish Lira" },
  { code: "PLN", flag: "🇵🇱", name: "Polish Zloty" },
  { code: "CZK", flag: "🇨🇿", name: "Czech Koruna" },
  { code: "HUF", flag: "🇭🇺", name: "Hungarian Forint" },
  { code: "RON", flag: "🇷🇴", name: "Romanian Leu" },
  { code: "SEK", flag: "🇸🇪", name: "Swedish Krona" },
  { code: "NOK", flag: "🇳🇴", name: "Norwegian Krone" },
  { code: "DKK", flag: "🇩🇰", name: "Danish Krone" },
  { code: "ISK", flag: "🇮🇸", name: "Icelandic Krona" },
  { code: "MAD", flag: "🇲🇦", name: "Moroccan Dirham" },
  { code: "EGP", flag: "🇪🇬", name: "Egyptian Pound" },
  { code: "TND", flag: "🇹🇳", name: "Tunisian Dinar" },
  { code: "XOF", flag: "🌍", name: "West African CFA" },
  { code: "XAF", flag: "🌍", name: "Central African CFA" },
  { code: "GHS", flag: "🇬🇭", name: "Ghanaian Cedi" },
  { code: "KES", flag: "🇰🇪", name: "Kenyan Shilling" },
  { code: "NGN", flag: "🇳🇬", name: "Nigerian Naira" },
  { code: "MUR", flag: "🇲🇺", name: "Mauritian Rupee" },
  { code: "MZN", flag: "🇲🇿", name: "Mozambican Metical" },
  { code: "UZS", flag: "🇺🇿", name: "Uzbek Sum" },
  { code: "KZT", flag: "🇰🇿", name: "Kazakh Tenge" },
  { code: "GEL", flag: "🇬🇪", name: "Georgian Lari" },
  { code: "AMD", flag: "🇦🇲", name: "Armenian Dram" },
  { code: "AZN", flag: "🇦🇿", name: "Azerbaijani Manat" },
  { code: "BYN", flag: "🇧🇾", name: "Belarusian Ruble" },
  { code: "CNY", flag: "🇨🇳", name: "Chinese Yuan" },
];

type RatesResponse = { base: string; date?: string; time_last_update_utc?: string; rates: Record<string, number> };

async function fetchRates(base: string): Promise<RatesResponse> {
  // Primary: exchangerate-api (free, no key)
  try {
    const r = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
    if (r.ok) {
      const j = await r.json();
      if (j?.rates) return { base, date: j.date, rates: j.rates };
    }
  } catch { /* fallthrough */ }
  // Fallback: open.er-api.com
  const r2 = await fetch(`https://open.er-api.com/v6/latest/${base}`);
  if (!r2.ok) throw new Error("rates_unavailable");
  const j2 = await r2.json();
  if (!j2?.rates) throw new Error("rates_unavailable");
  return { base, time_last_update_utc: j2.time_last_update_utc, rates: j2.rates };
}

const CurrencyConverter = ({ destination, defaultFrom = "EUR" }: Props) => {
  const { t, i18n } = useTranslation();
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(() => guessCurrency(destination));
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setTo(guessCurrency(destination)); }, [destination]);

  const load = async (base: string) => {
    setLoading(true);
    setError(false);
    try {
      const r = await fetchRates(base);
      setRates(r.rates);
      setUpdatedAt(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(from);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => load(from), 60_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from]);

  const value = parseFloat(amount);
  const rate = rates && to in rates ? rates[to] : null;
  const result = rate !== null && !Number.isNaN(value) ? value * rate : null;

  const swap = () => { setFrom(to); setTo(from); };

  const locale = i18n.language.startsWith("en") ? "en-US" : "fr-FR";
  const updatedLabel = useMemo(() => {
    if (!updatedAt) return "";
    return updatedAt.toLocaleString(locale, { dateStyle: "short", timeStyle: "short" });
  }, [updatedAt, locale]);

  const renderSelect = (val: string, onChange: (v: string) => void, label: string) => (
    <Select value={val} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="text-sm h-10">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="mr-2" aria-hidden>{c.flag}</span>
            <span className="font-mono">{c.code}</span>
            <span className="text-muted-foreground"> — {c.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <section id="currency-converter" className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          {t("currency.sectionTitle")}
        </h3>
        <Button variant="ghost" size="icon" onClick={() => load(from)} disabled={loading} aria-label={t("currency.refresh")}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">{t("currency.from")}</label>
          <Input
            type="number"
            inputMode="decimal"
            value={amount}
            min="0"
            onChange={(e) => setAmount(e.target.value)}
            aria-label={t("currency.from")}
          />
          {renderSelect(from, setFrom, t("currency.from"))}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">{t("currency.to")}</label>
          <div className="h-10 px-3 rounded-md border border-input bg-muted/30 flex items-center justify-end text-sm font-semibold">
            {loading && !result ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : error ? (
              "—"
            ) : result !== null ? (
              result.toLocaleString(locale, { maximumFractionDigits: 2 })
            ) : "—"}
          </div>
          {renderSelect(to, setTo, t("currency.to"))}
        </div>
      </div>

      <div className="flex justify-center">
        <Button variant="outline" size="sm" onClick={swap} className="gap-2" aria-label={t("currency.swap")}>
          <ArrowDownUp className="w-4 h-4" />
          {t("currency.swap")}
        </Button>
      </div>

      {rate !== null && !error && (
        <p className="text-xs text-muted-foreground text-center">
          1 {from} = {rate.toLocaleString(locale, { maximumFractionDigits: 4 })} {to}
          {updatedLabel && <> · 🕐 {t("currency.updatedAt", { datetime: updatedLabel })}</>}
        </p>
      )}

      {error && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
          ⚠️ {t("currency.unavailable")}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center">
        ⚠️ {t("currency.disclaimer")}
      </p>
    </section>
  );
};

export default CurrencyConverter;
