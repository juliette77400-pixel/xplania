import { useTranslation } from "react-i18next";
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
const UpgradeDialog = ({ open, onOpenChange, toolName }: Props) => {
  const { t } = useTranslation();
  return (
    <WaitlistDialog
      open={open}
      onOpenChange={onOpenChange}
      source={`quota:${toolName}`}
      title={t("upgrade.title")}
      teaser={t("upgrade.teaser", { tool: toolName })}
    />
  );
};

export default UpgradeDialog;
