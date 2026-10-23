import "dotenv/config";
import cors from "cors";
import express from "express";
import { db } from "./database.js";

const app = express();
app.use(cors({ origin: process.env.FRONTEND_ORIGIN?.split(",") || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", async (_request, response) => {
  await db.query("select 1");
  response.json({ ok: true, database: "supabase-postgres" });
});

app.get("/api/notices", async (_request, response) => {
  const { rows } = await db.query(`select id, title, description, notice_date as date, pdf_url as "pdfUrl", is_latest as "isLatest" from notices where published=true order by is_latest desc, notice_date desc, created_at desc`);
  response.json({ success: true, notices: rows });
});

app.get("/api/events", async (request, response) => {
  const raw = Number(request.query.limit || 0); const limit = Number.isInteger(raw) && raw > 0 ? Math.min(raw, 50) : null;
  const { rows } = await db.query(`select id,title,description,event_date::text as "eventDate",venue,image_url as "imageUrl",status from school_events where published=true order by event_date desc, created_at desc${limit ? " limit $1" : ""}`, limit ? [limit] : []);
  response.json({ success: true, events: rows });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error); response.status(500).json({ success: false, error: "Internal server error." });
});
app.listen(Number(process.env.PORT || 4000), () => console.log(`Backend listening on ${process.env.PORT || 4000}`));
