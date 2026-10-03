import { pgTable, serial, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("admin").notNull(),
  jobTitle: varchar("job_title", { length: 255 }).default("Team Member"),
  phone: varchar("phone", { length: 50 }),
  bio: text("bio"),
  avatarColor: varchar("avatar_color", { length: 50 }).default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id"),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).default("member").notNull(),
  department: varchar("department", { length: 100 }).default("Engineering"),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  phone: varchar("phone", { length: 50 }),
  avatarColor: varchar("avatar_color", { length: 50 }).default("#10b981"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("planning").notNull(), // 'planning', 'in_progress', 'completed', 'on_hold'
  priority: varchar("priority", { length: 50 }).default("medium").notNull(), // 'low', 'medium', 'high', 'urgent'
  category: varchar("category", { length: 100 }).default("General"),
  progress: integer("progress").default(0).notNull(), // 0 to 100
  budget: varchar("budget", { length: 100 }),
  startDate: varchar("start_date", { length: 50 }),
  dueDate: varchar("due_date", { length: 50 }),
  ownerId: integer("owner_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("todo").notNull(), // 'todo', 'in_progress', 'in_review', 'completed'
  priority: varchar("priority", { length: 50 }).default("medium").notNull(), // 'low', 'medium', 'high', 'urgent'
  assignedTo: varchar("assigned_to", { length: 255 }),
  assignedEmail: varchar("assigned_email", { length: 255 }),
  dueDate: varchar("due_date", { length: 50 }),
  tags: varchar("tags", { length: 255 }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id"),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).default("general").notNull(), // 'general', 'meeting', 'milestone', 'alert'
  pinned: boolean("pinned").default(false).notNull(),
  authorName: varchar("author_name", { length: 255 }).notNull(),
  authorId: integer("author_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id"),
  action: varchar("action", { length: 50 }).notNull(), // 'created', 'updated', 'deleted', 'status_changed'
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // 'project', 'task', 'member', 'announcement', 'auth'
  resourceTitle: varchar("resource_title", { length: 255 }),
  userName: varchar("user_name", { length: 255 }).notNull(),
  userId: integer("user_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
