import { container } from "@/server/lib/container";

export interface DefaultCategoryDef {
  key: string;
  name: string;
  icon: string;
  color: string;
}

export const DEFAULT_KNOWLEDGE_CATEGORIES: DefaultCategoryDef[] = [
  { key: "marketing", name: "Marketing", icon: "megaphone", color: "#f59e0b" },
  { key: "strategy", name: "Strategy", icon: "compass", color: "#6366f1" },
  { key: "operations", name: "Operations", icon: "gear", color: "#10b981" },
  { key: "design", name: "Design", icon: "palette", color: "#ec4899" },
  { key: "hr", name: "HR", icon: "people", color: "#3b82f6" },
  { key: "finance", name: "Finance", icon: "wallet", color: "#14b8a6" },
  { key: "sales", name: "Sales", icon: "trend", color: "#ef4444" },
  { key: "product", name: "Product", icon: "sparkles", color: "#8b5cf6" },
  { key: "templates", name: "Templates", icon: "doc", color: "#64748b" },
];

/**
 * Ensures the default categories exist for a workspace (idempotent).
 * Safe to call on every list/create; cheap because of the unique constraint.
 */
export async function ensureDefaultCategories(workspaceId: string): Promise<void> {
  await Promise.all(
    DEFAULT_KNOWLEDGE_CATEGORIES.map((def) =>
      container.knowledgeRepository
        .findCategoryByKey(workspaceId, def.key)
        .then((existing) =>
          existing
            ? null
            : container.knowledgeRepository.createCategory({
                workspaceId,
                key: def.key,
                name: def.name,
                icon: def.icon,
                color: def.color,
              })
        )
    )
  );
}
