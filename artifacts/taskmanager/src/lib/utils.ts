import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined, includeTime = false) {
  if (!dateStr) return "—";
  try {
    const d = parseISO(dateStr);
    return format(d, includeTime ? "MMM d, yyyy HH:mm" : "MMM d, yyyy");
  } catch (e) {
    return dateStr;
  }
}
