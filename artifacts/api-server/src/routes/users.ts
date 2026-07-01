import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireManager } from "../middlewares/auth";

const router = Router();

// GET /api/users — manager sees all users; regular user sees only self
router.get("/users", requireAuth, async (req, res) => {
  const me = req.session.user!;

  if (me.role === "manager") {
    const users = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        displayName: usersTable.displayName,
        email: usersTable.email,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .orderBy(usersTable.displayName);
    return res.json(users);
  }

  // regular user: return self only
  const [user] = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      displayName: usersTable.displayName,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, me.id));
  return res.json([user]);
});

// POST /api/users — manager only: create a new user account
router.post("/users", requireManager, async (req, res) => {
  const { username, displayName, email, password, role } = req.body as {
    username?: string;
    displayName?: string;
    email?: string;
    password?: string;
    role?: string;
  };

  if (!username || !displayName || !password) {
    return res.status(400).json({ error: "username, displayName, and password are required" });
  }

  const validRoles = ["user", "manager"];
  const userRole = validRoles.includes(role ?? "") ? (role as "user" | "manager") : "user";

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(usersTable)
    .values({
      username: username.toLowerCase().trim(),
      displayName,
      email: email ?? null,
      passwordHash,
      role: userRole,
    })
    .returning({
      id: usersTable.id,
      username: usersTable.username,
      displayName: usersTable.displayName,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    });

  return res.status(201).json(user);
});

// DELETE /api/users/:id — manager only
router.delete("/users/:id", requireManager, async (req, res) => {
  const id = Number(req.params.id);
  const me = req.session.user!;

  if (id === me.id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }

  await db.delete(usersTable).where(eq(usersTable.id, id));
  return res.status(204).send();
});

// PATCH /api/users/:id/password — manager or self
router.patch("/users/:id/password", requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  const me = req.session.user!;

  if (me.role !== "manager" && me.id !== id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const { password } = req.body as { password?: string };
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db
    .update(usersTable)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(usersTable.id, id));

  return res.json({ ok: true });
});

export default router;
