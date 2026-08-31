import { useMemo, useState } from "react";

export function useRowSelection(pageIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const allChecked = pageIds.length > 0 && pageIds.every((id) => prev.has(id));
      if (allChecked) {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...pageIds]);
    });
  }

  function clear() {
    setSelected(new Set());
  }

  const allChecked = useMemo(
    () => pageIds.length > 0 && pageIds.every((id) => selected.has(id)),
    [pageIds, selected],
  );
  const someChecked = useMemo(
    () => !allChecked && pageIds.some((id) => selected.has(id)),
    [pageIds, selected, allChecked],
  );

  return { selected, toggle, toggleAll, clear, allChecked, someChecked };
}
