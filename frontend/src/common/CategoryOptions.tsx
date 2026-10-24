import type { Category, CategoryType } from "../services/categoriesService";

interface Props {
  categories: Category[];
  type?: CategoryType;
  showType?: boolean;
}

export default function CategoryOptions({ categories, type, showType = false }: Props) {
  const list = type ? categories.filter((c) => c.type === type) : categories;
  const ids = new Set(list.map((c) => c.id));

  const childrenOf = new Map<string, Category[]>();
  const roots: Category[] = [];
  for (const c of list) {
    if (c.parentId && ids.has(c.parentId)) {
      childrenOf.set(c.parentId, [...(childrenOf.get(c.parentId) ?? []), c]);
    } else {
      roots.push(c);
    }
  }

  const suffix = (c: Category) =>
    showType ? ` (${c.type === "INCOME" ? "income" : "expense"})` : "";

  return (
    <>
      {roots.map((r) => {
        const kids = childrenOf.get(r.id);
        if (!kids?.length) {
          return (
            <option key={r.id} value={r.id}>
              {r.name}
              {suffix(r)}
            </option>
          );
        }
        return (
          <optgroup key={r.id} label={`${r.name}${suffix(r)}`}>
            <option value={r.id}>{r.name} (general)</option>
            {kids.map((k) => (
              <option key={k.id} value={k.id}>
                {k.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </>
  );
}