import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resolutionsTable = pgTable("resolutions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rootCause: text("root_cause"),
  actionsTaken: text("actions_taken"),
  resolutionCode: text("resolution_code"),    // e.g. "Solved (Permanently)"
  relatedType: text("related_type"),
  relatedId: integer("related_id"),
  relatedNumber: text("related_number"),      // e.g. INC0001234
  resolvedAt: timestamp("resolved_at"),
  resolutionDate: text("resolution_date"),
  createdBy: integer("created_by"),           // FK → users.id
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertResolutionSchema = createInsertSchema(resolutionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertResolution = z.infer<typeof insertResolutionSchema>;
export type Resolution = typeof resolutionsTable.$inferSelect;
