/*
 * One-time, idempotent MongoDB -> Supabase migration.
 * Apply backend/supabase/migrations/001_school_data.sql first. It keeps Mongo ObjectIds
 * as text primary keys so application links and imported files remain stable.
 */
import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import pg from "pg";

dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) });

const { MONGODB_URI, DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!MONGODB_URI || !DATABASE_URL || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Set MONGODB_URI, DATABASE_URL, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
const iso = (value) => { const date = new Date(value ?? Date.now()); return Number.isNaN(+date) ? new Date().toISOString() : date.toISOString(); };
const id = (value) => value == null ? "" : String(value);
const json = (value, fallback = []) => JSON.stringify(value ?? fallback);
async function upsert(table, columns, values, conflict = "id") {
  const names = columns.join(", ");
  const marks = columns.map((_, index) => `$${index + 1}`).join(", ");
  const updates = columns.filter((column) => column !== conflict && column !== "created_at").map((column) => `${column} = excluded.${column}`).join(", ");
  await client.query(`insert into ${table} (${names}) values (${marks}) on conflict (${conflict}) do update set ${updates}`, values);
}
async function upload(bucket, path, buffer, contentType) {
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${encodeURIComponent(path).replaceAll("%2F", "/")}`, {
    method: "POST", headers: { authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, apikey: SUPABASE_SERVICE_ROLE_KEY, "content-type": contentType, "x-upsert": "true" }, body: buffer,
  });
  if (!response.ok) throw new Error(`Storage upload failed for ${bucket}/${path}: ${await response.text()}`);
}
async function gridFile(bucketName, fileId) {
  if (!fileId) return null;
  const database = mongoose.connection.db;
  const file = await database.collection(`${bucketName}.files`).findOne({ _id: new mongoose.Types.ObjectId(String(fileId)) });
  if (!file) return null;
  const chunks = await database.collection(`${bucketName}.chunks`).find({ files_id: file._id }).sort({ n: 1 }).toArray();
  return { buffer: Buffer.concat(chunks.map((chunk) => chunk.data.buffer)), contentType: file.contentType || "application/octet-stream", filename: file.filename || String(file._id) };
}

await mongoose.connect(MONGODB_URI);
await client.connect();
try {
  const database = mongoose.connection.db;
  const rows = async (name) => database.collection(name).find({}).toArray();
  for (const row of await rows("admins")) await upsert("admins", ["id","name","email","password_hash","role","is_active","created_at","updated_at"], [id(row._id), row.name, row.email, row.passwordHash, row.role || "admin", row.isActive !== false, iso(row.createdAt), iso(row.updatedAt)]);
  for (const row of await rows("notices")) await upsert("notices", ["id","title","description","notice_date","pdf_url","published","is_latest","created_at","updated_at"], [id(row._id), row.title, row.description, row.date, row.pdfUrl || "", !!row.published, !!row.isLatest, iso(row.createdAt), iso(row.updatedAt)]);
  for (const row of await rows("school_books")) await upsert("school_books", ["id","title","author","subject","class_name","publisher","academic_year","price","published","created_at","updated_at"], [id(row._id),row.title,row.author || "",row.subject || "",row.className || "",row.publisher || "",row.academicYear || "",row.price ?? null,!!row.published,iso(row.createdAt),iso(row.updatedAt)]);
  for (const row of await rows("school_events")) await upsert("school_events", ["id","title","description","event_date","venue","image_url","status","published","created_at","updated_at"], [id(row._id),row.title,row.description,iso(row.eventDate).slice(0,10),row.venue,row.imageUrl || "",row.status || "Upcoming",!!row.published,iso(row.createdAt),iso(row.updatedAt)]);
  for (const row of await rows("school_exam_results")) await upsert("school_exam_results", ["id","academic_year","class_name","examination_key","examination_name","roll_number","student_name","subjects","total_marks","maximum_marks","percentage","automatic_grade","manual_grade","final_grade","result_status","published","published_at","created_at","updated_at","created_by"], [id(row._id),row.academicYear,row.className,row.examinationKey,row.examinationName,row.rollNumber,row.studentName,json(row.subjects),row.totalMarks,row.maximumMarks,row.percentage,row.automaticGrade || "",row.manualGrade || "",row.finalGrade || "",row.resultStatus,!!row.published,row.publishedAt ? iso(row.publishedAt) : null,iso(row.createdAt),iso(row.updatedAt),row.createdBy || ""]);
  for (const row of await rows("exam_import_drafts")) await upsert("exam_import_drafts", ["id","admin_id","academic_year","class_name","examination_key","examination_name","students","existing_roll_numbers","removed_roll_numbers","expires_at","created_at","updated_at"], [id(row._id),id(row.adminId),row.academicYear,row.className,row.examinationKey,row.examinationName,json(row.students),json(row.existingRollNumbers),json(row.removedRollNumbers),iso(row.expiresAt),iso(row.createdAt),iso(row.updatedAt)]);
  for (const row of await rows("gallery")) {
    const oldFile = await gridFile("galleryImages", row.gridFsId || row.imageId);
    const path = oldFile ? `${id(row.gridFsId || row.imageId)}/${oldFile.filename}` : null;
    if (oldFile) await upload("gallery-images", path, oldFile.buffer, oldFile.contentType);
    await upsert("gallery", ["id","year","category","title","caption","image_url","original_url","source_type","storage_path","created_at"], [id(row._id),Number(row.year),row.category || "",row.title || "",row.caption || "",path ? `${SUPABASE_URL}/storage/v1/object/public/gallery-images/${path}` : (row.imageUrl || ""),row.originalUrl || null,row.sourceType || (path ? "upload" : "url"),path,iso(row.createdAt)]);
  }
  for (const row of await rows("school_staff")) {
    const oldFile = await gridFile("schoolStaffPhotos", row.photoId); const path = oldFile ? `${id(row.photoId)}/${oldFile.filename}` : null;
    if (oldFile) await upload("staff-photos", path, oldFile.buffer, oldFile.contentType);
    await upsert("school_staff", ["id","name","designation","subject","category","photo_path","published","sort_order","created_at","updated_at"], [id(row._id),row.name,row.designation,row.subject || "",row.category,path,!!row.published,Number(row.sortOrder || 0),iso(row.createdAt),iso(row.updatedAt)]);
  }
  for (const row of await rows("mandatory_disclosures")) {
    const oldFile = await gridFile("mandatoryDisclosureFiles", row.fileId); const path = oldFile ? `${id(row.fileId)}/${oldFile.filename}` : id(row.fileId);
    if (oldFile) await upload("mandatory-disclosure-files", path, oldFile.buffer, oldFile.contentType);
    await upsert("mandatory_disclosures", ["id","title","category","description","academic_year","file_path","file_name","content_type","file_size","published","created_at","updated_at"], [id(row._id),row.title,row.category,row.description || "",row.academicYear || "",path,row.fileName || oldFile?.filename || "document.pdf",row.contentType || oldFile?.contentType || "application/pdf",Number(row.fileSize || oldFile?.buffer.length || 0),!!row.published,iso(row.createdAt),iso(row.updatedAt)]);
  }
  for (const row of await rows("mandatory_disclosure_content")) await upsert("mandatory_disclosure_content", ["key","payload","created_at","updated_at"], [row.key || "main", json(Object.fromEntries(Object.entries(row).filter(([key]) => !["_id","key","createdAt","updatedAt"].includes(key)), {}), {}),iso(row.createdAt),iso(row.updatedAt)], "key");
  console.log("MongoDB data and GridFS files migrated to Supabase successfully.");
} finally { await client.end(); await mongoose.disconnect(); }
