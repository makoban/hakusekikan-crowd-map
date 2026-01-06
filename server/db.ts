import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { InsertUser, users, spots, congestionLogs, Spot, CongestionLog } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _pool: Pool | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false, // Render PostgreSQLではSSL必須
        },
      });
      _db = drizzle(_pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    // PostgreSQLではonConflictDoUpdateを使用
    const values: InsertUser = {
      openId: user.openId,
      name: user.name ?? null,
      email: user.email ?? null,
      loginMethod: user.loginMethod ?? null,
      role: user.role ?? (user.openId === ENV.ownerOpenId ? 'admin' : 'user'),
      lastSignedIn: user.lastSignedIn ?? new Date(),
    };

    await db.insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: {
          name: values.name,
          email: values.email,
          loginMethod: values.loginMethod,
          lastSignedIn: new Date(),
          updatedAt: new Date(),
        },
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== Spots (混雑スポット) 関連のクエリ ==========

/**
 * 全スポットの一覧を取得
 */
export async function getAllSpots(): Promise<Spot[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get spots: database not available");
    return [];
  }

  return await db.select().from(spots);
}

/**
 * スポットのステータスを更新
 */
export async function updateSpotStatus(
  spotId: number,
  status: "available" | "slightly_crowded" | "crowded"
): Promise<Spot | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update spot: database not available");
    return null;
  }

  const result = await db
    .update(spots)
    .set({ status, updatedAt: new Date() })
    .where(eq(spots.id, spotId))
    .returning();

  // 混雑ログを記録
  if (result.length > 0) {
    await db.insert(congestionLogs).values({
      spotId,
      status,
    });
  }

  return result.length > 0 ? result[0] : null;
}

/**
 * 特定スポットの混雑履歴を取得
 */
export async function getSpotCongestionLogs(spotId: number, limit = 100): Promise<CongestionLog[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get congestion logs: database not available");
    return [];
  }

  return await db
    .select()
    .from(congestionLogs)
    .where(eq(congestionLogs.spotId, spotId))
    .orderBy(congestionLogs.recordedAt)
    .limit(limit);
}
