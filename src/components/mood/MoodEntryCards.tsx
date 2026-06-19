import { useTranslation } from "react-i18next";
import { MessageCircle, ListChecks, Footprints } from "lucide-react";

interface Props {
  onPickPip: () => void;
  onPickForm: () => void;
  onPickSolo: () => void;
  disabled?: boolean;
}

const MoodEntryCards = ({ onPickPip, onPickForm, onPickSolo, disabled }: Props) => {
  const { t } = useTranslation();

  return (
    <section aria-label={t("moodComp.entry.aria")} className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl md:text-2xl font-bold text-foreground">
          {t("moodComp.entry.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("moodComp.entry.subtitle")}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={onPickPip}
          disabled={disabled}
          className="group text-left rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-secondary/10 p-5 hover:border-primary/50 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="font-semibold text-foreground">
                💬 {t("moodComp.entry.pip.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("moodComp.entry.pip.desc")}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={onPickForm}
          disabled={disabled}
          className="group text-left rounded-2xl border border-border bg-card/50 p-5 hover:border-primary/40 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-foreground shrink-0">
              <ListChecks className="w-5 h-5" />
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="font-semibold text-foreground">
                📝 {t("moodComp.entry.form.title")}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("moodComp.entry.form.desc")}
              </p>
            </div>
          </div>
        </button>
      </div>

      <div className="flex justify-center pt-1">
        <button
          onClick={onPickSolo}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Footprints className="w-3.5 h-3.5" />
          {t("moodComp.entry.solo")}
        </button>
      </div>
    </section>
  );
};

export default MoodEntryCards;
