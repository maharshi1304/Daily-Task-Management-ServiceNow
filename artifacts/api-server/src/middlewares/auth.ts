import { Request, Response, NextFunction } from "express";

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  role: "user" | "manager";
  email: string | null;
}

declare module "express-session" {
  interface SessionData {
    user: AuthUser;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function requireManager(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.session.user.role !== "manager") {
    res.status(403).json({ error: "Forbidden: manager access required" });
    return;
  }
  next();
}
