import { Router } from "express";
import { db } from "@workspace/db";
import { incidentsTable } from "@workspace/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function nextIncidentNumber(id: number) {
  return `INC${String(id).padStart(7, "0")}`;
}

// GET /api/incidents
router.get("/incidents", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const condition =
    me.role === "manager" ? undefined : eq(incidentsTable.createdBy, me.id);

  const rows = await db
    .select()
    .from(incidentsTable)
    .where(condition)
    .orderBy(desc(incidentsTable.createdAt));

  return res.json(rows);
});

// GET /api/incidents/:id
router.get("/incidents/:id", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const id = Number(req.params.id);

  const [row] = await db
    .select()
    .from(incidentsTable)
    .where(eq(incidentsTable.id, id))
    .limit(1);

  if (!row) return res.status(404).json({ error: "Not found" });
  if (me.role !== "manager" && row.createdBy !== me.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return res.json(row);
});

// POST /api/incidents
router.post("/incidents", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const body = req.body as Record<string, any>;
  const today = new Date().toISOString().split("T")[0];
  const validStatuses = ["open", "in_progress", "resolved", "closed"];
  const validPriorities = ["low", "medium", "high", "critical"];
  const status = validStatuses.includes(body.status ?? "") ? body.status! : "open";
  const priority = validPriorities.includes(body.priority ?? "") ? body.priority! : "medium";

  const [row] = await db
    .insert(incidentsTable)
    .values({
      title: body.title,
      description: body.description ?? null,
      shortDescription: body.shortDescription ?? null,
      status: status as any,
      priority: priority as any,
      assignedTo: body.assignedTo ?? me.displayName,
      category: body.category ?? null,
      configurationItem: body.configurationItem ?? null,
      tags: body.tags ?? null,
      incidentDate: body.incidentDate ?? today,
      createdBy: me.id,
    })
    .returning();

  // Update incidentNumber after insert
  await db
    .update(incidentsTable)
    .set({ incidentNumber: nextIncidentNumber(row.id) })
    .where(eq(incidentsTable.id, row.id));

  return res.status(201).json({ ...row, incidentNumber: nextIncidentNumber(row.id) });
});

// PATCH /api/incidents/:id
router.patch("/incidents/:id", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const id = Number(req.params.id);
  const body = req.body as Record<string, any>;

  const [existing] = await db
    .select()
    .from(incidentsTable)
    .where(eq(incidentsTable.id, id))
    .limit(1);

  if (!existing) return res.status(404).json({ error: "Not found" });
  if (me.role !== "manager" && existing.createdBy !== me.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const validStatuses = ["open", "in_progress", "resolved", "closed"];
  const validPriorities = ["low", "medium", "high", "critical"];

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.shortDescription !== undefined) updates.shortDescription = body.shortDescription;
  if (body.status !== undefined && validStatuses.includes(body.status)) updates.status = body.status;
  if (body.priority !== undefined && validPriorities.includes(body.priority)) updates.priority = body.priority;
  if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo;
  if (body.category !== undefined) updates.category = body.category;
  if (body.configurationItem !== undefined) updates.configurationItem = body.configurationItem;
  if (body.tags !== undefined) updates.tags = body.tags;
  if (body.incidentDate !== undefined) updates.incidentDate = body.incidentDate;

  const [row] = await db
    .update(incidentsTable)
    .set(updates)
    .where(eq(incidentsTable.id, id))
    .returning();

  return res.json(row);
});

// DELETE /api/incidents/:id
router.delete("/incidents/:id", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const id = Number(req.params.id);

  const [existing] = await db
    .select()
    .from(incidentsTable)
    .where(eq(incidentsTable.id, id))
    .limit(1);

  if (!existing) return res.status(404).json({ error: "Not found" });
  if (me.role !== "manager" && existing.createdBy !== me.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.delete(incidentsTable).where(eq(incidentsTable.id, id));
  return res.status(204).send();
});

export default router;
