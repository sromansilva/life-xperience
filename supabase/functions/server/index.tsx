import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
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

// ─── Bootstrap: create profiles table if not exists ───────────────────────────
// Run once via: GET /make-server-a3ae946d/setup
app.get("/make-server-a3ae946d/setup", async (c) => {
  const sql = `
    create table if not exists public.profiles (
      id          uuid primary key references auth.users(id) on delete cascade,
      email       text not null,
      role        text not null default 'student' check (role in ('student','teacher')),
      name        text not null default '',
      last        text not null default '',
      grade       text not null default '',
      hair_color  text not null default '#2C1810',
      hair_style  text not null default 'A',
      skin_tone   text not null default '#FDBCB4',
      shirt_color text not null default '#6D28D9',
      pet         text not null default '🐶',
      level       integer not null default 1,
      xp          integer not null default 0,
      coins       integer not null default 50,
      streak      integer not null default 0,
      subject     text,
      group_name  text,
      created_at  timestamptz default now()
    );

    -- Enable Row Level Security
    alter table public.profiles enable row level security;

    -- Each user can read/write only their own profile
    create policy if not exists "own profile" on public.profiles
      for all using (auth.uid() = id) with check (auth.uid() = id);

    -- Auto-create profile on signup via trigger
    create or replace function public.handle_new_user()
    returns trigger language plpgsql security definer as $$
    begin
      insert into public.profiles (id, email, role)
      values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'role', 'student')
      )
      on conflict (id) do nothing;
      return new;
    end;
    $$;

    create or replace trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  `;

  const res = await kv.query(sql).catch((e: Error) => ({ error: e.message }));
  return c.json({ ok: true, result: res });
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