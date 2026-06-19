import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  journalId: string;
  blockId: string;
  initialUrl?: string | null;
  onSaved: () => void;
}

const AudioRecorder = ({ journalId, blockId, initialUrl, onSaved }: Props) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [recording, setRecording] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState<string | null>(initialUrl || null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((tr) => tr.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await upload(blob);
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
    } catch {
      toast.error(t("audio.micDenied"));
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
  };

  const upload = async (blob: Blob) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/${journalId}/${crypto.randomUUID()}.webm`;
    const { error } = await supabase.storage.from("journal-media").upload(path, blob, { contentType: "audio/webm" });
    if (error) { toast.error(t("audio.uploadFail")); setUploading(false); return; }
    const { data: signed } = await supabase.storage.from("journal-media").createSignedUrl(path, 60 * 60 * 24 * 365);
    await supabase.from("journal_blocks").update({ content: { path, url: signed?.signedUrl } }).eq("id", blockId);
    setUrl(signed?.signedUrl || null);
    setUploading(false);
    onSaved();
    toast.success(t("audio.saved"));
  };

  return (
    <div className="space-y-2">
      {url ? <audio controls src={url} className="w-full" /> : null}
      <div className="flex gap-2">
        {!recording ? (
          <Button type="button" size="sm" variant="outline" onClick={start} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />} {t("audio.record")}
          </Button>
        ) : (
          <Button type="button" size="sm" variant="destructive" onClick={stop}>
            <Square className="w-4 h-4" /> {t("audio.stop")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
