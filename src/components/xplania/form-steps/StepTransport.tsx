import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Train, Plane, Hotel, CheckCircle, Package, Ship, Bus, Car, Bike, TrainFront, HelpCircle, FileCheck } from "lucide-react";
import type { TravelFormData } from "@/types/travel";

const BOOKING_STATUS: { id: string; icon: React.ReactNode }[] = [
  { id: "Rien réservé", icon: <Package className="w-4 h-4" /> },
  { id: "Vol réservé", icon: <Plane className="w-4 h-4" /> },
  { id: "Hébergement réservé", icon: <Hotel className="w-4 h-4" /> },
  { id: "Tout réservé", icon: <CheckCircle className="w-4 h-4" /> },
];

const LOCAL_TRANSPORT: { id: string; icon: React.ReactNode }[] = [
  { id: "Métro", icon: <TrainFront className="w-4 h-4" /> },
  { id: "Bus", icon: <Bus className="w-4 h-4" /> },
  { id: "Taxi", icon: <Car className="w-4 h-4" /> },
  { id: "Vélo", icon: <Bike className="w-4 h-4" /> },
  { id: "Voiture", icon: <Car className="w-4 h-4" /> },
  { id: "Autre", icon: <HelpCircle className="w-4 h-4" /> },
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
  const { t } = useTranslation();
  const toggleLocal = (opt: string) => {
    const current = data.localTransport;
    update({
      localTransport: current.includes(opt) ? current.filter((tr) => tr !== opt) : [...current, opt],
    });
  };

  const yesNoLabel = (opt: string) => t(opt === "Oui" ? "travelForm.options.yes" : "travelForm.options.no");

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Train className="w-4 h-4 text-primary" /> {t("travelForm.fields.alreadyBooked")}
        </Label>
        <div className="flex flex-wrap gap-2">
          {BOOKING_STATUS.map((opt) => (
            <SelectButton key={opt.id} selected={data.bookingStatus === opt.id} label={t(`travelForm.options.booking.${opt.id}`)} icon={opt.icon} onClick={() => update({ bookingStatus: opt.id })} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <Ship className="w-4 h-4 text-primary" /> {t("travelForm.fields.stopover")}
        </Label>
        <div className="flex gap-2">
          {["Oui", "Non"].map((opt) => (
            <SelectButton key={opt} selected={data.hasStopover === opt} label={yesNoLabel(opt)} onClick={() => update({ hasStopover: opt })} />
          ))}
        </div>
      </div>

      {data.hasStopover === "Oui" && (
        <div className="space-y-2">
          <Label className="text-foreground font-semibold flex items-center gap-2">
            <Ship className="w-4 h-4 text-primary" /> {t("travelForm.fields.stopoverCount")}
          </Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={data.stopoverCount || ""}
            onChange={(e) => update({ stopoverCount: parseInt(e.target.value) || 0 })}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground w-32"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-foreground font-semibold">{t("travelForm.fields.localTransport")}</Label>
        <div className="flex flex-wrap gap-2">
          {LOCAL_TRANSPORT.map((opt) => (
            <SelectButton key={opt.id} selected={data.localTransport.includes(opt.id)} label={t(`travelForm.options.localTransport.${opt.id}`)} icon={opt.icon} onClick={() => toggleLocal(opt.id)} />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground font-semibold flex items-center gap-2">
          <FileCheck className="w-4 h-4 text-primary" /> {t("travelForm.fields.intlPermit")}
        </Label>
        <div className="flex gap-2">
          {["Oui", "Non"].map((opt) => (
            <SelectButton key={opt} selected={data.hasInternationalPermit === opt} label={yesNoLabel(opt)} onClick={() => update({ hasInternationalPermit: opt })} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StepTransport;
