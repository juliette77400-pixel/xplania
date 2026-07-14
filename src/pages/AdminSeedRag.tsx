import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AppNavbar from "@/components/shared/AppNavbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Loader2, ShieldAlert, XCircle, Sparkles, Database } from "lucide-react";
import { toast } from "sonner";
import { SEED_CHUNKS } from "./admin-seed-rag.data";

type ChunkStatus = "pending" | "inserting" | "inserted" | "skipped" | "embedding" | "embedded" | "error";

interface ChunkRow {
  key: string;
  destination: string;
  title: string;
  status: ChunkStatus;
  message?: string;
}

export default function AdminSeedRag() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<ChunkRow[]>(
    SEED_CHUNKS.map((c) => ({
      key: c.chunk_key,
      destination: c.destination_slug,
      title: c.title,
      status: "pending",
    })),
  );
  const [running, setRunning] = useState(false);
  const [embedRemaining, setEmbedRemaining] = useState<number | null>(null);

  // Admin check
  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  // Load existing seed status to prefill rows
  useEffect(() => {
    if (!isAdmin) return;
    supabase
      .from("rag_seed_status")
      .select("chunk_key, status, error_message")
      .then(({ data }) => {
        if (!data) return;
        setRows((prev) =>
          prev.map((r) => {
            const existing = data.find((d) => d.chunk_key === r.key);
            if (!existing) return r;
            return { ...r, status: existing.status as ChunkStatus, message: existing.error_message ?? undefined };
          }),
        );
      });
  }, [isAdmin]);

  const stats = useMemo(() => {
    const total = rows.length;
    const done = rows.filter((r) => r.status === "inserted" || r.status === "skipped" || r.status === "embedded").length;
    const errors = rows.filter((r) => r.status === "error").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    return { total, done, errors, pending };
  }, [rows]);

  const runIndexation = async () => {
    if (running) return;
    setRunning(true);
    try {
      // 1. Insert chunks (batched, idempotent)
      setRows((prev) => prev.map((r) => (r.status === "pending" ? { ...r, status: "inserting" } : r)));
      const { data: seedRes, error: seedErr } = await supabase.functions.invoke("rag-seed-chunks", {
        body: { chunks: SEED_CHUNKS },
      });
      if (seedErr) throw new Error(seedErr.message || "seed failed");

      const results: Array<{ chunk_key: string; status: string; error?: string }> = seedRes?.results ?? [];
      setRows((prev) =>
        prev.map((r) => {
          const res = results.find((x) => x.chunk_key === r.key);
          if (!res) return r;
          if (res.status === "inserted") return { ...r, status: "inserted" };
          if (res.status === "skipped") return { ...r, status: "skipped" };
          return { ...r, status: "error", message: res.error };
        }),
      );

      toast.success(`Insertion : ${seedRes.inserted} nouveaux, ${seedRes.skipped} déjà présents, ${seedRes.errors} erreurs`);

      // 2. Trigger embeddings (batched, may need several passes)
      let remaining = Infinity;
      let iterations = 0;
      while (remaining > 0 && iterations < 5) {
        iterations++;
        setRows((prev) => prev.map((r) => (r.status === "inserted" ? { ...r, status: "embedding" } : r)));
        const { data: embedRes, error: embedErr } = await supabase.functions.invoke("documents-embed", {
          body: { batchSize: 20 },
        });
        if (embedErr) throw new Error(embedErr.message || "embed failed");
        remaining = embedRes?.remaining ?? 0;
        setEmbedRemaining(remaining);
        toast.info(`Embeddings : ${embedRes.embedded} générés, ${remaining} restants`);
        if (embedRes.embedded === 0) break;
      }

      // 3. Mark all inserted/skipped as embedded when remaining hits 0
      if (remaining === 0) {
        setRows((prev) =>
          prev.map((r) =>
            r.status === "embedding" || r.status === "inserted" || r.status === "skipped"
              ? { ...r, status: "embedded" }
              : r,
          ),
        );
        toast.success("Tous les chunks sont indexés et vectorisés ✨");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      toast.error(`Échec : ${msg}`);
    } finally {
      setRunning(false);
    }
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <AppNavbar />
        <div className="container mx-auto p-8 max-w-md text-center space-y-4">
          <ShieldAlert className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-semibold">Accès refusé</h1>
          <p className="text-muted-foreground">Cette page est réservée aux administrateurs.</p>
        </div>
      </div>
    );
  }

  const progress = Math.round((stats.done / stats.total) * 100);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-7 w-7 text-primary" /> Indexation RAG — contenus seed
          </h1>
          <p className="text-muted-foreground mt-2">
            Insère et vectorise les 16 chunks de connaissance de base (Kyoto, Tokyo, Lisbonne, Marrakech).
            Idempotent : les chunks déjà indexés sont ignorés.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Progression</CardTitle>
            <Badge variant="outline">
              {stats.done}/{stats.total} indexés · {stats.errors} erreurs
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} />
            <div className="flex gap-3 flex-wrap">
              <Button onClick={runIndexation} disabled={running} size="lg">
                {running ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Indexation en cours…</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Indexer les contenus de base</>
                )}
              </Button>
              {embedRemaining !== null && (
                <span className="text-sm text-muted-foreground self-center">
                  {embedRemaining} chunk(s) restant(s) à vectoriser
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <StatusIcon status={row.status} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{row.title}</p>
                <p className="text-xs text-muted-foreground">
                  {row.destination} · <code className="font-mono">{row.key}</code>
                  {row.message ? ` · ${row.message}` : ""}
                </p>
              </div>
              <Badge variant={badgeVariant(row.status)}>{row.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: ChunkStatus }) {
  if (status === "embedded" || status === "inserted" || status === "skipped")
    return <CheckCircle2 className="h-5 w-5 text-primary" />;
  if (status === "error") return <XCircle className="h-5 w-5 text-destructive" />;
  if (status === "inserting" || status === "embedding")
    return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  return <div className="h-5 w-5 rounded-full border border-muted-foreground/30" />;
}

function badgeVariant(status: ChunkStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "embedded") return "default";
  if (status === "error") return "destructive";
  if (status === "pending") return "outline";
  return "secondary";
}
