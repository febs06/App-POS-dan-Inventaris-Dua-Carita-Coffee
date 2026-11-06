"use client";

import React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface SortableHeaderProps {
  label: string;
  columnKey: string;
  currentSortKey: string | null;
  sortDirection: "asc" | "desc";
  onSort: (key: string) => void;
  align?: "left" | "center" | "right";
  className?: string;
  badge?: React.ReactNode;
}

export default function SortableHeader({
  label,
  columnKey,
  currentSortKey,
  sortDirection,
  onSort,
  align = "left",
  className = "",
  badge,
}: SortableHeaderProps) {
  const isSorted = currentSortKey === columnKey;

  const getAlignClasses = () => {
    if (align === "right") return "justify-end text-right";
    if (align === "center") return "justify-center text-center";
    return "justify-start text-left";
  };

  return (
    <th
      onClick={() => onSort(columnKey)}
      className={`py-3.5 px-4 cursor-pointer select-none transition-colors group ${className} ${
        isSorted
          ? "text-amber-400 bg-amber-500/10 font-black"
          : "hover:text-white hover:bg-slate-800/40"
      }`}
      title={`Klik untuk mengurutkan data berdasarkan ${label}`}
    >
      <div className={`inline-flex items-center gap-1.5 w-full ${getAlignClasses()}`}>
        <span className="tracking-wider">{label}</span>
        {badge}
        
        {/* SteamDB-style sorting indicator */}
        <span
          className={`inline-flex items-center transition-all ${
            isSorted
              ? "text-amber-400 scale-110"
              : "text-slate-500 opacity-40 group-hover:opacity-100 group-hover:text-slate-300"
          }`}
        >
          {isSorted ? (
            sortDirection === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5 stroke-[2.5]" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 stroke-[2]" />
          )}
        </span>
      </div>
    </th>
  );
}

