import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useTranslation } from "react-i18next";
import { Camera, Loader2, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  userId: string;
  avatarUrl: string;
  initials: string;
  alt: string;
  onChange: (url: string) => void;
}

const OUTPUT = 512;
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT;
  canvas.height = OUTPUT;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, OUTPUT, OUTPUT);
  return new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("blob"))), "image/jpeg", 0.9),
  );
}

const AvatarEditor = ({ userId, avatarUrl, initials, alt, onChange }: Props) => {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  const pick = () => inputRef.current?.click();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return toast.error(t("profil.avatar.badType"));
    if (f.size > 10 * 1024 * 1024) return toast.error(t("profil.avatar.tooBig"));
    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result as string);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    };
    reader.readAsDataURL(f);
  };

  const persist = async (url: string | null) => {
    const { error } = await supabase
      .from("profiles")
      .upsert({ user_id: userId, avatar_url: url }, { onConflict: "user_id" });
    if (error) throw error;
  };

  const save = async () => {
    if (!src || !area) return;
    setBusy(true);
    try {
      const blob = await cropToBlob(src, area);
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { data: old } = await supabase.storage.from("avatars").list(userId);
      const up = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (up.error) throw up.error;
      const { data: signed, error: sErr } = await supabase.storage.from("avatars").createSignedUrl(path, TEN_YEARS);
      if (sErr || !signed) throw sErr;
      await persist(signed.signedUrl);
      if (old?.length) await supabase.storage.from("avatars").remove(old.map((o) => `${userId}/${o.name}`));
      onChange(signed.signedUrl);
      setSrc(null);
      toast.success(t("profil.avatar.saved"));
    } catch (e) {
      console.warn("[avatar] save failed", e);
      toast.error(t("profil.avatar.error"));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const { data: old } = await supabase.storage.from("avatars").list(userId);
      if (old?.length) await supabase.storage.from("avatars").remove(old.map((o) => `${userId}/${o.name}`));
      await persist(null);
      onChange("");
      toast.success(t("profil.avatar.removed"));
    } catch (e) {
      console.warn("[avatar] remove failed", e);
      toast.error(t("profil.avatar.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={pick} className="group relative rounded-full" aria-label={t("profil.avatar.change")}>
        <Avatar className="h-20 w-20 border-2 border-primary/30">
          <AvatarImage src={avatarUrl} alt={alt} />
          <AvatarFallback className="text-xl gradient-button text-primary-foreground">{initials}</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-primary shadow">
          <Camera className="h-3.5 w-3.5" />
        </span>
      </button>
      <div className="flex gap-1">
        <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={pick} disabled={busy}>
          <Pencil className="mr-1 h-3 w-3" />
          {avatarUrl ? t("profil.avatar.change") : t("profil.avatar.add")}
        </Button>
        {avatarUrl && (
          <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs text-destructive hover:text-destructive" onClick={remove} disabled={busy}>
            <Trash2 className="mr-1 h-3 w-3" />
            {t("profil.avatar.remove")}
          </Button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      <Dialog open={!!src} onOpenChange={(o) => !o && !busy && setSrc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("profil.avatar.cropTitle")}</DialogTitle>
          </DialogHeader>
          <div className="relative h-72 w-full overflow-hidden rounded-xl bg-muted">
            {src && (
              <Cropper
                image={src}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{t("profil.avatar.zoom")}</p>
            <Slider min={1} max={3} step={0.05} value={[zoom]} onValueChange={(v) => setZoom(v[0])} />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSrc(null)} disabled={busy}>{t("profil.avatar.cancel")}</Button>
            <Button className="gradient-button" onClick={save} disabled={busy || !area}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("profil.avatar.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AvatarEditor;
