import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, User, Heart, Users2, Briefcase, Laptop, Backpack, Armchair, GraduationCap, Gem, Footprints, Activity, Globe } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const TRAVELER_TYPES: { id: string; icon: React.ReactNode }[] = [
  { id: "Solo", icon: <User className="w-4 h-4" /> },
  { id: "Couple", icon: <Heart className="w-4 h-4" /> },
  { id: "Famille avec enfants", icon: <Users className="w-4 h-4" /> },
  { id: "Groupe d'amis", icon: <Users2 className="w-4 h-4" /> },
  { id: "Voyage professionnel", icon: <Briefcase className="w-4 h-4" /> },
  { id: "Digital nomad", icon: <Laptop className="w-4 h-4" /> },
  { id: "Backpacker", icon: <Backpack className="w-4 h-4" /> },
  { id: "Retraité(e)", icon: <Armchair className="w-4 h-4" /> },
  { id: "Étudiant", icon: <GraduationCap className="w-4 h-4" /> },
  { id: "Lune de miel", icon: <Gem className="w-4 h-4" /> },
  { id: "Aventurier solo", icon: <Footprints className="w-4 h-4" /> },
];

const ACTIVITY_LEVELS: { id: string; icon: React.ReactNode }[] = [
  { id: "Sédentaire", icon: <Armchair className="w-4 h-4" /> },
  { id: "Modéré", icon: <Footprints className="w-4 h-4" /> },
  { id: "Actif", icon: <Activity className="w-4 h-4" /> },
  { id: "Très actif", icon: <Activity className="w-4 h-4" /> },
];

const LANGUAGES: { id: string; flag: string }[] = [
  { id: "Français", flag: "🇫🇷" },
  { id: "Anglais", flag: "🇬🇧" },
  { id: "Espagnol", flag: "🇪🇸" },
  { id: "Italien", flag: "🇮🇹" },
  { id: "Allemand", flag: "🇩🇪" },
  { id: "Chinois", flag: "🇨🇳" },
  { id: "Japonais", flag: "🇯🇵" },
  { id: "Arabe", flag: "🇸🇦" },
  { id: "Russe", flag: "🇷🇺" },
  { id: "Portugais", flag: "🇵🇹" },
  { id: "Autre", flag: "🌍" },
];

const EXPERIENCE_LEVELS: { id: string; icon: React.ReactNode }[] = [
  { id: "Premier voyage", icon: <Globe className="w-4 h-4" /> },
  { id: "Voyage occasionnel", icon: <Globe className="w-4 h-4" /> },
  { id: "Voyageur régulier", icon: <Globe className="w-4 h-4" /> },
  { id: "Grand explorateur", icon: <Globe className="w-4 h-4" /> },
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const SelectButton = ({ selected, label, onClick, icon }: { selected: boolean; label: string; onClick: () => void; icon?: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
      selected ? "gradient-button text-primary-foreground" : "glass-card text-foreground hover:bg-muted"
    }`}
  >
    {icon}
    {label}
  </button>
);

const StepTravelerProfile = ({ data, update }: Props) => {
  const { t } = useTranslation();
  const languages = data.languages || [];
  const toggleLanguage = (lang: string) => {
    update({
      languages: languages.includes(lang) ? languages.filter((l) => l !== lang) : [...languages, lang],
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> {t("travelForm.fields.whoTravels")}
        </Label>
        <div className="flex flex-wrap gap-2">
          {TRAVELER_TYPES.map((opt) => (
            <SelectButton key={opt.id} selected={data.travelerType === opt.id} label={t(`travelForm.options.travelerType.${opt.id}`)} icon={opt.icon} onClick={() => update({ travelerType: opt.id })} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">{t("travelForm.fields.age")}</Label>
          <Input
            type="number"
            min={1}
            max={120}
            value={data.age || ""}
            onChange={(e) => update({ age: parseInt(e.target.value) || 0 })}
            className="bg-muted border-border text-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">{t("travelForm.fields.activityLevel")}</Label>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_LEVELS.map((opt) => (
            <SelectButton key={opt.id} selected={data.activityLevel === opt.id} label={t(`travelForm.options.activityLevel.${opt.id}`)} icon={opt.icon} onClick={() => update({ activityLevel: opt.id })} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">{t("travelForm.fields.languages")}</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <SelectButton key={lang.id} selected={languages.includes(lang.id)} label={`${lang.flag} ${t(`travelForm.options.language.${lang.id}`)}`} onClick={() => toggleLanguage(lang.id)} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">{t("travelForm.fields.speaksLocal")}</Label>
          <div className="flex gap-2">
            {["Oui", "Non"].map((opt) => (
              <SelectButton key={opt} selected={data.speaksLocalLanguage === opt} label={t(opt === "Oui" ? "travelForm.options.yes" : "travelForm.options.no")} onClick={() => update({ speaksLocalLanguage: opt })} />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">{t("travelForm.fields.needsFrenchGuide")}</Label>
          <div className="flex gap-2">
            {["Oui", "Non"].map((opt) => (
              <SelectButton key={opt} selected={data.needsFrenchGuide === opt} label={t(opt === "Oui" ? "travelForm.options.yes" : "travelForm.options.no")} onClick={() => update({ needsFrenchGuide: opt })} />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">{t("travelForm.fields.experience")}</Label>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_LEVELS.map((opt) => (
            <SelectButton key={opt.id} selected={data.travelExperience === opt.id} label={t(`travelForm.options.experience.${opt.id}`)} icon={opt.icon} onClick={() => update({ travelExperience: opt.id })} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepTravelerProfile;
