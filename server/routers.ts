import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getAllSpots, updateSpotStatus, getSpotCongestionLogs } from "./db";
import { z } from "zod";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // 混雑情報API
  spots: router({
    /**
     * 全スポットの一覧を取得（公開API）
     * フロントエンドのマップ表示で使用
     */
    list: publicProcedure.query(async () => {
      return await getAllSpots();
    }),

    /**
     * スポットのステータスを更新（管理者のみ）
     * 混雑状況の更新に使用
     */
    updateStatus: protectedProcedure
      .input(
        z.object({
          spotId: z.number(),
          status: z.enum(["available", "slightly_crowded", "crowded"]),
        })
      )
      .mutation(async ({ input }) => {
        const updatedSpot = await updateSpotStatus(input.spotId, input.status);
        if (!updatedSpot) {
          throw new Error("Failed to update spot status");
        }
        return updatedSpot;
      }),

    /**
     * 特定スポットの混雑履歴を取得（公開API）
     * 分析・統計表示に使用
     */
    getCongestionLogs: publicProcedure
      .input(
        z.object({
          spotId: z.number(),
          limit: z.number().optional().default(100),
        })
      )
      .query(async ({ input }) => {
        return await getSpotCongestionLogs(input.spotId, input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
