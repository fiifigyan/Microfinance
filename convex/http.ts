import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

async function verifyPaystackSignature(
  body: string,
  signature: string,
  secretKey: string,
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secretKey),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expected = Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return expected === signature;
}

const http = httpRouter();

http.route({
  path: "/webhooks/paystack",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature") ?? "";
    const secretKey = process.env.PAYSTACK_SECRET_KEY ?? "";

    if (!secretKey) {
      return new Response("Unauthorized", { status: 401 });
    }

    const valid = await verifyPaystackSignature(body, signature, secretKey);
    if (!valid) {
      return new Response("Unauthorized", { status: 401 });
    }

    let event: { event: string; data: any };
    try {
      event = JSON.parse(body);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const { event: eventType, data } = event;

    try {
      switch (eventType) {
        case "charge.success":
          if (String(data.reference).startsWith("REP-")) {
            await ctx.runMutation(
              internal.mutations.loans.completeRepaymentByReference,
              {
                reference: data.reference,
                externalReference: String(data.id ?? data.reference),
              },
            );
          } else {
            await ctx.runMutation(
              internal.mutations.transactions.completeDepositByReference,
              {
                reference: data.reference,
                externalReference: String(data.id ?? data.reference),
              },
            );
          }
          break;

        case "transfer.success":
          await ctx.runMutation(
            internal.mutations.transactions.completeWithdrawalByReference,
            {
              reference: data.reference,
              externalReference: data.transfer_code ?? data.reference,
            },
          );
          break;

        case "transfer.failed":
        case "transfer.reversed":
          await ctx.runMutation(
            internal.mutations.transactions.failWithdrawalByReference,
            {
              reference: data.reference,
              reason: data.reason ?? eventType,
            },
          );
          break;

        default:
          break;
      }
    } catch (err) {
      console.error("[paystack-webhook] Error handling event:", eventType, err);
      // Return 200 so Paystack doesn't keep retrying
    }

    return new Response("ok", { status: 200 });
  }),
});

export default http;
