// Reusable React error boundary. Catches render-time errors in its subtree
// and shows a bilingual recovery UI instead of a blank screen.
import { Component, ReactNode } from "react";
import i18n from "@/i18n";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  /** Optional override of the fallback UI. Receives the caught error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Called when an error is caught — use for logging. */
  onError?: (error: Error, info: { componentStack: string }) => void;
  /** Optional callback for the "reset" action (e.g. clear persisted state). */
  onReset?: () => void;
  /** Show a "Go home" link in the default UI. */
  showHomeLink?: boolean;
}

interface State {
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
    this.props.onError?.(error, info);
  }

  reset = () => {
    this.props.onReset?.();
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);

      const t = i18n.t.bind(i18n);
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border border-destructive/30 bg-destructive/5 text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/15 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-1 max-w-md">
            <h3 className="text-base font-semibold">{t("errorBoundary.title")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("errorBoundary.subtitle")}
            </p>
            {this.state.error.message && (
              <p className="text-[11px] text-muted-foreground/80 mt-2 font-mono break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={this.reset} size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              {t("errorBoundary.retry")}
            </Button>
            {this.props.showHomeLink && (
              <Button asChild variant="outline" size="sm">
                <a href="/">
                  <Home className="w-4 h-4 mr-2" />
                  {t("errorBoundary.home")}
                </a>
              </Button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
