import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, Legend, PieChart as RePieChart, Pie } from "recharts";
import { TrendingUp, Calendar, PieChart } from "lucide-react";
import type { BudgetCategory } from "./BudgetForecast";
import type { Expense } from "./AddExpenseForm";

interface Props {
  categories: BudgetCategory[];
  days: number;
  totalBudget: number;
  expenses?: Expense[];
}

const BudgetCharts = ({ categories, days, totalBudget, expenses = [] }: Props) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.startsWith("fr") ? "fr-FR" : "en-US";
  const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
  const usedPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Build daily data from REAL expenses
  const byDay = new Map<string, number>();
  for (const e of expenses) {
    const d = new Date(e.date);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + e.amount);
  }
  const sortedDays = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  const dailyData = sortedDays.length > 0
    ? sortedDays.map(([day, amount]) => ({
        name: new Date(day).toLocaleDateString(locale, { day: "2-digit", month: "short" }),
        amount: Math.round(amount),
      }))
    : [];
  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--muted-foreground))"];
  const pieData = categories.filter((c) => c.planned > 0).sort((a, b) => b.planned - a.planned)
    .map((c) => ({ name: t(`budget.categories.${c.key}`, { defaultValue: c.key }), value: c.planned }));

  const maxDay = dailyData.length ? dailyData.reduce((max, d) => (d.amount > max.amount ? d : max), dailyData[0]) : null;

  // Planned vs spent per category
  const cmpData = categories.map((c) => {
    const label = t(`budget.categories.${c.key}`, { defaultValue: c.key });
    return {
      name: label.length > 12 ? label.slice(0, 10) + "…" : label,
      planned: c.planned,
      spent: c.spent,
      over: c.spent > c.planned,
    };
  });

  // Realistic forecast: based on actual avg daily spending
  const elapsedDays = byDay.size || 1;
  const avgPerDay = totalSpent / elapsedDays;
  const daysLeft = Math.max(days - elapsedDays, 0);
  const forecast = Math.round(avgPerDay * daysLeft);
  const remaining = totalBudget - totalSpent;

  const spentLabel = t("budget.chartsSpent");
  const plannedLabel = t("budget.trackerPlanned");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 space-y-6"
      data-budget-section="charts"
    >
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">{t("budget.chartsTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("budget.chartsSubtitle")}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("budget.chartsUsed"), value: `${usedPct}%`, icon: PieChart, highlight: usedPct > 80 },
          { label: t("budget.chartsMaxDay"), value: maxDay && maxDay.amount > 0 ? maxDay.name : "—", icon: Calendar, highlight: false },
          { label: t("budget.chartsForecast", { n: daysLeft }), value: `${forecast}€`, icon: TrendingUp, highlight: forecast > remaining && remaining >= 0 },
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
          <h3 className="text-sm font-bold text-foreground mb-3">{t("budget2.charts.split")}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--popover-foreground))" }} formatter={(v: number, n: string) => [`${v}€`, n]} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground mb-3">{t("budget.chartsByDay")}</h3>
          {dailyData.length === 0 ? (
            <p className="flex h-56 items-center justify-center rounded-xl bg-muted/30 px-6 text-center text-sm text-muted-foreground">{t("budget2.charts.noPayments")}</p>
          ) : (
          <div className="h-56">
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
                  {dailyData.map((d, idx) => (
                    <Cell key={idx} fill={d === maxDay && d.amount > 0 ? "hsl(var(--secondary))" : "hsl(var(--primary))"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}
        </div>

        <div className="md:col-span-2">
          <h3 className="text-sm font-bold text-foreground mb-3">{t("budget.chartsPlannedVsSpent")}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cmpData} margin={{ left: -10 }}>
                <XAxis dataKey="name" tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fill: "hsl(215, 20%, 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(222, 40%, 10%)",
                    border: "1px solid hsl(222, 30%, 18%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 96%)",
                  }}
                  formatter={(v: number, name: string) => [`${v}€`, name === "planned" ? plannedLabel : spentLabel]}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "hsl(215, 20%, 70%)" }} formatter={(v) => v === "planned" ? plannedLabel : spentLabel} />
                <Bar dataKey="planned" fill="hsl(185, 85%, 55%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="spent" radius={[4, 4, 0, 0]}>
                  {cmpData.map((d, idx) => (
                    <Cell key={idx} fill={d.over ? "hsl(0, 72%, 58%)" : "hsl(142, 70%, 50%)"} />
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
        transition={{ delay: 0.4 }}
        className="p-4 rounded-xl bg-secondary/10 border border-secondary/20"
      >
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-secondary" />
          {t("budget.chartsAiTitle")}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {totalSpent === 0
            ? t("budget.chartsAiNoData")
            : forecast > remaining
            ? t("budget.chartsAiOver", { amount: Math.max(0, forecast - remaining) })
            : t("budget.chartsAiOk", { amount: Math.max(0, remaining - forecast) })}
        </p>
      </motion.div>
    </motion.div>
  );
};

export default BudgetCharts;
