import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { EXPLORE_BADGES } from "@/lib/explore-badges";
import { pingStreakAction } from "@/lib/streak";

export interface ExploreNode {
  id: string;
  trip_id: string;
  user_id: string;
  parent_id: string | null;
  level: number;
  name: string;
  description: string | null;
  type: string;
  lat: number | null;
  lng: number | null;
  status: "planned" | "in_progress" | "visited";
  points: number;
  media_count: number;
  position_x: number | null;
  position_y: number | null;
  source: string;
  metadata: any;
  visited_at: string | null;
}

export interface ExploreEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: string;
}

export interface ExploreProgress {
  total_points: number;
  nodes_visited: number;
  nodes_total: number;
  cities_completed: number;
  badges_count: number;
}

export interface ExploreBadge {
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  unlocked_at: string;
}

export interface ExploreMedia {
  id: string;
  node_id: string;
  type: string;
  url: string | null;
  caption: string | null;
  mood: string | null;
  created_at: string;
}

export const useExplore = (tripId: string | undefined) => {
  const { user } = useAuth();
  const [nodes, setNodes] = useState<ExploreNode[]>([]);
  const [edges, setEdges] = useState<ExploreEdge[]>([]);
  const [progress, setProgress] = useState<ExploreProgress | null>(null);
  const [badges, setBadges] = useState<ExploreBadge[]>([]);
  const [media, setMedia] = useState<ExploreMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const reload = useCallback(async () => {
    if (!tripId) return;
    setLoading(true);
    const [n, e, p, b, m] = await Promise.all([
      supabase.from("explore_nodes").select("*").eq("trip_id", tripId).order("level"),
      supabase.from("explore_edges").select("*").eq("trip_id", tripId),
      supabase.from("explore_progress").select("*").eq("trip_id", tripId).maybeSingle(),
      supabase.from("explore_badges").select("*").eq("trip_id", tripId),
      supabase.from("explore_node_media").select("*").eq("trip_id", tripId),
    ]);
    setNodes((n.data || []) as ExploreNode[]);
    setEdges((e.data || []) as ExploreEdge[]);
    setProgress((p.data as ExploreProgress | null) || null);
    setBadges((b.data || []) as ExploreBadge[]);
    setMedia((m.data || []) as ExploreMedia[]);
    setLoading(false);
  }, [tripId]);

  useEffect(() => { reload(); }, [reload]);

  // Realtime
  useEffect(() => {
    if (!tripId) return;
    const ch = supabase
      .channel(`explore-${tripId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "explore_nodes", filter: `trip_id=eq.${tripId}` }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "explore_progress", filter: `trip_id=eq.${tripId}` }, () => reload())
      .on("postgres_changes", { event: "*", schema: "public", table: "explore_badges", filter: `trip_id=eq.${tripId}` }, () => reload())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [tripId, reload]);

  const seed = useCallback(async () => {
    if (!tripId) return;
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke("explore-seed", { body: { tripId } });
      if (error) throw error;
      toast.success(`Carte générée : ${data?.nodes || 0} points, ${data?.edges || 0} connexions`);
      await reload();
    } catch (e: any) {
      toast.error(e?.message || "Échec génération");
    } finally {
      setSeeding(false);
    }
  }, [tripId, reload]);

  const visitNode = useCallback(async (nodeId: string) => {
    const { error } = await supabase.from("explore_nodes")
      .update({ status: "visited", visited_at: new Date().toISOString() })
      .eq("id", nodeId);
    if (error) { toast.error("Échec"); return; }
    pingStreakAction("explore:visit"); // ✨ NEW (gamif)
    toast.success("✨ Lieu visité ! Points gagnés");
  }, []);

  const setNodeStatus = useCallback(async (nodeId: string, status: ExploreNode["status"]) => {
    const patch: any = { status };
    if (status === "visited") patch.visited_at = new Date().toISOString();
    await supabase.from("explore_nodes").update(patch).eq("id", nodeId);
    if (status === "visited") pingStreakAction("explore:status-visited"); // ✨ NEW
  }, []);

  const addNode = useCallback(async (input: Partial<ExploreNode>) => {
    if (!user || !tripId) return;
    const { error } = await supabase.from("explore_nodes").insert({
      trip_id: tripId,
      user_id: user.id,
      level: input.level || 2,
      name: input.name || "Nouveau lieu",
      type: input.type || "place",
      status: "planned",
      points: input.points ?? 50,
      parent_id: input.parent_id || null,
      source: "manual",
      lat: input.lat || null,
      lng: input.lng || null,
      position_x: input.position_x ?? Math.random() * 600 - 300,
      position_y: input.position_y ?? Math.random() * 600 - 300,
    });
    if (error) toast.error("Échec ajout"); else toast.success("Lieu ajouté +10pts");
  }, [user, tripId]);

  const deleteNode = useCallback(async (nodeId: string) => {
    await supabase.from("explore_nodes").delete().eq("id", nodeId);
  }, []);

  const addMedia = useCallback(async (nodeId: string, payload: { type: string; caption?: string; url?: string; mood?: string }) => {
    if (!user || !tripId) return;
    const { error } = await supabase.from("explore_node_media").insert({
      node_id: nodeId,
      trip_id: tripId,
      user_id: user.id,
      type: payload.type,
      caption: payload.caption || null,
      url: payload.url || null,
      mood: payload.mood || null,
    });
    if (error) toast.error("Échec souvenir"); else toast.success("Souvenir +20pts");
  }, [user, tripId]);

  // Auto check badges
  useEffect(() => {
    if (!user || !tripId || nodes.length === 0) return;
    const unlocked = new Set(badges.map((b) => b.code));
    EXPLORE_BADGES.forEach((def) => {
      if (!unlocked.has(def.code) && def.check(nodes, media.length)) {
        supabase.from("explore_badges").insert({
          user_id: user.id,
          trip_id: tripId,
          code: def.code,
          name: def.name,
          description: def.description,
          icon: def.icon,
        }).then(({ error }) => {
          if (!error) toast.success(`🏅 Badge débloqué : ${def.name}`, { duration: 4000 });
        });
      }
    });
  }, [nodes, media, badges, user, tripId]);

  return { nodes, edges, progress, badges, media, loading, seeding, seed, reload, visitNode, setNodeStatus, addNode, deleteNode, addMedia };
};
