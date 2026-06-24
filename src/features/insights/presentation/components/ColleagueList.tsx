"use client";

import { useState } from "react";
import type { EmployeeWithMetrics } from "../types";
import { ColleagueCard } from "./ColleagueCard";
import { ColleagueDetailDrawer } from "./ColleagueDetailDrawer";
import { Panel, EmptyState } from "./Panel";

export function ColleagueList({
  members,
}: {
  members: EmployeeWithMetrics[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Panel kicker="Gestión de colaboradores" title="Tu equipo">
      {members.length === 0 ? (
        <EmptyState message="No hay colaboradores que coincidan con los filtros activos." />
      ) : (
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {members.map((m) => (
            <ColleagueCard
              key={m.id}
              employee={m}
              expanded={selected === m.id}
              onToggle={() =>
                setSelected((prev) => (prev === m.id ? null : m.id))
              }
            />
          ))}
        </div>
      )}
      <ColleagueDetailDrawer
        employeeId={selected}
        onClose={() => setSelected(null)}
      />
    </Panel>
  );
}
