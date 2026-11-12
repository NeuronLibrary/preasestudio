import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { friendlyError } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ErrorState({ error, onRetry, className, title = "Gagal memuat data" }: { error?: unknown; onRetry?: () => void; className?: string; title?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-card bg-secondary px-6 py-12 text-center", className)}>
      <AlertCircle className="h-7 w-7 text-destructive" />
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{friendlyError(error)}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Coba lagi
        </Button>
      )}
    </div>
  );
}

export function LoadingState({ label = "Memuat…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground", className)}>
      <Loader2 className="h-4 w-4 animate-spin" /> {label}
    </div>
  );
}

export function EmptyState({ title, description, className, children }: { title: string; description?: string; className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-card bg-secondary px-6 py-12 text-center", className)}>
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}
