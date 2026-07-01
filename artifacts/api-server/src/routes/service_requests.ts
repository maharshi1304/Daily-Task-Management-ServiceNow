import { Router } from "express";
import { db } from "@workspace/db";
import { serviceRequestsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function nextRequestNumber(id: number) {
  return `RITM${String(id).padStart(7, "0")}`;
}

const validStatuses = ["open", "in_progress", "resolved", "closed", "pending", "cancelled"];
const validPriorities = ["low", "medium", "high", "critical"];

// GET /api/service-requests
router.get("/service-requests", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const condition =
    me.role === "manager" ? undefined : eq(serviceRequestsTable.createdBy, me.id);

  const rows = await db
    .select()
    .from(serviceRequestsTable)
    .where(condition)
    .orderBy(desc(serviceRequestsTable.createdAt));

  return res.json(rows);
});

// GET /api/service-requests/:id
router.get("/service-requests/:id", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const id = Number(req.params.id);

  const [row] = await db
    .select()
    .from(serviceRequestsTable)
    .where(eq(serviceRequestsTable.id, id))
    .limit(1);

  if (!row) return res.status(404).json({ error: "Not found" });
  if (me.role !== "manager" && row.createdBy !== me.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  return res.json(row);
});

// POST /api/service-requests
router.post("/service-requests", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const body = req.body as Record<string, any>;
  const today = new Date().toISOString().split("T")[0];

  const [row] = await db
    .insert(serviceRequestsTable)
    .values({
      title: body.title,
      description: body.description ?? null,
      requester: body.requester ?? me.displayName,
      status: validStatuses.includes(body.status) ? body.status : "open",
      priority: validPriorities.includes(body.priority) ? body.priority : "medium",
      category: body.category ?? null,
      subCategory: body.subCategory ?? null,
      assignedGroup: body.assignedGroup ?? null,
      tags: body.tags ?? null,
      requestDate: body.requestDate ?? today,
      createdBy: me.id,
    })
    .returning();

  await db
    .update(serviceRequestsTable)
    .set({ requestNumber: nextRequestNumber(row.id) })
    .where(eq(serviceRequestsTable.id, row.id));

  return res.status(201).json({ ...row, requestNumber: nextRequestNumber(row.id) });
});

// PATCH /api/service-requests/:id
router.patch("/service-requests/:id", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const id = Number(req.params.id);
  const body = req.body as Record<string, any>;

  const [existing] = await db
    .select()
    .from(serviceRequestsTable)
    .where(eq(serviceRequestsTable.id, id))
    .limit(1);

  if (!existing) return res.status(404).json({ error: "Not found" });
  if (me.role !== "manager" && existing.createdBy !== me.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const updates: Record<string, any> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.description !== undefined) updates.description = body.description;
  if (body.requester !== undefined) updates.requester = body.requester;
  if (body.status !== undefined && validStatuses.includes(body.status)) updates.status = body.status;
  if (body.priority !== undefined && validPriorities.includes(body.priority)) updates.priority = body.priority;
  if (body.category !== undefined) updates.category = body.category;
  if (body.subCategory !== undefined) updates.subCategory = body.subCategory;
  if (body.assignedGroup !== undefined) updates.assignedGroup = body.assignedGroup;
  if (body.tags !== undefined) updates.tags = body.tags;
  if (body.requestDate !== undefined) updates.requestDate = body.requestDate;

  const [row] = await db
    .update(serviceRequestsTable)
    .set(updates)
    .where(eq(serviceRequestsTable.id, id))
    .returning();

  return res.json(row);
});

// DELETE /api/service-requests/:id
router.delete("/service-requests/:id", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const id = Number(req.params.id);

  const [existing] = await db
    .select()
    .from(serviceRequestsTable)
    .where(eq(serviceRequestsTable.id, id))
    .limit(1);

  if (!existing) return res.status(404).json({ error: "Not found" });
  if (me.role !== "manager" && existing.createdBy !== me.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  await db.delete(serviceRequestsTable).where(eq(serviceRequestsTable.id, id));
  return res.status(204).send();
});

export default router;
