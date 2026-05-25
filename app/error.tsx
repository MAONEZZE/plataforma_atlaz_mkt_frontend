"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Algo deu errado.</h1>
      <p className="text-sm text-muted-foreground">
        Tente novamente. Se persistir, fale com o suporte.
      </p>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
