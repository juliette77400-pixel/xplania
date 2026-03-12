import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Plane, TrainFront, Ship } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const SUGGESTIONS = [
  { name: "Paris Charles de Gaulle", city: "Paris", country: "France", type: "aéroport" },
  { name: "Paris Orly", city: "Paris", country: "France", type: "aéroport" },
  { name: "Lyon Saint-Exupéry", city: "Lyon", country: "France", type: "aéroport" },
  { name: "Marseille Provence", city: "Marseille", country: "France", type: "aéroport" },
  { name: "Gare de Lyon", city: "Paris", country: "France", type: "gare" },
  { name: "Gare du Nord", city: "Paris", country: "France", type: "gare" },
  { name: "Gare Part-Dieu", city: "Lyon", country: "France", type: "gare" },
  { name: "Port de Marseille", city: "Marseille", country: "France", type: "port" },
  { name: "London Heathrow", city: "London", country: "Royaume-Uni", type: "aéroport" },
  { name: "Barcelona El Prat", city: "Barcelone", country: "Espagne", type: "aéroport" },
  { name: "Rome Fiumicino", city: "Rome", country: "Italie", type: "aéroport" },
  { name: "Dubai International", city: "Dubaï", country: "EAU", type: "aéroport" },
];

const typeIcon = (type: string) => {
  if (type === "gare") return <TrainFront className="w-4 h-4 text-primary" />;
  if (type === "port") return <Ship className="w-4 h-4 text-primary" />;
  return <Plane className="w-4 h-4 text-primary" />;
};

interface Props {
  data: TravelFormData;
  update: (d: Partial<TravelFormData>) => void;
}

const StepDestination = ({ data, update }: Props) => {
  const [depQuery, setDepQuery] = useState(data.departure);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = SUGGESTIONS.filter((s) =>
    `${s.name} ${s.city} ${s.country}`.toLowerCase().includes(depQuery.toLowerCase())
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Destination (ville ou pays)</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ex : Tokyo, Japon"
            value={data.destination}
            onChange={(e) => update({ destination: e.target.value })}
            className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Lieu de départ</Label>
        <div className="relative">
          <Plane className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un aéroport, gare, port..."
            value={depQuery}
            onChange={(e) => {
              setDepQuery(e.target.value);
              update({ departure: e.target.value });
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
          {showSuggestions && depQuery.length > 0 && filtered.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 glass-card rounded-xl overflow-hidden">
              {filtered.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/80 transition-colors text-left"
                  onMouseDown={() => {
                    setDepQuery(s.name);
                    update({ departure: s.name });
                    setShowSuggestions(false);
                  }}
                >
                  {typeIcon(s.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.city}, {s.country} • <span className="capitalize">{s.type}</span>
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepDestination;
