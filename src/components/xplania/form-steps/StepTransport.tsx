import { Label } from "@/components/ui/label";
import { Train, Plane, Hotel, CheckCircle, Package, Ship, Bus, Car, Bike, TrainFront, HelpCircle, FileCheck } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const BOOKING_STATUS: { label: string; icon: React.ReactNode }[] = [
  { label: "Rien réservé", icon: <Package className="w-4 h-4" /> },
  { label: "Vol réservé", icon: <Plane className="w-4 h-4" /> },
  { label: "Hébergement réservé", icon: <Hotel className="w-4 h-4" /> },
  { label: "Tout réservé", icon: <CheckCircle className="w-4 h-4" /> },
];

const LOCAL_TRANSPORT: { label: string; icon: React.ReactNode }[] = [
  { label: "Métro", icon: <TrainFront className="w-4 h-4" /> },
  { label: "Bus", icon: <Bus className="w-4 h-4" /> },
  { label: "Taxi", icon: <Car className="w-4 h-4" /> },
  { label: "Vélo", icon: <Bike className="w-4 h-4" /> },
  { label: "Voiture", icon: <Car className="w-4 h-4" /> },
  { label: "Autre", icon: <HelpCircle className="w-4 h-4" /> },
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
            <SelectButton key={opt.label} selected={data.bookingStatus === opt.label} label={opt.label} icon={opt.icon} onClick={() => update({ bookingStatus: opt.label })} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Ship className="w-4 h-4 text-primary" /> Escale
        </Label>
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
            <SelectButton key={opt.label} selected={data.localTransport.includes(opt.label)} label={opt.label} icon={opt.icon} onClick={() => toggleLocal(opt.label)} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-primary" /> Permis international
        </Label>
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
