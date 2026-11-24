import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-a3ae946d/health", (c) => {
  return c.json({ status: "ok" });
});

// ─── Seed demo users ──────────────────────────────────────────────────────────
// Run once via: GET /make-server-a3ae946d/seed
app.get("/make-server-a3ae946d/seed", async (c) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const demos = [
    {
      email: "estudiante@lifexperience.com",
      password: "Demo1234!",
      profile: {
        role: "student", name: "Alex", last: "Demo", grade: "3°A",
        hair_color: "#2C1810", hair_style: "A", skin_tone: "#FDBCB4",
        shirt_color: "#6D28D9", pet: "🐶", level: 1, xp: 0, coins: 50, streak: 0,
      }
    },
    {
      email: "docente@lifexperience.com",
      password: "Profe1234!",
      profile: {
        role: "teacher", name: "Prof. García", last: "Demo", grade: "",
        hair_color: "#4A3728", hair_style: "B", skin_tone: "#C68642",
        shirt_color: "#0EA5E9", pet: "🦉", level: 1, xp: 0, coins: 100, streak: 0,
        subject: "Habilidades para la Vida", group_name: "3°A",
      }
    },
  ];

  const results = [];
  for (const demo of demos) {
    const { data: authData, error: authErr } = await admin.auth.admin.createUser({
      email: demo.email,
      password: demo.password,
      email_confirm: true,
    });
    if (authErr && !authErr.message.includes("already been registered")) {
      results.push({ email: demo.email, error: authErr.message });
      continue;
    }
    const userId = authData?.user?.id;
    if (userId) {
      await admin.from("profiles").upsert({
        id: userId,
        email: demo.email,
        ...demo.profile,
      }, { onConflict: "id" });
    }
    results.push({ email: demo.email, ok: true, id: userId });
  }

  return c.json({ seeded: results });
});

Deno.serve(app.fetch);
