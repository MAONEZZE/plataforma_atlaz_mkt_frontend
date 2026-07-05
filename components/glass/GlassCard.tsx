import { cn } from "@/lib/utils";

type Variant = "glass" | "soft" | "solid";

interface GlassCardProps extends React.ComponentPropsWithoutRef<"div"> {
  variant?: Variant;
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
  ...props
}: GlassCardProps) {
  return (
    <Tag className={cn(variantClass[variant], "p-6", className)} {...props}>
      {children}
    </Tag>
  );
}
