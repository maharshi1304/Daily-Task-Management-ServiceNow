import { Router } from "express";
import { db } from "@workspace/db";
import { workNotesTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const validRelatedTypes = ["incident", "service_request", "general"];

// GET /api/work-notes
router.get("/work-notes", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const condition =
    me.role === "manager" ? undefined : eq(workNotesTable.createdBy, me.id);

  const rows = await db
    .select()
    .from(workNotesTable)
    .where(condition)
    .orderBy(desc(workNotesTable.createdAt));

  return res.json(rows);
});

// GET /api/work-notes/:id
router.get("/work-notes/:id", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const id = Number(req.params.id);

  const [row] = await db
    .select()
    .from(workNotesTable)
    .where(eq(workNotesTable.id, id))
    .limit(1);

  if (!row) return res.status(404).json({ error: "Not found" });
  if (me.role !== "manager" && row.createdBy !== me.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return res.json(row);
});

// POST /api/work-notes
router.post("/work-notes", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const body = req.body as Record<string, any>;
  const today = new Date().toISOString().split("T")[0];

  const [row] = await db
    .insert(workNotesTable)
    .values({
      title: body.title,
      content: body.content,
      relatedType: validRelatedTypes.includes(body.relatedType) ? body.relatedType : (body.relatedType ?? null),
      relatedId: body.relatedId ? Number(body.relatedId) : null,
      relatedNumber: body.relatedNumber ?? null,
      hoursSpent: body.hoursSpent ?? null,
      noteDate: body.noteDate ?? today,
      createdBy: me.id,
    })
    .returning();

  return res.status(201).json(row);
});

// PATCH /api/work-notes/:id
router.patch("/work-notes/:id", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const id = Number(req.params.id);
  const body = req.body as Record<string, any>;

  const [existing] = await db
    .select()
    .from(workNotesTable)
    .where(eq(workNotesTable.id, id))
    .limit(1);

  if (!existing) return res.status(404).json({ error: "Not found" });
  if (me.role !== "manager" && existing.createdBy !== me.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.content !== undefined) updates.content = body.content;
  if (body.relatedType !== undefined) updates.relatedType = body.relatedType;
  if (body.relatedId !== undefined) updates.relatedId = body.relatedId ? Number(body.relatedId) : null;
  if (body.relatedNumber !== undefined) updates.relatedNumber = body.relatedNumber;
  if (body.hoursSpent !== undefined) updates.hoursSpent = body.hoursSpent;
  if (body.noteDate !== undefined) updates.noteDate = body.noteDate;

  const [row] = await db
    .update(workNotesTable)
    .set(updates)
    .where(eq(workNotesTable.id, id))
    .returning();

  return res.json(row);
});

// DELETE /api/work-notes/:id
router.delete("/work-notes/:id", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const id = Number(req.params.id);

  const [existing] = await db
    .select()
    .from(workNotesTable)
    .where(eq(workNotesTable.id, id))
    .limit(1);

  if (!existing) return res.status(404).json({ error: "Not found" });
  if (me.role !== "manager" && existing.createdBy !== me.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.delete(workNotesTable).where(eq(workNotesTable.id, id));
  return res.status(204).send();
});

export default router;
