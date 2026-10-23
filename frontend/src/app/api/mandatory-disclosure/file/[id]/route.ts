import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database";
import { downloadStorageFile } from "@/lib/storage";
import type { DisclosureContent } from "@/lib/mandatory-disclosure";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function safeDownloadName(value: string | undefined) {
  const name = value?.split(/[\\/]/).pop()?.replace(/[^\w.-]+/g, "_");
  return (name || "document").replace(/^\.+/, "").slice(0, 180) || "document";
}

function isPublishedDocument(content: DisclosureContent, fileId: string) {
  const disclosureDocuments =
    content.documentsAndCertifications?.groups?.flatMap(
      (group) => group.documents ?? [],
    ) ?? [];
  const academicDocuments = content.resultsAndAcademics?.records ?? [];

  return [...disclosureDocuments, ...academicDocuments].some(
    (document) => document.fileId === fileId && document.published,
  );
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const isStorageFileId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?:\.[a-z0-9]{1,10})?$/i.test(
        id,
      );
    const isMigratedDisclosureId = /^[a-f\d]{24}$/i.test(id);
    if (!isStorageFileId && !isMigratedDisclosureId) {
      return NextResponse.json(
        { message: "Invalid file ID." },
        { status: 400 },
      );
    }

    const disclosureResult = isMigratedDisclosureId
      ? await query<{
          filePath: string;
          fileName: string;
          contentType: string;
        }>(
          `select file_path as "filePath", file_name as "fileName",
                  content_type as "contentType"
           from mandatory_disclosures
           where id = $1 and published = true`,
          [id],
        )
      : { rows: [] };
    const migratedDisclosure = disclosureResult.rows[0];

    const { rows } = await query<{ payload: DisclosureContent | null }>(
      "select payload from mandatory_disclosure_content where key = $1",
      ["main"],
    );
    const content = rows[0]?.payload;

    if (!migratedDisclosure && (!content || !isPublishedDocument(content, id))) {
      return NextResponse.json(
        { message: "Published document not found." },
        { status: 404 },
      );
    }

    const storagePath = migratedDisclosure?.filePath ?? id;
    if (
      storagePath.split(/[\\/]/).some((segment) => !segment || segment === "." || segment === "..")
    ) {
      throw new Error("Disclosure file has an invalid storage path.");
    }

    const file = await downloadStorageFile(
      "mandatory-disclosure-files",
      storagePath,
    );
    if (!file) {
      return NextResponse.json(
        { message: "Document not found." },
        { status: 404 },
      );
    }

    const matchingDocument = content
      ? [
          ...(content.documentsAndCertifications?.groups?.flatMap(
            (group) => group.documents ?? [],
          ) ?? []),
          ...(content.resultsAndAcademics?.records ?? []),
        ].find((document) => document.fileId === id && document.published)
      : undefined;
    const fileName = safeDownloadName(
      migratedDisclosure?.fileName ?? matchingDocument?.fileName,
    );
    const contentType =
      migratedDisclosure?.contentType ||
      file.headers.get("content-type") ||
      "application/octet-stream";
    const canDisplayInline =
      contentType === "application/pdf" || contentType.startsWith("image/");
    const disposition = canDisplayInline ? "inline" : "attachment";
    const bytes = await file.arrayBuffer();

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `${disposition}; filename="${fileName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("Mandatory disclosure document retrieval failed:", error);
    return NextResponse.json(
      { message: "Unable to open this document." },
      { status: 500 },
    );
  }
}
