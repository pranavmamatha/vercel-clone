const { uuid, pgEnum, pgTable, text, timestamp } = require("drizzle-orm/pg-core")

export const deploymentStatus = pgEnum("deployment_status", ["NOT_STARTED", "QUEUED", "IN_PROGRESS", "READY", "FAIL"])

export const userTable = pgTable("user", {
  id: uuid("id").primaryKey().defaultRandom(),
  userName: text("user_name").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull()
})

export const projectsTable = pgTable("projects", {
  id: uuid('id').primaryKey().defaultRandom(),
  projectName: text("project_name").notNull(),
  projectOwner: uuid("project_owner").references(() => userTable.id),
  gitUrl: text("git_url").notNull(),
  subdomain: text("subdomain").notNull(),
  customDomain: text("custom_domain"),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull()
})

export const deploymentTable = pgTable("deployments", {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projectsTable.id),
  status: deploymentStatus('status').default("NOT_STARTED").notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().$onUpdate(() => new Date()).notNull()
})

