import { Hono } from "hono";
import type { Env } from "../env.js";

export const departments = new Hono<{ Bindings: Env }>();

departments.get("/", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM departments ORDER BY name").all();
  return c.json({ data: results });
});

departments.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const department = await c.env.DB.prepare("SELECT * FROM departments WHERE id = ?")
    .bind(id)
    .first();
  if (!department) return c.json({ error: "Not found" }, 404);
  return c.json(department);
});
