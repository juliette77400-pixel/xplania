import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const TRAVELER_TYPES = [
  "Solo", "Couple", "Famille avec enfants", "Groupe d'amis",
  "Voyage professionnel", "Digital nomad", "Backpacker",
  "Retraité(e)", "Étudiant", "Lune de miel", "Aventurier solo"
];

const ACTIVITY_LEVELS = ["Sédentaire", "Modéré", "Actif", "Très actif"];

const LANGUAGES = [
  "Français", "Anglais", "Espagnol", "Italien", "Allemand",
  "Chinois", "Japonais", "Arabe", "Russe", "Portugais", "Autre"
];

const EXPERIENCE_LEVELS = [
  "Premier voyage", "Voyage occasionnel", "Voyageur régulier", "Grand explorateur"
];

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const SelectButton = ({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
      selected ? "gradient-button text-primary-foreground" : "glass-card text-foreground hover:bg-muted"
    }`}
  >
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
            <SelectButton key={opt} selected={data.travelerType === opt} label={opt} onClick={() => update({ travelerType: opt })} />
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
            <SelectButton key={opt} selected={data.activityLevel === opt} label={opt} onClick={() => update({ activityLevel: opt })} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Langues parlées</Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <SelectButton key={lang} selected={data.languages.includes(lang)} label={lang} onClick={() => toggleLanguage(lang)} />
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
            <SelectButton key={opt} selected={data.travelExperience === opt} label={opt} onClick={() => update({ travelExperience: opt })} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepTravelerProfile;
