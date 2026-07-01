import React from "react";
import { Terminal } from "lucide-react";

export function EmptyState({ 
  icon: Icon = Terminal, 
  title, 
  description, 
  action 
}: { 
  icon?: React.ElementType, 
  title: string, 
  description: string, 
  action?: React.ReactNode 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-xl border border-dashed bg-card/50">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm">
        {description}
      </p>
      {action}
    </div>
  );
}
