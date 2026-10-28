import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, Loader2, Pencil, User as UserIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useDisplayName, useUpdateDisplayName } from "@/lib/data/profiles";
import { DISPLAY_NAME_MAX, validateDisplayName, type DisplayNameError } from "@/lib/display-name";

/** Display name with "Modifier" → field + Enregistrer / Annuler. Changes only the profile name. */
export default function DisplayNameEditor() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const current = useDisplayName(user?.id);
  const save = useUpdateDisplayName();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<DisplayNameError | null>(null);

  const start = () => { setValue(current ?? ""); setError(null); setEditing(true); };
  const cancel = () => { setEditing(false); setError(null); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (save.isPending) return;
    const v = validateDisplayName(value);
    if (!v.ok) { setError(v.error); return; }
    if (v.value === current) { setEditing(false); return; }
    save.mutate(v.value, {
      onSuccess: () => { setEditing(false); toast.success(t("profil.name.saved")); },
      onError: () => toast.error(t("profil.name.saveError")),
    });
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><UserIcon className="h-3.5 w-3.5" aria-hidden />{t("profil.displayName")}</p>
          <p className="truncate font-semibold text-foreground">{current || <span className="font-normal text-muted-foreground">{t("profil.name.none")}</span>}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={start} aria-label={t("profil.name.editAria")}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />{t("profil.name.edit")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3" noValidate>
      <Label htmlFor="display-name">{t("profil.displayName")}</Label>
      <Input id="display-name" value={value} autoFocus maxLength={DISPLAY_NAME_MAX + 10} autoComplete="nickname"
        onChange={(e) => { setValue(e.target.value); setError(null); }}
        onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
        placeholder={t("profil.displayNamePlaceholder")} aria-invalid={!!error} aria-describedby="display-name-help" />
      <p id="display-name-help" className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`} role={error ? "alert" : undefined}>
        {error ? t(`profil.name.errors.${error}`, { max: DISPLAY_NAME_MAX }) : t("profil.name.help")}
      </p>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={save.isPending}>
          {save.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden /> : <Check className="mr-1.5 h-3.5 w-3.5" aria-hidden />}
          {t("profil.name.save")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={cancel} disabled={save.isPending}>
          <X className="mr-1.5 h-3.5 w-3.5" aria-hidden />{t("profil.name.cancel")}
        </Button>
      </div>
    </form>
  );
}
