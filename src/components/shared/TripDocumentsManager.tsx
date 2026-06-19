// ✨ UI gestion des documents de voyage — supporte le rattachement à une page du carnet (day_id)
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTripDocuments, type TripDocument } from "@/hooks/useTripDocuments";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Trash2, ExternalLink, Plane, FileBadge2, Hotel, Loader2, File, Pin } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatDayLabel } from "@/lib/journal-utils";

const DOC_TYPES = [
  { value: "ticket", labelKey: "tripDocs.types.ticket", icon: Plane },
  { value: "passport", labelKey: "tripDocs.types.passport", icon: FileBadge2 },
  { value: "booking", labelKey: "tripDocs.types.booking", icon: Hotel },
  { value: "other", labelKey: "tripDocs.types.other", icon: File },
];

function iconFor(type: string) {
  return DOC_TYPES.find((d) => d.value === type)?.icon || File;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

interface DayRef {
  id: string;
  date: string;
  title?: string | null;
}

interface Props {
  tripId: string;
  /** When set, the manager only shows docs attached to this day, and uploads auto-pin to it. */
  dayId?: string | null;
  /** Available carnet pages — enables the "pin to a page" selector. */
  days?: DayRef[];
  /** Compact mode for embedded use inside a DayView. */
  compact?: boolean;
}

export default function TripDocumentsManager({ tripId, dayId, days, compact }: Props) {
  const { t } = useTranslation();
  const { documents, loading, upload, remove, getSignedUrl, linkToDay } = useTripDocuments(tripId, { dayId });
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("other");
  const [pinDayId, setPinDayId] = useState<string>(dayId || "");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const targetDay = dayId ?? (pinDayId || null);
    await upload(file, docType, undefined, targetDay);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openDoc = async (doc: TripDocument) => {
    const url = await getSignedUrl(doc);
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const dayLabelFor = (id: string | null | undefined) => {
    if (!id) return t("tripDocs.noPage");
    const d = days?.find((x) => x.id === id);
    if (!d) return t("tripDocs.noPage");
    return d.title || formatDayLabel(d.date);
  };

  return (
    <Card className={`${compact ? "p-4" : "p-5"} space-y-3 bg-card/50 backdrop-blur border-border`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">
            {dayId ? t("tripDocs.pageDocs") : t("tripDocs.title")}
          </h3>
          <span className="text-xs text-muted-foreground">({documents.length})</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOC_TYPES.map((d) => (
                <SelectItem key={d.value} value={d.value}>{t(d.labelKey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!dayId && days && days.length > 0 && (
            <Select value={pinDayId || "__none__"} onValueChange={(v) => setPinDayId(v === "__none__" ? "" : v)}>
              <SelectTrigger className="w-[170px] h-9">
                <SelectValue placeholder={t("tripDocs.pinToPage")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("tripDocs.noPage")}</SelectItem>
                {days.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.title || formatDayLabel(d.date)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <input ref={fileRef} type="file" hidden onChange={handleFile} accept="image/*,application/pdf" />
          <Button size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span className="ml-1.5">{t("tripDocs.upload")}</span>
          </Button>
        </div>
      </div>

      {!compact && <p className="text-xs text-muted-foreground">{t("tripDocs.hint")}</p>}

      {loading && <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>}

      {!loading && documents.length === 0 && (
        <div className="text-center py-6 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
          {dayId ? t("tripDocs.emptyPage") : t("tripDocs.empty")}
        </div>
      )}

      <div className="grid gap-2">
        {documents.map((doc) => {
          const Icon = iconFor(doc.doc_type);
          return (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/40 hover:bg-background/60 transition">
              <Icon className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  <span>{t(`tripDocs.types.${doc.doc_type}`)}</span>
                  <span>·</span>
                  <span>{formatSize(doc.size_bytes)}</span>
                  {!dayId && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Pin className="w-3 h-3" />
                        {dayLabelFor(doc.day_id)}
                      </span>
                    </>
                  )}
                </p>
              </div>
              {!dayId && days && days.length > 0 && (
                <Select
                  value={doc.day_id || "__none__"}
                  onValueChange={(v) => linkToDay(doc, v === "__none__" ? null : v)}
                >
                  <SelectTrigger className="w-[150px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t("tripDocs.noPage")}</SelectItem>
                    {days.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title || formatDayLabel(d.date)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button size="icon" variant="ghost" onClick={() => openDoc(doc)} title={t("tripDocs.open")}>
                <ExternalLink className="w-4 h-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("tripDocs.deleteTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>{t("tripDocs.deleteDesc", { name: doc.name })}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => remove(doc)}>{t("common.delete")}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
