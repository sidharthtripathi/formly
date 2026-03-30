// Webhook schema extension
import { pgTable, uuid, text, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull(),
  url: text("url").notNull(),
  events: text("events").array().notNull(), // webhook_event_types[]
  secret: text("secret"),
  formId: uuid("form_id"), // NULL = all forms
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Form themes/branding extension
export const formThemes = pgTable("form_themes", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").notNull(),
  name: text("name").notNull(),
  colors: jsonb("colors").$type<{
    primary?: string;
    background?: string;
    text?: string;
    border?: string;
  }>(),
  logoUrl: text("logo_url"),
  fontFamily: text("font_family"),
  customCss: text("custom_css"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Form collaborators
export const collaborators = pgTable(
  "collaborators",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    formId: uuid("form_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: text("role").notNull().default("editor"), // viewer, editor, admin
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    uniqueCollaborator: { columns: [table.formId, table.userId] },
  })
);

// Email notifications
export const emailNotifications = pgTable("email_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  formId: uuid("form_id").notNull(),
  type: text("type").notNull(), // new_response, daily_digest, weekly_digest
  recipientEmail: text("recipient_email").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
