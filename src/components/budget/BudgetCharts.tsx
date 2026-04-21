import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { TrendingUp, Calendar, PieChart } from "lucide-react";
import type { BudgetCategory } from "./BudgetForecast";

interface Props {
  categories: BudgetCategory[];
  days: number;
  totalBudget: number;
}

const BudgetCharts = ({ categories, days, totalBudget }: Props) => {
  const { t } = useTranslation();
  const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
  const usedPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Generate daily mock data
  const dailyData = Array.from({ length: Math.min(days, 7) }, (_, i) => ({
    name: t("budget.chartsDay", { n: i + 1 }),
    amount: Math.round(30 + Math.random() * 90),
  }));
  const maxDay = dailyData.reduce((max, d) => (d.amount > max.amount ? d : max), dailyData[0]);

  // Category chart data (use translated label)
  const catData = categories
    .filter((c) => c.spent > 0)
    .map((c) => {
      const label = t(`budget.categories.${c.key}`, { defaultValue: c.key });
      return { name: label.split(" ")[0], amount: c.spent };
    });

  const chartColors = ["hsl(185, 85%, 55%)", "hsl(270, 70%, 55%)", "hsl(142, 70%, 50%)", "hsl(38, 92%, 60%)", "hsl(330, 70%, 60%)", "hsl(48, 92%, 55%)", "hsl(0, 72%, 58%)"];

  // AI prediction
  const remaining = totalBudget - totalSpent;
  const daysLeft = Math.max(days - 3, 1);
  const forecast = Math.round((totalSpent / 3) * daysLeft);

  const spentLabel = t("budget.chartsSpent");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 space-y-6"
    >
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">{t("budget.chartsTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("budget.chartsSubtitle")}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("budget.chartsUsed"), value: `${usedPct}%`, icon: PieChart, highlight: usedPct > 70 },
          { label: t("budget.chartsMaxDay"), value: maxDay?.name || "—", icon: Calendar, highlight: false },
          { label: t("budget.chartsForecast", { n: daysLeft }), value: `${forecast}€`, icon: TrendingUp, highlight: forecast > remaining },
        ].map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className={`p-4 rounded-xl text-center ${kpi.highlight ? "bg-destructive/10 border border-destructive/30" : "bg-muted/40"}`}
          >
            <kpi.icon className={`w-5 h-5 mx-auto mb-2 ${kpi.highlight ? "text-destructive" : "text-primary"}`} />
            <p className="text-xs text-muted-foreground">{kpi.label}</p>
            <p className={`text-lg font-bold mt-1 ${kpi.highlight ? "text-destructive" : "text-foreground"}`}>{kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">{t("budget.chartsByDay")}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="name" tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(222, 40%, 10%)",
                    border: "1px solid hsl(222, 30%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 96%)",
                  }}
                  formatter={(v: number) => [`${v}€`, spentLabel]}
                />
                <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                  {dailyData.map((_, idx) => (
                    <Cell key={idx} fill={idx === dailyData.indexOf(maxDay) ? "hsl(270, 70%, 55%)" : "hsl(185, 85%, 55%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">{t("budget.chartsByCat")}</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} layout="vertical">
                <XAxis type="number" tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(222, 40%, 10%)",
                    border: "1px solid hsl(222, 30%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 96%)",
                  }}
                  formatter={(v: number) => [`${v}€`, spentLabel]}
                />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {catData.map((_, idx) => (
                    <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AI predictive */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="p-4 rounded-xl bg-secondary/10 border border-secondary/20"
      >
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-secondary" />
          {t("budget.chartsAiTitle")}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {forecast > remaining
            ? t("budget.chartsAiOver", { amount: forecast - remaining })
            : t("budget.chartsAiOk", { amount: remaining - forecast })}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default BudgetCharts;
