import { Router } from "express";
import { db } from "@workspace/db";
import {
  incidentsTable,
  serviceRequestsTable,
  workNotesTable,
  resolutionsTable,
  usersTable,
} from "@workspace/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// GET /api/dashboard/summary?userId=<id>
// For managers: ?userId=<id> shows that user's summary; without userId shows all
// For regular users: always shows own summary
router.get("/dashboard/summary", requireAuth, async (req, res) => {
  const me = req.session.user!;
  const today = new Date().toISOString().split("T")[0];

  let userId: number | undefined;
  if (me.role === "manager" && req.query.userId) {
    userId = Number(req.query.userId);
  } else if (me.role !== "manager") {
    userId = me.id;
  }

  const incFilter = userId !== undefined ? eq(incidentsTable.createdBy, userId) : undefined;
  const srFilter = userId !== undefined ? eq(serviceRequestsTable.createdBy, userId) : undefined;
  const wnFilter = userId !== undefined ? eq(workNotesTable.createdBy, userId) : undefined;
  const resFilter = userId !== undefined ? eq(resolutionsTable.createdBy, userId) : undefined;

  const [incidents, serviceRequests, workNotes, resolutions] = await Promise.all([
    db.select().from(incidentsTable).where(incFilter),
    db.select().from(serviceRequestsTable).where(srFilter),
    db.select().from(workNotesTable).where(wnFilter),
    db.select().from(resolutionsTable).where(resFilter),
  ]);

  const todayIncidents = incidents.filter((i) => i.incidentDate === today);
  const todayRequests = serviceRequests.filter((r) => r.requestDate === today);
  const todayNotes = workNotes.filter((n) => n.noteDate === today);
  const todayResolutions = resolutions.filter((r) => r.resolutionDate === today);

  return res.json({
    today: {
      incidents: todayIncidents.length,
      serviceRequests: todayRequests.length,
      workNotes: todayNotes.length,
      resolutions: todayResolutions.length,
    },
    all: {
      incidents: incidents.length,
      serviceRequests: serviceRequests.length,
      workNotes: workNotes.length,
      resolutions: resolutions.length,
    },
    incidentsByStatus: {
      open: incidents.filter((i) => i.status === "open").length,
      in_progress: incidents.filter((i) => i.status === "in_progress").length,
      resolved: incidents.filter((i) => i.status === "resolved").length,
      closed: incidents.filter((i) => i.status === "closed").length,
    },
    requestsByStatus: {
      open: serviceRequests.filter((r) => r.status === "open").length,
      in_progress: serviceRequests.filter((r) => r.status === "in_progress").length,
      resolved: serviceRequests.filter((r) => r.status === "resolved").length,
      closed: serviceRequests.filter((r) => r.status === "closed").length,
    },
  });
});

// GET /api/dashboard/activity?userId=<id>
router.get("/dashboard/activity", requireAuth, async (req, res) => {
  const me = req.session.user!;

  let userId: number | undefined;
  if (me.role === "manager" && req.query.userId) {
    userId = Number(req.query.userId);
  } else if (me.role !== "manager") {
    userId = me.id;
  }

  const incFilter = userId !== undefined ? eq(incidentsTable.createdBy, userId) : undefined;
  const srFilter = userId !== undefined ? eq(serviceRequestsTable.createdBy, userId) : undefined;
  const wnFilter = userId !== undefined ? eq(workNotesTable.createdBy, userId) : undefined;
  const resFilter = userId !== undefined ? eq(resolutionsTable.createdBy, userId) : undefined;

  const [incidents, serviceRequests, workNotes, resolutions] = await Promise.all([
    db.select().from(incidentsTable).where(incFilter).orderBy(desc(incidentsTable.createdAt)).limit(10),
    db.select().from(serviceRequestsTable).where(srFilter).orderBy(desc(serviceRequestsTable.createdAt)).limit(10),
    db.select().from(workNotesTable).where(wnFilter).orderBy(desc(workNotesTable.createdAt)).limit(10),
    db.select().from(resolutionsTable).where(resFilter).orderBy(desc(resolutionsTable.createdAt)).limit(10),
  ]);

  const feed = [
    ...incidents.map((i) => ({
      type: "incident" as const,
      id: i.id,
      number: i.incidentNumber,
      title: i.title,
      status: i.status,
      priority: i.priority,
      date: i.incidentDate,
      createdAt: i.createdAt,
      createdBy: i.createdBy,
    })),
    ...serviceRequests.map((r) => ({
      type: "service_request" as const,
      id: r.id,
      number: r.requestNumber,
      title: r.title,
      status: r.status,
      priority: r.priority,
      date: r.requestDate,
      createdAt: r.createdAt,
      createdBy: r.createdBy,
    })),
    ...workNotes.map((n) => ({
      type: "work_note" as const,
      id: n.id,
      number: null,
      title: n.title,
      status: null,
      priority: null,
      date: n.noteDate,
      createdAt: n.createdAt,
      createdBy: n.createdBy,
    })),
    ...resolutions.map((r) => ({
      type: "resolution" as const,
      id: r.id,
      number: null,
      title: r.title,
      status: null,
      priority: null,
      date: r.resolutionDate,
      createdAt: r.createdAt,
      createdBy: r.createdBy,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20);

  return res.json(feed);
});

// GET /api/dashboard/team — manager only: summary per user
router.get("/dashboard/team", requireAuth, async (req, res) => {
  const me = req.session.user!;
  if (me.role !== "manager") {
    return res.status(403).json({ error: "Manager access required" });
  }

  const today = new Date().toISOString().split("T")[0];

  const [users, incidents, serviceRequests, workNotes, resolutions] = await Promise.all([
    db.select({ id: usersTable.id, displayName: usersTable.displayName, username: usersTable.username, role: usersTable.role }).from(usersTable).orderBy(usersTable.displayName),
    db.select().from(incidentsTable),
    db.select().from(serviceRequestsTable),
    db.select().from(workNotesTable),
    db.select().from(resolutionsTable),
  ]);

  const team = users.map((user) => {
    const userIncidents = incidents.filter((i) => i.createdBy === user.id);
    const userRequests = serviceRequests.filter((r) => r.createdBy === user.id);
    const userNotes = workNotes.filter((n) => n.createdBy === user.id);
    const userResolutions = resolutions.filter((r) => r.createdBy === user.id);

    return {
      user,
      today: {
        incidents: userIncidents.filter((i) => i.incidentDate === today).length,
        serviceRequests: userRequests.filter((r) => r.requestDate === today).length,
        workNotes: userNotes.filter((n) => n.noteDate === today).length,
        resolutions: userResolutions.filter((r) => r.resolutionDate === today).length,
      },
      total: {
        incidents: userIncidents.length,
        serviceRequests: userRequests.length,
        workNotes: userNotes.length,
        resolutions: userResolutions.length,
      },
      openIncidents: userIncidents.filter((i) => i.status === "open" || i.status === "in_progress").length,
      openRequests: userRequests.filter((r) => r.status === "open" || r.status === "in_progress").length,
    };
  });

  return res.json(team);
});

export default router;
