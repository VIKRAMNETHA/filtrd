import { tick } from "@/lib/automation";

// For deployments without a long-running server, where an external scheduler drives automation.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return Response.json(await tick());
}
