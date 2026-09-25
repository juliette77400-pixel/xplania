import { useTranslation } from "react-i18next";
import { Printer, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDayLabel } from "@/lib/journal-utils";
import { toast } from "sonner";

interface Props {
  title: string;
  destination: string;
  cover?: string | null;
  days: any[];
  isPublic?: boolean;
  publicSlug?: string | null;
  onShare?: () => void;
  readOnly?: boolean;
}

/** Frozen, printable "album" layout of a logbook. */
const SouvenirAlbum = ({ title, destination, cover, days, isPublic, publicSlug, onShare, readOnly }: Props) => {
  const { t } = useTranslation();

  const copyLink = () => {
    if (!isPublic || !publicSlug) { onShare?.(); return; }
    navigator.clipboard.writeText(`${window.location.origin}/carnet/public/${publicSlug}`);
    toast.success(t("souvenir.copied"));
  };

  return (
    <div className="space-y-8">
      {!readOnly && (
        <div className="flex flex-wrap gap-2 justify-end print:hidden">
          <Button size="sm" variant="outline" onClick={copyLink}>
            <Link2 className="w-4 h-4" /> {isPublic ? t("souvenir.copyLink") : t("souvenir.makePublic")}
          </Button>
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> {t("souvenir.print")}
          </Button>
        </div>
      )}

      <section className="relative rounded-3xl overflow-hidden border border-border min-h-[220px] flex items-end">
        {cover && <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">{t("souvenir.label")}</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">{title}</h2>
          {destination && <p className="text-muted-foreground mt-1">{destination}</p>}
        </div>
      </section>

      {days.map((d, i) => {
        const photos = d.blocks.filter((b: any) => b.type === "photo" && b.content?.url);
        const others = d.blocks.filter((b: any) => b.type !== "photo");
        if (!photos.length && !others.length) return null;
        return (
          <section key={d.id} className="space-y-3 break-inside-avoid">
            <div className="border-l-2 border-primary pl-3">
              <p className="text-xs text-primary uppercase tracking-wider font-semibold">
                {t("carnet.day", { n: i + 1 })} · {formatDayLabel(d.date)}
              </p>
              {d.title && <h3 className="text-xl font-bold text-foreground">{d.title}</h3>}
            </div>
            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {photos.map((b: any, k: number) => (
                  <figure key={b.id} className={`rounded-xl overflow-hidden bg-muted ${k === 0 && photos.length > 2 ? "col-span-2 row-span-2" : ""}`}>
                    <img src={b.content.url} alt={b.content.caption || ""} className="w-full h-full object-cover aspect-square" loading="lazy" />
                  </figure>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              {others.map((b: any) => {
                const c = b.content || {};
                if (b.type === "note" && c.text) return <p key={b.id} className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{c.text}</p>;
                if (b.type === "highlight" && c.text) return <p key={b.id} className="text-sm font-medium text-foreground">⭐ {c.text}</p>;
                if (b.type === "location" && c.name) return <p key={b.id} className="text-xs text-muted-foreground">📍 {c.name}</p>;
                if (b.type === "mood" && c.emoji) return <span key={b.id} className="text-2xl mr-1">{c.emoji}</span>;
                return null;
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default SouvenirAlbum;
