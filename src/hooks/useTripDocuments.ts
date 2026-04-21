// ✨ NEW (Tâche 3) — Documents de voyage (billets, passeport, réservations)
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export type TripDocument = {
  id: string;
  trip_id: string;
  user_id: string;
  name: string;
  doc_type: string;
  file_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  notes: string | null;
  created_at: string;
};

const BUCKET = "trip-documents";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function useTripDocuments(tripId?: string) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDocs = useCallback(async () => {
    if (!tripId || !user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("trip_documents")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });
    if (!error && data) setDocuments(data as TripDocument[]);
    setLoading(false);
  }, [tripId, user]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const upload = async (file: File, docType: string = "other", notes?: string) => {
    if (!tripId || !user) return null;
    if (file.size > MAX_SIZE) {
      toast.error("Fichier trop volumineux (max 10 Mo)");
      return null;
    }
    const ext = file.name.split(".").pop() || "bin";
    const path = `${user.id}/${tripId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });
    if (upErr) {
      toast.error("Échec de l'upload");
      return null;
    }
    const { data, error } = await supabase
      .from("trip_documents")
      .insert({
        trip_id: tripId,
        user_id: user.id,
        name: file.name,
        doc_type: docType,
        file_path: path,
        mime_type: file.type,
        size_bytes: file.size,
        notes: notes || null,
      })
      .select()
      .single();
    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      toast.error("Échec de l'enregistrement");
      return null;
    }
    setDocuments((prev) => [data as TripDocument, ...prev]);
    toast.success("Document ajouté");
    return data as TripDocument;
  };

  const remove = async (doc: TripDocument) => {
    await supabase.storage.from(BUCKET).remove([doc.file_path]);
    const { error } = await supabase.from("trip_documents").delete().eq("id", doc.id);
    if (error) {
      toast.error("Échec de la suppression");
      return;
    }
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    toast.success("Document supprimé");
  };

  const getSignedUrl = async (doc: TripDocument) => {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(doc.file_path, 60 * 10);
    if (error || !data) {
      toast.error("Impossible d'ouvrir le fichier");
      return null;
    }
    return data.signedUrl;
  };

  return { documents, loading, upload, remove, getSignedUrl, refetch: fetchDocs };
}
