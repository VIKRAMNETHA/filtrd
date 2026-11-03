export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_WORKER === "1") return;
  const { tick } = await import("./lib/automation");
  const run = () => tick().catch((error) => console.error("Automation tick failed:", error));
  setTimeout(run, 5_000);
  setInterval(run, 60_000);
}
