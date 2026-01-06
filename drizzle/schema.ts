import { pgTable, serial, varchar, timestamp, integer, pgEnum, real, text } from "drizzle-orm/pg-core";

/**
 * 混雑状況のステータス定義
 * - available: 空いている（青）
 * - normal: 通常（緑）
 * - crowded: 混雑（赤）
 */
export const statusEnum = pgEnum("status_enum", ["available", "normal", "crowded"]);

/**
 * spots テーブル - 各スポット（宝石探し、化石発掘など）の状態管理
 * マップ上の座標（パーセント）と混雑状況を管理
 */
export const spots = pgTable("spots", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"), // スポットの説明
  status: varchar("status", { length: 20 }).default("available").notNull(),
  waitTime: integer("wait_time").default(0), // 待ち時間（分）
  positionX: real("position_x").notNull().default(50), // マップ上のX座標（%）
  positionY: real("position_y").notNull().default(50), // マップ上のY座標（%）
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Spot = typeof spots.$inferSelect;
export type InsertSpot = typeof spots.$inferInsert;

/**
 * congestion_logs テーブル - 混雑状況の履歴（分析用）
 */
export const congestionLogs = pgTable("congestion_logs", {
  id: serial("id").primaryKey(),
  spotId: integer("spot_id").references(() => spots.id),
  status: varchar("status", { length: 20 }).notNull(),
  waitTime: integer("wait_time").default(0),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CongestionLog = typeof congestionLogs.$inferSelect;
export type InsertCongestionLog = typeof congestionLogs.$inferInsert;

/**
 * users テーブル - ユーザー管理（管理者用）
 * Manus OAuth認証に対応
 */
export const roleEnum = pgEnum("role_enum", ["user", "admin"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
