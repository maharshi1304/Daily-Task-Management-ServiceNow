import { pgTable, serial, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const statusEnum = pgEnum("status", ["open", "in_progress", "resolved", "closed"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "critical"]);

export const incidentsTable = pgTable("incidents", {
  id: serial("id").primaryKey(),
  incidentNumber: text("incident_number"),          // INC0001234
  title: text("title").notNull(),
  description: text("description"),
  status: statusEnum("status").notNull().default("open"),
  priority: priorityEnum("priority").notNull().default("medium"),
  assignedTo: text("assigned_to"),
  category: text("category"),
  configurationItem: text("configuration_item"),    // ServiceNow CI
  shortDescription: text("short_description"),
  tags: text("tags"),
  incidentDate: text("incident_date"),
  createdBy: integer("created_by"),                 // FK → users.id
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIncidentSchema = createInsertSchema(incidentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidentsTable.$inferSelect;
