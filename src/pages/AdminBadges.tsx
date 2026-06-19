import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppNavbar from "@/components/shared/AppNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle, MapPin, Image as ImageIcon, FileText, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type ClaimRow = {
  id: string;
  user_id: string;
  badge_id: string;
  status: "in_progress" | "submitted" | "validated" | "rejected";
  proof_method: "geo" | "photo" | "ticket" | "manual" | null;
  proof_lat: number | null;
  proof_lng: number | null;
  proof_photo_url: string | null;
  proof_ticket_url: string | null;
  ai_verdict: any;
  notes: string | null;
  submitted_at: string | null;
  created_at: string;
  gam_badges?: { name_fr: string; name_en: string; points: number; category_id: string };
  profiles?: { display_name: string | null };
};

export default function AdminBadges() {
  const { user, loading: authLoading } = useAuth();
  const { i18n } = useTranslation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"submitted" | "validated" | "rejected" | "all">("submitted");
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  // Check admin role
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("gam_badge_claims")
      .select("*, gam_badges(name_fr,name_en,points,category_id)")
      .order("submitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const rows = (data || []) as any as ClaimRow[];
    // Resolve display names
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    if (userIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id,display_name")
        .in("user_id", userIds);
      const map = new Map((profs || []).map((p: any) => [p.user_id, p.display_name]));
      rows.forEach((r) => (r.profiles = { display_name: map.get(r.user_id) ?? null }));
    }
    setClaims(rows);
    // Sign storage urls
    const urls: Record<string, string> = {};
    for (const r of rows) {
      for (const path of [r.proof_photo_url, r.proof_ticket_url]) {
        if (path && !urls[path]) {
          const { data: s } = await supabase.storage.from("badge-proofs").createSignedUrl(path, 600);
          if (s?.signedUrl) urls[path] = s.signedUrl;
        }
      }
    }
    setSignedUrls(urls);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, filter]);

  const decide = async (claim: ClaimRow, status: "validated" | "rejected") => {
    const notes = notesDraft[claim.id] ?? claim.notes ?? "";
    const { error } = await supabase
      .from("gam_badge_claims")
      .update({
        status,
        notes,
        validated_at: status === "validated" ? new Date().toISOString() : null,
        validator_id: user!.id,
      })
      .eq("id", claim.id);
    if (error) return toast.error(error.message);
    toast.success(status === "validated" ? "Badge validé ✓" : "Réclamation rejetée");
    load();
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <main className="container mx-auto max-w-2xl px-4 py-20 text-center">
          <ShieldAlert className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Accès réservé aux administrateurs</h1>
          <p className="text-muted-foreground">Tu n'as pas les droits pour accéder à cette page.</p>
        </main>
      </div>
    );
  }

  const lang = i18n.language?.startsWith("en") ? "en" : "fr";
  const badgeName = (c: ClaimRow) => (lang === "en" ? c.gam_badges?.name_en : c.gam_badges?.name_fr) || "—";

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <main className="container mx-auto max-w-5xl px-4 py-10 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Validation des badges</h1>
            <p className="text-sm text-muted-foreground">Modère les réclamations soumises par les voyageurs.</p>
          </div>
          <div className="flex gap-2">
            {(["submitted", "validated", "rejected", "all"] as const).map((f) => (
              <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
                {f === "submitted" ? "En attente" : f === "validated" ? "Validés" : f === "rejected" ? "Rejetés" : "Tous"}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center"><Loader2 className="w-6 h-6 animate-spin inline text-primary" /></div>
        ) : claims.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            Aucune réclamation à afficher.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {claims.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-foreground">{badgeName(c)}</h3>
                    <p className="text-xs text-muted-foreground">
                      Par <span className="text-foreground">{c.profiles?.display_name || c.user_id.slice(0, 8)}</span> · {c.gam_badges?.points ?? 0} pts
                    </p>
                  </div>
                  <Badge variant={c.status === "validated" ? "default" : c.status === "rejected" ? "destructive" : "secondary"}>
                    {c.status}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  {c.proof_method === "geo" && <MapPin className="w-3.5 h-3.5" />}
                  {c.proof_method === "photo" && <ImageIcon className="w-3.5 h-3.5" />}
                  {c.proof_method === "ticket" && <FileText className="w-3.5 h-3.5" />}
                  Méthode : <span className="text-foreground font-medium">{c.proof_method ?? "—"}</span>
                  {c.submitted_at && <> · Soumis {new Date(c.submitted_at).toLocaleDateString()}</>}
                </div>

                {c.proof_lat !== null && c.proof_lng !== null && (
                  <a
                    href={`https://www.openstreetmap.org/?mlat=${c.proof_lat}&mlon=${c.proof_lng}#map=16/${c.proof_lat}/${c.proof_lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    {c.proof_lat.toFixed(5)}, {c.proof_lng.toFixed(5)} ↗
                  </a>
                )}

                {c.proof_photo_url && signedUrls[c.proof_photo_url] && (
                  <a href={signedUrls[c.proof_photo_url]} target="_blank" rel="noreferrer" className="block">
                    <img src={signedUrls[c.proof_photo_url]} alt="Preuve photo" className="rounded-lg border border-border max-h-48 object-cover w-full" />
                  </a>
                )}
                {c.proof_ticket_url && signedUrls[c.proof_ticket_url] && (
                  <a href={signedUrls[c.proof_ticket_url]} target="_blank" rel="noreferrer" className="block">
                    <img src={signedUrls[c.proof_ticket_url]} alt="Preuve ticket" className="rounded-lg border border-border max-h-48 object-cover w-full" />
                  </a>
                )}

                {c.ai_verdict && (
                  <pre className="text-[10px] bg-muted/40 rounded p-2 overflow-x-auto max-h-32">
                    {JSON.stringify(c.ai_verdict, null, 2)}
                  </pre>
                )}

                <Textarea
                  placeholder="Notes de modération (optionnel)"
                  value={notesDraft[c.id] ?? c.notes ?? ""}
                  onChange={(e) => setNotesDraft((p) => ({ ...p, [c.id]: e.target.value }))}
                  className="text-xs min-h-[60px]"
                />

                {c.status === "submitted" && (
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-emerald-500 hover:bg-emerald-600" onClick={() => decide(c, "validated")}>
                      <CheckCircle2 className="w-4 h-4 mr-1" /> Valider
                    </Button>
                    <Button size="sm" variant="destructive" className="flex-1" onClick={() => decide(c, "rejected")}>
                      <XCircle className="w-4 h-4 mr-1" /> Rejeter
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
