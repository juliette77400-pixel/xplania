import { Label } from "@/components/ui/label";
import { Train } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const BOOKING_STATUS = ["Rien réservé", "Vol réservé", "Hébergement réservé", "Tout réservé"];
const LOCAL_TRANSPORT = ["Métro", "Bus", "Taxi", "Vélo", "Voiture", "Autre"];

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

const StepTransport = ({ data, update }: Props) => {
  const toggleLocal = (opt: string) => {
    const current = data.localTransport;
    update({
      localTransport: current.includes(opt) ? current.filter((t) => t !== opt) : [...current, opt],
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Train className="w-4 h-4 text-primary" /> Avez-vous déjà réservé ?
        </Label>
        <div className="flex flex-wrap gap-2">
          {BOOKING_STATUS.map((opt) => (
            <SelectButton key={opt} selected={data.bookingStatus === opt} label={opt} onClick={() => update({ bookingStatus: opt })} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Escale</Label>
        <div className="flex gap-2">
          {["Oui", "Non"].map((opt) => (
            <SelectButton key={opt} selected={data.hasStopover === opt} label={opt} onClick={() => update({ hasStopover: opt })} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Transport local</Label>
        <div className="flex flex-wrap gap-2">
          {LOCAL_TRANSPORT.map((opt) => (
            <SelectButton key={opt} selected={data.localTransport.includes(opt)} label={opt} onClick={() => toggleLocal(opt)} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">Permis international</Label>
        <div className="flex gap-2">
          {["Oui", "Non"].map((opt) => (
            <SelectButton key={opt} selected={data.hasInternationalPermit === opt} label={opt} onClick={() => update({ hasInternationalPermit: opt })} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepTransport;
