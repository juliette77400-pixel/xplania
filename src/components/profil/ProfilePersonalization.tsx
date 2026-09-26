import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Save, Plus, X, MessageCircleHeart, MapPin, Languages, Heart, Plane, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PROMPT_KEYS = ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10"] as const;
const INTEREST_KEYS = ["food", "hiking", "museums", "beach", "nightlife", "photo", "roadtrip", "wellness", "surf", "architecture", "music", "wildlife", "street_art", "markets"] as const;
const STYLE_KEYS = ["backpacker", "comfort", "luxury", "slow", "adventure", "nomad", "family"] as const;
const MAX_PROMPTS = 3;
const BIO_MAX = 300;
const ANSWER_MAX = 200;

interface PromptAnswer { key: string; answer: string }

const TagInput = ({ values, onChange, placeholder, max }: { values: string[]; onChange: (v: string[]) => void; placeholder: string; max: number }) => {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v) || values.length >= max) return;
    onChange([...values, v.slice(0, 40)]);
    setDraft("");
  };
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} maxLength={40}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} disabled={values.length >= max} />
        <Button type="button" variant="outline" size="icon" onClick={add} disabled={values.length >= max}><Plus className="w-4 h-4" /></Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <Badge key={v} variant="secondary" className="gap-1">
              {v}
              <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label="remove"><X className="w-3 h-3" /></button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

const ProfilePersonalization = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bio, setBio] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [style, setStyle] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [dreams, setDreams] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<PromptAnswer[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("bio, home_city, travel_style, languages, interests, dream_destinations, prompts")
      .eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setBio(data.bio ?? "");
          setHomeCity(data.home_city ?? "");
          setStyle(data.travel_style ?? "");
          setLanguages(data.languages ?? []);
          setInterests(data.interests ?? []);
          setDreams(data.dream_destinations ?? []);
          setPrompts(Array.isArray(data.prompts) ? (data.prompts as unknown as PromptAnswer[]) : []);
        }
        setLoading(false);
      });
  }, [user]);

  const toggleInterest = (k: string) =>
    setInterests((cur) => cur.includes(k) ? cur.filter((x) => x !== k) : cur.length >= 12 ? cur : [...cur, k]);

  const addPrompt = () => {
    const unused = PROMPT_KEYS.find((k) => !prompts.some((p) => p.key === k));
    if (unused && prompts.length < MAX_PROMPTS) setPrompts([...prompts, { key: unused, answer: "" }]);
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      bio: bio.trim() || null,
      home_city: homeCity.trim() || null,
      travel_style: style || null,
      languages, interests, dream_destinations: dreams,
      prompts: prompts.filter((p) => p.answer.trim()).map((p) => ({ key: p.key, answer: p.answer.trim() })),
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) toast.error(t("profil.saveError"));
    else toast.success(t("profil.saveSuccess"));
  };

  if (loading) return null;

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h2 className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> {t("profil.perso.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("profil.perso.subtitle")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">{t("profil.perso.bio")}</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))} placeholder={t("profil.perso.bioPlaceholder")} rows={3} />
        <p className="text-xs text-muted-foreground text-right">{bio.length}/{BIO_MAX}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city" className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {t("profil.perso.homeCity")}</Label>
          <Input id="city" value={homeCity} onChange={(e) => setHomeCity(e.target.value)} maxLength={80} placeholder={t("profil.perso.homeCityPlaceholder")} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Plane className="w-3.5 h-3.5" /> {t("profil.perso.style")}</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger><SelectValue placeholder={t("profil.perso.stylePlaceholder")} /></SelectTrigger>
            <SelectContent>
              {STYLE_KEYS.map((k) => <SelectItem key={k} value={k}>{t(`profil.perso.styles.${k}`)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> {t("profil.perso.interests")}</Label>
        <div className="flex flex-wrap gap-1.5">
          {INTEREST_KEYS.map((k) => {
            const on = interests.includes(k);
            return (
              <button key={k} type="button" onClick={() => toggleInterest(k)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${on ? "bg-primary/15 border-primary text-primary font-semibold" : "border-border text-muted-foreground hover:bg-muted"}`}>
                {t(`profil.perso.interestList.${k}`)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> {t("profil.perso.languages")}</Label>
          <TagInput values={languages} onChange={setLanguages} placeholder={t("profil.perso.languagesPlaceholder")} max={10} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Plane className="w-3.5 h-3.5" /> {t("profil.perso.dreams")}</Label>
          <TagInput values={dreams} onChange={setDreams} placeholder={t("profil.perso.dreamsPlaceholder")} max={5} />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="flex items-center gap-1.5"><MessageCircleHeart className="w-3.5 h-3.5" /> {t("profil.perso.promptsTitle")}</Label>
          <p className="text-xs text-muted-foreground">{t("profil.perso.promptsHint", { max: MAX_PROMPTS })}</p>
        </div>
        {prompts.map((p, i) => (
          <div key={i} className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex gap-2">
              <Select value={p.key} onValueChange={(v) => setPrompts(prompts.map((x, j) => j === i ? { ...x, key: v } : x))}>
                <SelectTrigger className="text-sm font-semibold"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROMPT_KEYS.filter((k) => k === p.key || !prompts.some((x) => x.key === k)).map((k) => (
                    <SelectItem key={k} value={k}>{t(`profil.perso.prompts.${k}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="ghost" size="icon" onClick={() => setPrompts(prompts.filter((_, j) => j !== i))} aria-label={t("profil.perso.removePrompt")}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Textarea value={p.answer} rows={2} placeholder={t("profil.perso.answerPlaceholder")}
              onChange={(e) => setPrompts(prompts.map((x, j) => j === i ? { ...x, answer: e.target.value.slice(0, ANSWER_MAX) } : x))} />
          </div>
        ))}
        {prompts.length < MAX_PROMPTS && (
          <Button type="button" variant="outline" className="w-full" onClick={addPrompt}>
            <Plus className="w-4 h-4 mr-1" /> {t("profil.perso.addPrompt")}
          </Button>
        )}
      </div>

      <Button onClick={save} disabled={saving} className="w-full gradient-button">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        {t("profil.perso.save")}
      </Button>
    </Card>
  );
};

export default ProfilePersonalization;
