import { Router } from "express";
import { db } from "@workspace/db";
import { resolutionsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const RESOLUTION_CODES = [
  "Solved (Permanently)",
  "Solved (Work Around)",
  "Not Solved (Not Reproducible)",
  "Not Solved (Too Costly)",
  "Closed/Resolved by Caller",
  "Solved (Permanently) - Vendor Fix",
];

// GET /api/resolutions
router.get("/resolutions", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const condition =
    me.role === "manager" ? undefined : eq(resolutionsTable.createdBy, me.id);

  const rows = await db
    .select()
    .from(resolutionsTable)
    .where(condition)
    .orderBy(desc(resolutionsTable.createdAt));

  return res.json(rows);
});

// GET /api/resolutions/:id
router.get("/resolutions/:id", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const id = Number(req.params.id);

  const [row] = await db
    .select()
    .from(resolutionsTable)
    .where(eq(resolutionsTable.id, id))
    .limit(1);

  if (!row) return res.status(404).json({ error: "Not found" });
  if (me.role !== "manager" && row.createdBy !== me.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return res.json(row);
});

// POST /api/resolutions
router.post("/resolutions", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const body = req.body as Record<string, any>;
  const today = new Date().toISOString().split("T")[0];

  const [row] = await db
    .insert(resolutionsTable)
    .values({
      title: body.title,
      description: body.description,
      rootCause: body.rootCause ?? null,
      actionsTaken: body.actionsTaken ?? null,
      resolutionCode: RESOLUTION_CODES.includes(body.resolutionCode) ? body.resolutionCode : null,
      relatedType: body.relatedType ?? null,
      relatedId: body.relatedId ? Number(body.relatedId) : null,
      relatedNumber: body.relatedNumber ?? null,
      resolvedAt: body.resolvedAt ? new Date(body.resolvedAt) : null,
      resolutionDate: body.resolutionDate ?? today,
      createdBy: me.id,
    })
    .returning();

  return res.status(201).json(row);
});

// PATCH /api/resolutions/:id
router.patch("/resolutions/:id", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const id = Number(req.params.id);
  const body = req.body as Record<string, any>;

  const [existing] = await db
    .select()
    .from(resolutionsTable)
    .where(eq(resolutionsTable.id, id))
    .limit(1);

  if (!existing) return res.status(404).json({ error: "Not found" });
  if (me.role !== "manager" && existing.createdBy !== me.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.rootCause !== undefined) updates.rootCause = body.rootCause;
  if (body.actionsTaken !== undefined) updates.actionsTaken = body.actionsTaken;
  if (body.resolutionCode !== undefined) updates.resolutionCode = body.resolutionCode;
  if (body.relatedType !== undefined) updates.relatedType = body.relatedType;
  if (body.relatedId !== undefined) updates.relatedId = body.relatedId ? Number(body.relatedId) : null;
  if (body.relatedNumber !== undefined) updates.relatedNumber = body.relatedNumber;
  if (body.resolvedAt !== undefined) updates.resolvedAt = body.resolvedAt ? new Date(body.resolvedAt) : null;
  if (body.resolutionDate !== undefined) updates.resolutionDate = body.resolutionDate;

  const [row] = await db
    .update(resolutionsTable)
    .set(updates)
    .where(eq(resolutionsTable.id, id))
    .returning();

  return res.json(row);
});

// DELETE /api/resolutions/:id
router.delete("/resolutions/:id", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const id = Number(req.params.id);

  const [existing] = await db
    .select()
    .from(resolutionsTable)
    .where(eq(resolutionsTable.id, id))
    .limit(1);

  if (!existing) return res.status(404).json({ error: "Not found" });
  if (me.role !== "manager" && existing.createdBy !== me.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.delete(resolutionsTable).where(eq(resolutionsTable.id, id));
  return res.status(204).send();
});

export default router;
