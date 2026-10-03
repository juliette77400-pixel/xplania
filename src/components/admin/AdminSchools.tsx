import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Stats = {
  students: number; active30: number; quiz_done: number; trips: number; journals: number;
  tools: Record<string, number>; destinations: { name: string; count: number }[];
  surveys: number; nps_avg: number | null; ease_avg: number | null;
};

const SchoolStats = ({ id }: { id: string }) => {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-school-stats", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_school_stats", { _school_id: id });
      if (error) throw error;
      return data as unknown as Stats;
    },
  });
  if (isLoading || !data) return <p className="text-sm text-muted-foreground">{t("adminSchools.loading")}</p>;
  const kpis: [string, string | number][] = [
    ["students", data.students], ["active30", data.active30], ["quiz", data.quiz_done],
    ["trips", data.trips], ["journals", data.journals], ["surveys", data.surveys],
    ["nps", data.nps_avg ?? "—"], ["ease", data.ease_avg != null ? `${data.ease_avg}/5` : "—"],
  ];
  const tools = Object.entries(data.tools).sort((a, b) => b[1] - a[1]);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpis.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">{t(`adminSchools.kpi.${k}`)}</p>
            <p className="text-xl font-bold text-foreground">{v}</p>
          </div>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <h4 className="text-xs font-semibold mb-2">{t("adminSchools.tools")}</h4>
          {tools.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
            <ul className="space-y-1 text-sm">{tools.map(([k, n]) => (
              <li key={k} className="flex justify-between"><span className="text-muted-foreground">{k}</span><span className="font-semibold">{n}</span></li>
            ))}</ul>
          )}
        </div>
        <div>
          <h4 className="text-xs font-semibold mb-2">{t("adminSchools.destinations")}</h4>
          {data.destinations.length === 0 ? <p className="text-sm text-muted-foreground">—</p> : (
            <ul className="space-y-1 text-sm">{data.destinations.map((d) => (
              <li key={d.name} className="flex justify-between"><span className="text-muted-foreground">{d.name}</span><span className="font-semibold">{d.count}</span></li>
            ))}</ul>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminSchools = () => {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { data: schools = [] } = useQuery({
    queryKey: ["admin-schools"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schools").select("id, name, email_domain").order("name");
      if (error) throw error;
      return data;
    },
  });

  const add = async () => {
    const d = domain.trim().toLowerCase().replace(/^@/, "");
    if (!name.trim() || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) { toast.error(t("adminSchools.invalid")); return; }
    const { error } = await supabase.from("schools").insert({ name: name.trim(), email_domain: d });
    if (error) { toast.error(t("adminSchools.invalid")); return; }
    setName(""); setDomain("");
    qc.invalidateQueries({ queryKey: ["admin-schools"] });
  };

  const remove = async (id: string) => {
    if (!confirm(t("adminSchools.confirmDelete"))) return;
    await supabase.from("schools").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-schools"] });
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-4 mt-6 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">{t("adminSchools.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("adminSchools.subtitle")}</p>
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        <Input placeholder={t("adminSchools.namePh")} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        <Input placeholder={t("adminSchools.domainPh")} value={domain} onChange={(e) => setDomain(e.target.value)} maxLength={120} />
        <Button onClick={add}>{t("adminSchools.add")}</Button>
      </div>
      {schools.length === 0 && <p className="text-sm text-muted-foreground">{t("adminSchools.empty")}</p>}
      <ul className="space-y-3">
        {schools.map((s) => (
          <li key={s.id} className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <button className="text-left" onClick={() => setOpen(open === s.id ? null : s.id)}>
                <p className="font-semibold text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground">@{s.email_domain}</p>
              </button>
              <Button variant="ghost" size="sm" onClick={() => remove(s.id)}>{t("adminSchools.delete")}</Button>
            </div>
            {open === s.id && <div className="mt-3"><SchoolStats id={s.id} /></div>}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default AdminSchools;
