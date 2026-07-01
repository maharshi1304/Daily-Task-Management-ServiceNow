import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const workNotesTable = pgTable("work_notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  relatedType: text("related_type"),      // "incident" | "service_request" | "general"
  relatedId: integer("related_id"),
  relatedNumber: text("related_number"),  // e.g. INC0001234 for display
  hoursSpent: text("hours_spent"),        // free-text like "2.5"
  noteDate: text("note_date"),
  createdBy: integer("created_by"),       // FK → users.id
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWorkNoteSchema = createInsertSchema(workNotesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertWorkNote = z.infer<typeof insertWorkNoteSchema>;
export type WorkNote = typeof workNotesTable.$inferSelect;
