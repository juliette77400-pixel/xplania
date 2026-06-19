import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, MapPin, Camera, Ticket, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGamification, type BadgeWithClaim } from "@/hooks/useGamification";
import BadgeMedal from "./BadgeMedal";

interface Props {
  badge: BadgeWithClaim | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ProofType = "geo" | "photo" | "ticket";

const BadgeClaimDialog = ({ badge, open, onOpenChange }: Props) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { submitClaim, refetch } = useGamification();
  const [proofType, setProofType] = useState<ProofType>("photo");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isFr = i18n.language?.startsWith("fr");

  if (!badge) return null;

  const lang = (k: "fr" | "en") => k;
  const name = isFr ? badge.name_fr : badge.name_en;
  const description = isFr ? badge.description_fr : badge.description_en;
  const reward = isFr ? badge.reward_fr : badge.reward_en;

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      let proof_url: string | undefined;
      let geo_lat: number | undefined;
      let geo_lng: number | undefined;

      if (proofType === "geo") {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
        ).catch(() => null);
        if (!pos) {
          toast.error(t("gam.claim.geoFailed"));
          setSubmitting(false);
          return;
        }
        geo_lat = pos.coords.latitude;
        geo_lng = pos.coords.longitude;
      }

      if (proofType === "photo" || proofType === "ticket") {
        if (!photo) {
          toast.error(t("gam.claim.photoRequired"));
          setSubmitting(false);
          return;
        }
        const ext = photo.name.split(".").pop() || "jpg";
        const path = `${user.id}/${badge.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("badge-proofs").upload(path, photo);
        if (upErr) throw upErr;
        proof_url = path;
      }

      await submitClaim(badge.id, { proof_type: proofType, proof_url, geo_lat, geo_lng });
      toast.success(t("gam.claim.submitted"));
      await refetch();
      onOpenChange(false);
      setPhoto(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || t("gam.claim.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const alreadyValidated = badge.status === "validated";
  const alreadySubmitted = badge.status === "submitted";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <BadgeMedal badge={badge} size="md" />
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-left">{name}</DialogTitle>
              <DialogDescription className="text-left text-xs">
                {badge.category && (isFr ? badge.category.name_fr : badge.category.name_en)} · {badge.points} pts
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>
          {reward && (
            <p className="text-xs italic text-primary">🎁 {reward}</p>
          )}

          {alreadyValidated && (
            <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> {t("gam.claim.validated")}
            </div>
          )}

          {alreadySubmitted && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-amber-600 dark:text-amber-400">
              {t("gam.claim.pending")}
            </div>
          )}

          {badge.status === "rejected" && badge.claim?.review_reason && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-3 text-xs text-red-500 flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div>
                <p className="font-semibold">{t("gam.claim.rejected")}</p>
                <p>{badge.claim.review_reason}</p>
              </div>
            </div>
          )}

          {!alreadyValidated && !alreadySubmitted && (
            <>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("gam.claim.chooseProof")}
                </Label>
                <RadioGroup value={proofType} onValueChange={(v) => setProofType(v as ProofType)} className="mt-2 space-y-2">
                  <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/50">
                    <RadioGroupItem value="geo" id="proof-geo" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium"><MapPin className="w-4 h-4" /> {t("gam.claim.proofGeo")}</div>
                      <p className="text-xs text-muted-foreground">{t("gam.claim.proofGeoDesc")}</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/50">
                    <RadioGroupItem value="photo" id="proof-photo" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium"><Camera className="w-4 h-4" /> {t("gam.claim.proofPhoto")}</div>
                      <p className="text-xs text-muted-foreground">{t("gam.claim.proofPhotoDesc")}</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary/50">
                    <RadioGroupItem value="ticket" id="proof-ticket" className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm font-medium"><Ticket className="w-4 h-4" /> {t("gam.claim.proofTicket")}</div>
                      <p className="text-xs text-muted-foreground">{t("gam.claim.proofTicketDesc")}</p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {(proofType === "photo" || proofType === "ticket") && (
                <div>
                  <Label htmlFor="proof-file" className="text-xs">{t("gam.claim.uploadLabel")}</Label>
                  <Input
                    id="proof-file"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                    className="mt-1"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {!alreadyValidated && !alreadySubmitted && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("gam.claim.submit")}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BadgeClaimDialog;
