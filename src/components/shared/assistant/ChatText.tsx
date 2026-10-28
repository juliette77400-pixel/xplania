// Assistant answers sometimes contain **bold** markers: show them as bold instead of raw stars.
// Text only (no HTML is ever injected), line breaks kept by the parent's whitespace-pre-wrap.
export default function ChatText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") && p.length > 4
          ? <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>
          : <span key={i}>{p.replace(/^\s*\*\s+/gm, "• ")}</span>,
      )}
    </>
  );
}
