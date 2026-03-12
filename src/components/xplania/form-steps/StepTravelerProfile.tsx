import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, User, Heart, Users2, Briefcase, Laptop, Backpack, Armchair, GraduationCap, Gem, Footprints, Activity, Globe } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const TRAVELER_TYPES: { label: string; icon: React.ReactNode }[] = [
  { label: "Solo", icon: <User className="w-4 h-4" /> },
  { label: "Couple", icon: <Heart className="w-4 h-4" /> },
  { label: "Famille avec enfants", icon: <Users className="w-4 h-4" /> },
  { label: "Groupe d'amis", icon: <Users2 className="w-4 h-4" /> },
  { label: "Voyage professionnel", icon: <Briefcase className="w-4 h-4" /> },
  { label: "Digital nomad", icon: <Laptop className="w-4 h-4" /> },
  { label: "Backpacker", icon: <Backpack className="w-4 h-4" /> },
  { label: "Retraité(e)", icon: <Armchair className="w-4 h-4" /> },
  { label: "Étudiant", icon: <GraduationCap className="w-4 h-4" /> },
  { label: "Lune de miel", icon: <Gem className="w-4 h-4" /> },
  { label: "Aventurier solo", icon: <Footprints className="w-4 h-4" /> },
];

const ACTIVITY_LEVELS: { label: string; icon: React.ReactNode }[] = [
  { label: "Sédentaire", icon: <Armchair className="w-4 h-4" /> },
  { label: "Modéré", icon: <Footprints className="w-4 h-4" /> },
  { label: "Actif", icon: <Activity className="w-4 h-4" /> },
  { label: "Très actif", icon: <Activity className="w-4 h-4" /> },
];

const LANGUAGES: { label: string; flag: string }[] = [
  { label: "Français", flag: "🇫🇷" },
  { label: "Anglais", flag: "🇬🇧" },
  { label: "Espagnol", flag: "🇪🇸" },
  { label: "Italien", flag: "🇮🇹" },
  { label: "Allemand", flag: "🇩🇪" },
  { label: "Chinois", flag: "🇨🇳" },
  { label: "Japonais", flag: "🇯🇵" },
  { label: "Arabe", flag: "🇸🇦" },
  { label: "Russe", flag: "🇷🇺" },
  { label: "Portugais", flag: "🇵🇹" },
  { label: "Autre", flag: "🌍" },
];

const EXPERIENCE_LEVELS: { label: string; icon: React.ReactNode }[] = [
  { label: "Premier voyage", icon: <Globe className="w-4 h-4" /> },
  { label: "Voyage occasionnel", icon: <Globe className="w-4 h-4" /> },
  { label: "Voyageur régulier", icon: <Globe className="w-4 h-4" /> },
  { label: "Grand explorateur", icon: <Globe className="w-4 h-4" /> },
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
  const languages = data.languages || [];
  const toggleLanguage = (lang: string) => {
    const current = languages;
    update({
      languages: current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang],
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Qui voyage ?
        </Label>
        <div className="flex flex-wrap gap-2">
          {TRAVELER_TYPES.map((opt) => (
            <SelectButton key={opt.label} selected={data.travelerType === opt.label} label={opt.label} icon={opt.icon} onClick={() => update({ travelerType: opt.label })} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Âge approximatif</Label>
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
        <Label className="text-foreground font-semibold">Niveau d'activité</Label>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_LEVELS.map((opt) => (
            <SelectButton key={opt.label} selected={data.activityLevel === opt.label} label={opt.label} icon={opt.icon} onClick={() => update({ activityLevel: opt.label })} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Langues parlées</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <SelectButton key={lang.label} selected={languages.includes(lang.label)} label={`${lang.flag} ${lang.label}`} onClick={() => toggleLanguage(lang.label)} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Parle-t-on la langue locale ?</Label>
          <div className="flex gap-2">
            {["Oui", "Non"].map((opt) => (
              <SelectButton key={opt} selected={data.speaksLocalLanguage === opt} label={opt} onClick={() => update({ speaksLocalLanguage: opt })} />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground font-semibold">Guide français nécessaire ?</Label>
          <div className="flex gap-2">
            {["Oui", "Non"].map((opt) => (
              <SelectButton key={opt} selected={data.needsFrenchGuide === opt} label={opt} onClick={() => update({ needsFrenchGuide: opt })} />
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Niveau d'expérience voyage</Label>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_LEVELS.map((opt) => (
            <SelectButton key={opt.label} selected={data.travelExperience === opt.label} label={opt.label} icon={opt.icon} onClick={() => update({ travelExperience: opt.label })} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepTravelerProfile;
