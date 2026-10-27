import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";

export interface PreviewRow {
  label: string;
  value?: string;
}

interface Props {
  title: string;
  rows: PreviewRow[];
  note?: string;
}

/**
 * A clearly-labelled "example" card shown BEFORE the generate/create button on
 * the guide pages, so users see a first result and understand what they'll get.
 * The content is illustrative only (marked "Exemple").
 */
const ExampleResultPreview = ({ title, rows, note }: Props) => {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-bold text-primary">
          <Eye className="h-3.5 w-3.5" /> {t("guidePreview.label")}
        </span>
        <p className="text-sm font-semibold text-foreground">{title}</p>
      </div>
      <ul className="space-y-1.5">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 text-muted-foreground">{r.label}</span>
            {r.value && <span className="shrink-0 font-medium text-foreground">{r.value}</span>}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs italic text-muted-foreground">{note || t("guidePreview.defaultNote")}</p>
    </div>
  );
};

export default ExampleResultPreview;
