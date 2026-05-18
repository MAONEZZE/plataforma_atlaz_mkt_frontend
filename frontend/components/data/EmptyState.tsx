import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}>
      {icon && <div className="text-muted-foreground mb-1">{icon}</div>}
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground max-w-xs">{description}</p>}
      {action && (
        <Button variant="primary" size="sm" className="mt-2" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
