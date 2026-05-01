"use node";

import { v } from "convex/values";
import { internalAction } from "../_generated/server";

export const sendPushNotification = internalAction({
  args: {
    pushToken: v.string(),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (_ctx, args) => {
    if (!args.pushToken.startsWith("ExponentPushToken")) return;

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to: args.pushToken,
        sound: "default",
        title: args.title,
        body: args.body,
        data: args.data ?? {},
      }),
    });
  },
});
