import WaitlistDialog from "@/components/xplania/WaitlistDialog";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  toolName: string;
}

/**
 * Backwards-compatible wrapper: any existing call site that uses UpgradeDialog
 * now opens the persuasive premium waitlist popup with email capture.
 */
const UpgradeDialog = ({ open, onOpenChange, toolName }: Props) => (
  <WaitlistDialog
    open={open}
    onOpenChange={onOpenChange}
    source={`quota:${toolName}`}
    title="Quota gratuit atteint 🎯"
    teaser={`Tu as adoré ${toolName} ? Débloque l'accès illimité dès l'ouverture du premium et reçois -30% en avant-première.`}
  />
);

export default UpgradeDialog;
