import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// SSL接続を有効にするためURLにsslmode=requireを追加
const dbUrl = connectionString.includes('sslmode=') 
  ? connectionString 
  : `${connectionString}${connectionString.includes('?') ? '&' : '?'}sslmode=require`;

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: dbUrl,
  },
});
