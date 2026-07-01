import React from "react";
import { Badge } from "@/components/ui/badge";
import { IncidentStatus, ServiceRequestStatus, IncidentPriority, ServiceRequestPriority } from "@workspace/api-client-react";

export function StatusBadge({ status, className }: { status: IncidentStatus | ServiceRequestStatus | string; className?: string }) {
  let colorClass = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
  let label = status.replace('_', ' ').toUpperCase();

  switch (status) {
    case "open":
      colorClass = "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      break;
    case "in_progress":
      colorClass = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
      break;
    case "resolved":
      colorClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      break;
    case "closed":
      colorClass = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
      break;
  }

  return (
    <Badge variant="outline" className={`font-mono text-[10px] tracking-wider uppercase border-transparent ${colorClass} ${className}`}>
      {label}
    </Badge>
  );
}

export function PriorityBadge({ priority, className }: { priority: IncidentPriority | ServiceRequestPriority | string; className?: string }) {
  let colorClass = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
  let label = priority.toUpperCase();

  switch (priority) {
    case "critical":
      colorClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-900/50";
      break;
    case "high":
      colorClass = "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-900/50";
      break;
    case "medium":
      colorClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900/50";
      break;
    case "low":
      colorClass = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-800";
      break;
  }

  return (
    <Badge variant="outline" className={`font-mono text-[10px] tracking-wider ${colorClass} ${className}`}>
      {label}
    </Badge>
  );
}
