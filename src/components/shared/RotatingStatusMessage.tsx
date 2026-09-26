import { useEffect, useState } from "react";

interface Props {
  messages: string[];
  /** Rotation interval in ms (defaults to ~5s). */
  interval?: number;
  className?: string;
}

/**
 * Cycles through a list of short status messages, e.g. to reassure users
 * during a long AI generation. Announces changes politely for screen readers.
 */
const RotatingStatusMessage = ({ messages, interval = 5000, className }: Props) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    setIndex(0);
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, interval);
    return () => clearInterval(id);
  }, [messages, interval]);

  if (messages.length === 0) return null;

  return (
    <p aria-live="polite" className={className}>
      {messages[index]}
    </p>
  );
};

export default RotatingStatusMessage;
