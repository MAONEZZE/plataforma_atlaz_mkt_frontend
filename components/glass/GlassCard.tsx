import { cn } from "@/lib/utils";

type Variant = "glass" | "soft" | "solid";

interface GlassCardProps {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  as?: React.ElementType;
}

const variantClass: Record<Variant, string> = {
  glass: "glass",
  soft: "glass-soft",
  solid: "solid-surface",
};

export function GlassCard({
  variant = "soft",
  className,
  children,
  as: Tag = "div",
}: GlassCardProps) {
  return (
    <Tag className={cn(variantClass[variant], "p-6", className)}>{children}</Tag>
  );
}
