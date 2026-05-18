"use client";

interface Props {
  password: string;
}

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "bg-border" };
  let met = 0;
  if (pw.length >= 8) met++;
  if (/[A-Z]/.test(pw)) met++;
  if (/[0-9]/.test(pw)) met++;
  if (met === 1) return { score: 33, label: "Fraca", color: "bg-danger" };
  if (met === 2) return { score: 66, label: "Média", color: "bg-warning" };
  return { score: 100, label: "Forte", color: "bg-success" };
}

export function PasswordStrengthIndicator({ password }: Props) {
  const { score, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div className="space-y-1 mt-1">
      <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
