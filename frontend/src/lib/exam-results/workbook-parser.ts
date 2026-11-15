import * as XLSX from "xlsx";
import { inflateRawSync } from "node:zlib";

export type WorkbookValue = string | number | boolean | null;

export type WorkbookSubject = {
  subject: string;
  maxMarks: WorkbookValue;
  marksObtained: WorkbookValue;
  grade: string;
  remarks: string;
};

export type WorkbookStudent = {
  worksheet: string;
  rowNumber: number;
  serialNumber: string;
  rollNumber: string;
  studentName: string;
  className: string;
  academicYear: string;
  examinationName: string;
  examinationDate: string | null;
  subjects: WorkbookSubject[];
  totalMarks: WorkbookValue;
  maximumMarks: WorkbookValue;
  percentage: WorkbookValue;
  grade: string;
  resultStatus: string;
  errors: string[];
};

export type WorkbookWorksheetPreview = {
  worksheet: string;
  className: string | null;
  studentCount: number;
  subjects: string[];
  examinationName: string;
  academicYear: string;
  examinationDate: string | null;
  detected: boolean;
  warnings: string[];
};

export type WorkbookParseResult = {
  worksheets: WorkbookWorksheetPreview[];
  students: WorkbookStudent[];
  warnings: string[];
  duplicates: Array<{
    worksheet: string;
    rowNumber: number;
    duplicateOfWorksheet: string;
    duplicateOfRow: number;
    className: string;
    rollNumber: string;
    studentName: string;
  }>;
  missingData: Array<{
    worksheet: string;
    rowNumber: number;
    field: string;
    cell: string | null;
  }>;
  errors: string[];
};

type ParseOptions = {
  academicYear?: string;
  className?: string;
  examinationName?: string;
};

type HeaderField = {
  kind: "serial" | "roll" | "name" | "total" | "maximum" | "percentage" | "grade" | "status" | "date" | "class" | "session" | "examination";
};

type SubjectColumn = {
  name: string;
  nameColumn?: number;
  maximumColumn: number;
  maximumRow?: number;
  obtainedColumn: number;
  gradeColumn?: number;
  remarksColumn?: number;
};

type SheetLayout = {
  headerRow: number;
  dataStartRow: number;
  headers: string[];
  fields: Partial<Record<HeaderField["kind"], number>>;
  subjects: SubjectColumn[];
  totalMaximumRow?: number;
  malformedReason?: string;
};

type CellValue = {
  value: WorkbookValue;
  formulaMissing: boolean;
  error?: string;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_SHEETS = 100;
const MAX_ROWS_PER_SHEET = 5001;
const MAX_COLUMNS_PER_SHEET = 256;
const MAX_TOTAL_CELLS = 1_000_000;
const MAX_TOTAL_STUDENTS = 5000;
const MAX_ZIP_ENTRIES = 2000;
const MAX_ZIP_UNCOMPRESSED_BYTES = 80 * 1024 * 1024;

const HEADER_ALIASES: Record<HeaderField["kind"], string[]> = {
  serial: ["serial number", "serial no", "serial", "s no", "s no.", "sl no", "sl no.", "sl number", "sr no", "sr no."],
  roll: ["roll number", "roll no", "roll no.", "roll", "admission number", "admission no"],
  name: ["student name", "name of student", "name of the student", "student", "name"],
  total: ["total marks", "total mark", "marks obtained total", "total obtained marks", "grand total", "total"],
  maximum: ["total maximum marks", "maximum total marks", "total max marks", "maximum marks", "max marks total", "grand total maximum"],
  percentage: ["percentage", "percent", "percentage marks", "overall percentage", "% of mark", "% of marks", "of mark", "of marks"],
  grade: ["final grade", "overall grade", "grade", "result grade"],
  status: ["result status", "status", "result"],
  date: ["examination date", "exam date", "date of examination", "date"],
  class: ["class", "class name", "standard", "std", "grade/class"],
  session: ["academic year", "academic session", "session", "school session"],
  examination: ["examination name", "exam name", "examination", "exam", "test name"],
};

const SUBJECT_MAX_LABELS = ["maximum marks", "max marks", "full marks", "maximum", "max"];
const SUBJECT_OBTAINED_LABELS = ["marks obtained", "obtained marks", "marks scored", "marks", "obtained", "score"];
const SUBJECT_GRADE_LABELS = ["grade", "subject grade"];
const SUBJECT_REMARK_LABELS = ["remarks", "remark", "comments"];

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[().:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasHeader(value: unknown, aliases: string[]): boolean {
  const normalized = normalize(value);
  return aliases.some((alias) => normalize(alias) === normalized);
}

function isBlank(value: WorkbookValue): boolean {
  return value === null || (typeof value === "string" && value.trim() === "");
}

export function isNoMarkValue(value: WorkbookValue): value is string {
  return typeof value === "string" && /^[-\u2010-\u2015\u2212]$/.test(value.trim());
}

function text(value: WorkbookValue): string {
  if (value === null) return "";
  return String(value).trim();
}

function cellValue(sheet: XLSX.WorkSheet, row: number, column: number): CellValue {
  const cell = sheet[XLSX.utils.encode_cell({ r: row, c: column })] as XLSX.CellObject | undefined;
  if (!cell) return { value: null, formulaMissing: false };

  if (cell.f && (cell.v === undefined || cell.v === null)) {
    return { value: null, formulaMissing: true };
  }

  if (cell.t === "e") {
    return {
      value: cell.v === undefined ? null : String(cell.v),
      formulaMissing: false,
      error: `Excel error value ${String(cell.w ?? cell.v ?? "")}`,
    };
  }

  if (cell.v instanceof Date) {
    return { value: cell.v.toISOString().slice(0, 10), formulaMissing: false };
  }

  if (
    typeof cell.v === "string" ||
    typeof cell.v === "number" ||
    typeof cell.v === "boolean"
  ) {
    return { value: cell.v, formulaMissing: false };
  }

  return { value: null, formulaMissing: false };
}

function parseNumeric(value: WorkbookValue): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const normalized = value.trim().replace(/,/g, "");
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function romanToNumber(value: string): number | null {
  const roman = value.toUpperCase();
  if (!/^(?=.)M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/.test(roman)) return null;
  const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0;
  for (let index = 0; index < roman.length; index += 1) {
    const current = values[roman[index]];
    const next = values[roman[index + 1]] ?? 0;
    total += current < next ? -current : current;
  }
  return total > 0 ? total : null;
}

function normalizeClass(value: string): string | null {
  let candidate = value.trim().replace(/[_]+/g, " ");
  candidate = candidate.replace(/^(?:std|standard|class|grade)\s*[-.:]?\s*/i, "").trim();
  if (!candidate) return null;
  const numeric = candidate.match(/^\d{1,3}$/);
  if (numeric) return String(Number(candidate));
  const roman = romanToNumber(candidate);
  if (roman !== null) return String(roman);
  if (/^(pre[\s-]*nursery|nursery|lkg|ukg)$/i.test(candidate)) {
    return candidate.replace(/\s+/g, "-");
  }
  return candidate.slice(0, 100);
}

function classFromSheetName(name: string): string | null {
  const match = name.match(/^(?:(?:std|standard|class|grade)\s*[-.:]?\s*)?([a-z0-9][a-z0-9 -]{0,40}?)(?:\s*\(\d+\))?$/i);
  if (!match) return null;
  const candidate = match[1].trim();
  if (!/^(?:\d{1,3}|[ivxlcdm]+|pre[\s-]*nursery|nursery|lkg|ukg)$/i.test(candidate)) {
    return null;
  }
  return normalizeClass(candidate);
}

function normalizeAcademicYear(value: string): string {
  const cleaned = value.trim().replace(/[–—]/g, "-");
  const fourDigit = cleaned.match(/^(\d{4})\s*[-/]\s*(\d{4})$/);
  if (fourDigit) return `${fourDigit[1]}-${fourDigit[2].slice(-2)}`;
  const short = cleaned.match(/^(\d{4})\s*[-/]\s*(\d{2})$/);
  return short ? `${short[1]}-${short[2]}` : cleaned;
}

function validateZip(buffer: Buffer): Map<string, Set<string>> {
  if (buffer.length < 22) throw new Error("The Excel workbook is incomplete.");
  let eocd = -1;
  const lowerBound = Math.max(0, buffer.length - 22 - 65535);
  for (let offset = buffer.length - 22; offset >= lowerBound; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error("The .xlsx file is not a valid ZIP-based Excel workbook.");
  const entries = buffer.readUInt16LE(eocd + 10);
  const directorySize = buffer.readUInt32LE(eocd + 12);
  const directoryOffset = buffer.readUInt32LE(eocd + 16);
  if (
    entries === 0xffff ||
    directorySize === 0xffffffff ||
    directoryOffset === 0xffffffff ||
    entries > MAX_ZIP_ENTRIES ||
    directoryOffset + directorySize > eocd
  ) {
    throw new Error("The Excel workbook uses unsupported or unsafe ZIP structures.");
  }

  let cursor = directoryOffset;
  let uncompressedBytes = 0;
  const xmlFiles = new Map<string, string>();
  for (let index = 0; index < entries; index += 1) {
    if (cursor + 46 > buffer.length || buffer.readUInt32LE(cursor) !== 0x02014b50) {
      throw new Error("The Excel workbook contains an invalid ZIP directory.");
    }
    const compressed = buffer.readUInt32LE(cursor + 20);
    const uncompressed = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const flags = buffer.readUInt16LE(cursor + 8);
    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    const fileName = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    if (
      compressed === 0xffffffff ||
      uncompressed === 0xffffffff ||
      (flags & 1) !== 0 ||
      (compressionMethod !== 0 && compressionMethod !== 8) ||
      cursor + 46 + nameLength + extraLength + commentLength > buffer.length
    ) {
      throw new Error("The Excel workbook contains an unsupported ZIP entry.");
    }
    uncompressedBytes += uncompressed;
    if (
      uncompressedBytes > MAX_ZIP_UNCOMPRESSED_BYTES ||
      (compressed === 0 && uncompressed > 1024 * 1024) ||
      (compressed > 0 && uncompressed / compressed > 200)
    ) {
      throw new Error("The Excel workbook expands beyond the safe processing limit.");
    }
    if (fileName.endsWith(".xml") || fileName.endsWith(".rels")) {
      if (
        localHeaderOffset + 30 > buffer.length ||
        buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50
      ) {
        throw new Error("The Excel workbook contains an invalid ZIP entry.");
      }
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      if (dataOffset + compressed > buffer.length) {
        throw new Error("The Excel workbook contains a truncated ZIP entry.");
      }
      const compressedData = buffer.subarray(dataOffset, dataOffset + compressed);
      const xml = compressionMethod === 0
        ? compressedData
        : inflateRawSync(compressedData, { maxOutputLength: MAX_ZIP_UNCOMPRESSED_BYTES });
      if (xml.length !== uncompressed) {
        throw new Error("The Excel workbook contains an invalid compressed XML entry.");
      }
      xmlFiles.set(fileName, xml.toString("utf8"));
    }
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  if (cursor !== directoryOffset + directorySize) {
    throw new Error("The Excel workbook contains an inconsistent ZIP directory.");
  }
  return findMissingFormulaResults(xmlFiles);
}

function xmlAttributes(source: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const attributePattern = /([^\s=]+)\s*=\s*["']([^"']*)["']/g;
  let match: RegExpExecArray | null;
  while ((match = attributePattern.exec(source)) !== null) {
    attributes.set(match[1], match[2]);
  }
  return attributes;
}

function decodeXmlText(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function findMissingFormulaResults(xmlFiles: Map<string, string>): Map<string, Set<string>> {
  const missing = new Map<string, Set<string>>();
  const workbookXml = xmlFiles.get("xl/workbook.xml");
  const relationshipsXml = xmlFiles.get("xl/_rels/workbook.xml.rels");
  if (!workbookXml || !relationshipsXml) {
    throw new Error("The .xlsx file is missing required workbook metadata.");
  }

  const relationships = new Map<string, string>();
  for (const match of relationshipsXml.matchAll(/<Relationship\b([^>]*)\/?>/g)) {
    const attributes = xmlAttributes(match[1]);
    const id = attributes.get("Id");
    const target = attributes.get("Target");
    if (id && target) relationships.set(id, target.replace(/^\/+/, ""));
  }

  const worksheetTargets: Array<{ name: string; path: string }> = [];
  for (const match of workbookXml.matchAll(/<sheet\b([^>]*)\/?>/g)) {
    const attributes = xmlAttributes(match[1]);
    const name = attributes.get("name");
    const relationshipId = attributes.get("r:id");
    const target = relationshipId ? relationships.get(relationshipId) : undefined;
    if (!name || !target || target.includes("..")) {
      throw new Error("The .xlsx file contains an invalid worksheet relationship.");
    }
    worksheetTargets.push({
      name: decodeXmlText(name),
      path: target.startsWith("xl/") ? target : `xl/${target}`,
    });
  }

  for (const { name, path } of worksheetTargets) {
    const xml = xmlFiles.get(path);
    if (!xml) throw new Error("The .xlsx file is missing a worksheet document.");
    const cells = new Set<string>();
    for (const match of xml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = xmlAttributes(match[1]);
      const address = attributes.get("r");
      const body = match[2];
      if (!address || !/<f(?:\s[^>]*)?(?:\/>|>[\s\S]*?<\/f>)/.test(body)) continue;
      const cachedValue = body.match(/<v(?:\s[^>]*)?>([\s\S]*?)<\/v>/);
      if (!cachedValue || cachedValue[1].trim() === "") cells.add(address);
    }
    if (cells.size) missing.set(name, cells);
  }
  return missing;
}

function validateFile(buffer: Buffer, fileName: string): Map<string, Set<string>> {
  if (buffer.length === 0 || buffer.length > MAX_FILE_BYTES) {
    throw new Error("The file must be between 1 byte and 10 MB.");
  }
  const extension = fileName.toLowerCase().split(".").pop();
  if (!extension || !["xlsx", "xls", "csv"].includes(extension)) {
    throw new Error("Only .xlsx, .xls, and .csv files are supported.");
  }
  if (extension === "xlsx") {
    if (buffer.length < 4) throw new Error("The .xlsx file is incomplete.");
    if (buffer.readUInt32LE(0) !== 0x04034b50) {
      throw new Error("The file contents do not match an .xlsx workbook.");
    }
    return validateZip(buffer);
  } else if (extension === "xls") {
    if (
      buffer.length < 8 ||
      !buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))
    ) {
      throw new Error("The file contents do not match a legacy .xls workbook.");
    }
  } else if (buffer.includes(Buffer.from([0x00]))) {
    throw new Error("The uploaded CSV file contains binary data.");
  }
  return new Map();
}

function mergedHeaderValue(
  sheet: XLSX.WorkSheet,
  row: number,
  column: number,
  headerRow: number,
): WorkbookValue {
  const direct = cellValue(sheet, row, column).value;
  if (!isBlank(direct)) return direct;
  if (row !== headerRow || !Array.isArray(sheet["!merges"])) return null;
  for (const merge of sheet["!merges"]) {
    if (
      row >= merge.s.r &&
      row <= merge.e.r &&
      column >= merge.s.c &&
      column <= merge.e.c
    ) {
      return cellValue(sheet, merge.s.r, merge.s.c).value;
    }
  }
  return null;
}

function headerKind(value: string): HeaderField["kind"] | null {
  const normalized = normalize(value);
  if (/^(?:total|grand total)(?:\s+mark(?:s)?(?:\s+best\s+six)?)?$/.test(normalized)) {
    return "total";
  }
  if (/^of\s+marks?$/.test(normalized)) return "percentage";
  for (const [kind, aliases] of Object.entries(HEADER_ALIASES) as Array<[HeaderField["kind"], string[]]>) {
    if (hasHeader(value, aliases)) return kind;
  }
  return null;
}

function subjectMeasure(value: string): "maximum" | "obtained" | "grade" | "remarks" | null {
  const normalized = normalize(value);
  if (SUBJECT_MAX_LABELS.some((label) => normalized === normalize(label))) return "maximum";
  if (SUBJECT_OBTAINED_LABELS.some((label) => normalized === normalize(label))) return "obtained";
  if (SUBJECT_GRADE_LABELS.some((label) => normalized === normalize(label))) return "grade";
  if (SUBJECT_REMARK_LABELS.some((label) => normalized === normalize(label))) return "remarks";
  return null;
}

function parseSubjectHeader(value: string): { name: string; measure: "maximum" | "obtained" | "grade" | "remarks" } | null {
  const raw = value.trim();
  const normalized = normalize(value);
  const numbered = normalized.match(/^subject\s+(\d+)\s+(name|maximum marks|max marks|full marks|marks obtained|obtained marks|marks scored|marks|grade|remarks|remark)$/);
  if (numbered) {
    const measure = subjectMeasure(numbered[2]);
    return measure ? { name: `subject ${numbered[1]}`, measure } : null;
  }
  const patterns: Array<[RegExp, "maximum" | "obtained" | "grade" | "remarks"]> = [
    [/^(.*?)\s+(?:maximum marks|max marks|full marks|maximum|max)$/, "maximum"],
    [/^(.*?)\s+(?:marks obtained|obtained marks|marks scored|obtained|score)$/, "obtained"],
    [/^(.*?)\s+(?:subject )?grade$/, "grade"],
    [/^(.*?)\s+(?:remarks|remark|comments)$/, "remarks"],
    [/^(?:maximum marks|max marks|full marks)\s+(?:for\s+)?(.+)$/, "maximum"],
    [/^(?:marks obtained|obtained marks|marks scored)\s+(?:for\s+)?(.+)$/, "obtained"],
  ];
  for (const [pattern, measure] of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1] && !["total", "grand total", "overall"].includes(match[1])) {
      const rawSuffixes: Array<[RegExp, "maximum" | "obtained" | "grade" | "remarks"]> = [
        [/^(.*?)\s+(?:maximum marks|max marks|full marks|maximum|max)$/i, "maximum"],
        [/^(.*?)\s+(?:marks obtained|obtained marks|marks scored|obtained|score)$/i, "obtained"],
        [/^(.*?)\s+(?:subject )?grade$/i, "grade"],
        [/^(.*?)\s+(?:remarks|remark|comments)$/i, "remarks"],
        [/^(?:maximum marks|max marks|full marks)\s+(?:for\s+)?(.+)$/i, "maximum"],
        [/^(?:marks obtained|obtained marks|marks scored)\s+(?:for\s+)?(.+)$/i, "obtained"],
      ];
      const originalLabel = rawSuffixes
        .filter(([, rawMeasure]) => rawMeasure === measure)
        .map(([rawPattern]) => rawPattern.exec(raw)?.[1]?.trim())
        .find(Boolean);
      return { name: originalLabel || match[1].trim(), measure };
    }
  }
  return null;
}

function buildLayout(sheet: XLSX.WorkSheet): SheetLayout | null {
  const ref = sheet["!ref"];
  if (!ref) return null;
  const range = XLSX.utils.decode_range(ref);
  const rowCount = range.e.r - range.s.r + 1;
  const columnCount = range.e.c - range.s.c + 1;
  if (rowCount > MAX_ROWS_PER_SHEET || columnCount > MAX_COLUMNS_PER_SHEET) {
    return {
      headerRow: 0,
      dataStartRow: 0,
      headers: [],
      fields: {},
      subjects: [],
      malformedReason: `Worksheet exceeds the ${MAX_ROWS_PER_SHEET} row or ${MAX_COLUMNS_PER_SHEET} column limit.`,
    };
  }

  const firstSearchRow = range.s.r;
  const lastSearchRow = Math.min(range.e.r, firstSearchRow + 24);
  for (let row = firstSearchRow; row <= lastSearchRow; row += 1) {
    const headers = Array.from({ length: columnCount }, (_, index) =>
      text(mergedHeaderValue(sheet, row, range.s.c + index, row)),
    );
    const kinds = headers.map(headerKind);
    const nameColumn = kinds.indexOf("name");
    const identityColumn = kinds.findIndex((kind) => kind === "roll" || kind === "serial");
    if (nameColumn < 0 || identityColumn < 0) continue;

    const fields: SheetLayout["fields"] = {};
    kinds.forEach((kind, index) => {
      if (kind && fields[kind] === undefined) fields[kind] = range.s.c + index;
    });

    const subjectGroups = new Map<string, Partial<SubjectColumn>>();
    for (let index = 0; index < headers.length; index += 1) {
      const absoluteColumn = range.s.c + index;
      const namedSubject = parseSubjectHeader(headers[index]);
      if (namedSubject) {
        const group = subjectGroups.get(namedSubject.name) ?? { name: namedSubject.name };
        if (namedSubject.measure === "maximum") group.maximumColumn = absoluteColumn;
        if (namedSubject.measure === "obtained") group.obtainedColumn = absoluteColumn;
        if (namedSubject.measure === "grade") group.gradeColumn = absoluteColumn;
        if (namedSubject.measure === "remarks") group.remarksColumn = absoluteColumn;
        subjectGroups.set(namedSubject.name, group);
      }
    }

    headers.forEach((header, index) => {
      const match = header.match(/^subject\s+(\d+)\s+name$/i);
      if (!match) return;
      const key = `subject ${match[1]}`;
      const group = subjectGroups.get(key) ?? { name: key };
      group.nameColumn = range.s.c + index;
      subjectGroups.set(key, group);
    });

    if (subjectGroups.size === 0 && row < range.e.r) {
      const subheaders = Array.from({ length: columnCount }, (_, index) =>
        text(cellValue(sheet, row + 1, range.s.c + index).value),
      );
      let currentSubject = "";
      for (let index = 0; index < headers.length; index += 1) {
        const candidate = headers[index].trim();
        if (candidate && !headerKind(candidate) && !subjectMeasure(candidate)) {
          currentSubject = candidate;
        }
        const measure = subjectMeasure(subheaders[index]);
        if (!currentSubject || !measure) continue;
        const group = subjectGroups.get(normalize(currentSubject)) ?? { name: currentSubject };
        if (measure === "maximum") group.maximumColumn = range.s.c + index;
        if (measure === "obtained") group.obtainedColumn = range.s.c + index;
        if (measure === "grade") group.gradeColumn = range.s.c + index;
        if (measure === "remarks") group.remarksColumn = range.s.c + index;
        subjectGroups.set(normalize(currentSubject), group);
      }
    }

    let subjects: SubjectColumn[] = [...subjectGroups.values()]
      .filter(
        (subject): subject is SubjectColumn =>
          typeof subject.name === "string" &&
          typeof subject.maximumColumn === "number" &&
          typeof subject.obtainedColumn === "number" &&
          (subject.nameColumn !== undefined || !/^subject \d+$/i.test(subject.name)),
      )
      .map((subject) => ({
        name: subject.name,
        nameColumn: subject.nameColumn,
        maximumColumn: subject.maximumColumn,
        obtainedColumn: subject.obtainedColumn,
        gradeColumn: subject.gradeColumn,
        remarksColumn: subject.remarksColumn,
      }));

    let dataStartRow = row + 1;
    let totalMaximumRow: number | undefined;
    if (
      subjects.length === 0 &&
      fields.total !== undefined &&
      row + 2 <= range.e.r &&
      headers.some((header) =>
        normalize(header) === "subject" || /^sub(?:ject)?\s+\d+$/i.test(normalize(header)),
      )
    ) {
      const maximumRow = row + 2;
      const maximumLabel = Array.from(
        { length: columnCount },
        (_, index) => normalize(cellValue(sheet, maximumRow, range.s.c + index).value),
      ).some((value) => /^(?:max|maximum)(?:\s+mark|\s+marks)?$/.test(value));
      if (maximumLabel) {
        const totalColumn = fields.total;
        const subjectColumns: SubjectColumn[] = [];
        for (let column = nameColumn + 1; column < totalColumn; column += 1) {
          if (column === fields.roll || column === fields.serial) continue;
          const label = text(cellValue(sheet, row + 1, column).value);
          const maximum = cellValue(sheet, maximumRow, column).value;
          if (!label || headerKind(label) || isBlank(maximum)) continue;
          subjectColumns.push({
            name: label,
            maximumColumn: column,
            maximumRow,
            obtainedColumn: column,
          });
        }
        if (subjectColumns.length > 0) {
          subjects = subjectColumns;
          dataStartRow = maximumRow + 1;
          totalMaximumRow = maximumRow;
        }
      }
    }

    if (subjects.length === 0 && row < range.e.r) {
      const nextRow = Array.from({ length: columnCount }, (_, index) =>
        text(cellValue(sheet, row + 1, range.s.c + index).value),
      );
      if (nextRow.some((value) => subjectMeasure(value) !== null)) dataStartRow += 1;
    }

    return {
      headerRow: row,
      dataStartRow,
      headers,
      fields,
      subjects,
      totalMaximumRow,
      malformedReason:
        subjects.length === 0
          ? "Student columns were found, but no subject maximum/obtained mark column pairs were detected."
          : undefined,
    };
  }
  return null;
}

function readMetadata(sheet: XLSX.WorkSheet, sheetName: string, headerRow?: number): {
  className: string | null;
  academicYear: string;
  examinationName: string;
  examinationDate: string | null;
  warnings: string[];
} {
  const metadata = {
    className: classFromSheetName(sheetName),
    academicYear: "",
    examinationName: "",
    examinationDate: null as string | null,
    warnings: [] as string[],
  };
  const ref = sheet["!ref"];
  if (!ref) return metadata;
  const range = XLSX.utils.decode_range(ref);
  const lastRow = Math.min(range.e.r, range.s.r + 19, headerRow === undefined ? range.e.r : headerRow - 1);
  const lastColumn = Math.min(range.e.c, range.s.c + 19);
  for (let row = range.s.r; row <= lastRow; row += 1) {
    for (let column = range.s.c; column <= lastColumn; column += 1) {
      const current = cellValue(sheet, row, column).value;
      const label = normalize(current);
      if (isBlank(current)) continue;
      const next = cellValue(sheet, row, column + 1).value;
      const sameCellValue = text(current);
      const colonValue = sameCellValue.match(/^\s*(class|standard|std|grade|session|academic year|academic session|examination|exam|examination name|exam name|date|exam date|examination date)\s*[:\-]\s*(.+)$/i);
      const key = colonValue?.[1] ? normalize(colonValue[1]) : label;
      const value = colonValue?.[2] ?? text(next);
      if (!metadata.className && HEADER_ALIASES.class.some((alias) => normalize(alias) === key)) {
        metadata.className = normalizeClass(value);
      }
      if (!metadata.academicYear && HEADER_ALIASES.session.some((alias) => normalize(alias) === key)) {
        metadata.academicYear = normalizeAcademicYear(value);
      }
      if (!metadata.examinationName && HEADER_ALIASES.examination.some((alias) => normalize(alias) === key)) {
        metadata.examinationName = value;
      }
      if (!metadata.examinationName && !colonValue) {
        const title = sameCellValue.match(/^(?:result\s+of\s+)?(.+?)\s+(?:exam|examination)(?:\s+result)?$/i);
        if (title?.[1] && !/\b(?:school|de[\s-]*paul)\b/i.test(title[1])) {
          metadata.examinationName = title[1].trim();
        }
      }
      if (HEADER_ALIASES.date.some((alias) => normalize(alias) === key)) {
        const dateInput = colonValue ? value : next;
        const parsed = dateValue(dateInput);
        if (parsed && !metadata.examinationDate) {
          metadata.examinationDate = parsed;
        } else if (!parsed && !isBlank(dateInput)) {
          const address = XLSX.utils.encode_cell({ r: row, c: column });
          metadata.warnings.push(`${sheetName}!${address}: examination date is invalid.`);
        }
      }
      if (!metadata.academicYear) {
        const match = sameCellValue.match(/\b(?:20\d{2}\s*[-/–]\s*(?:\d{2}|\d{4}))\b/);
        if (match) metadata.academicYear = normalizeAcademicYear(match[0]);
      }
    }
  }
  return metadata;
}

function dateValue(value: WorkbookValue): string | null {
  const input = text(value);
  if (!input) return null;
  const parsed = new Date(input);
  if (!Number.isNaN(parsed.getTime()) && /^\d{4}-\d{1,2}-\d{1,2}/.test(input)) {
    return parsed.toISOString().slice(0, 10);
  }
  const dayFirst = input.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dayFirst) {
    const date = new Date(Date.UTC(Number(dayFirst[3]), Number(dayFirst[2]) - 1, Number(dayFirst[1])));
    if (
      date.getUTCFullYear() === Number(dayFirst[3]) &&
      date.getUTCMonth() === Number(dayFirst[2]) - 1 &&
      date.getUTCDate() === Number(dayFirst[1])
    ) return date.toISOString().slice(0, 10);
  }
  return null;
}

function addIssue(
  result: WorkbookParseResult,
  student: WorkbookStudent,
  field: string,
  cell: string | null,
  message: string,
): void {
  student.errors.push(message);
  result.errors.push(message);
  result.missingData.push({
    worksheet: student.worksheet,
    rowNumber: student.rowNumber,
    field,
    cell,
  });
}

function readField(
  sheet: XLSX.WorkSheet,
  row: number,
  column: number | undefined,
  result: WorkbookParseResult,
  student: WorkbookStudent,
  field: string,
  missingFormulaCells: Set<string>,
): WorkbookValue {
  if (column === undefined) return null;
  const reference = XLSX.utils.encode_cell({ r: row, c: column });
  const cell = cellValue(sheet, row, column);
  if (missingFormulaCells.has(reference) || cell.formulaMissing) {
    const message = `${student.worksheet}!${reference}: formula result is missing; recalculate and save the workbook.`;
    addIssue(result, student, field, reference, message);
    return null;
  }
  if (cell.error) {
    addIssue(result, student, field, reference, `${student.worksheet}!${reference}: ${cell.error}.`);
  }
  return cell.value;
}

function fieldCell(sheet: XLSX.WorkSheet, row: number, column?: number): string | null {
  return column === undefined ? null : XLSX.utils.encode_cell({ r: row, c: column });
}

function metadataFromWorkbook(workbook: XLSX.WorkBook, names: string[], layouts: Map<string, SheetLayout | null>) {
  const all = {
    academicYear: "",
    examinationName: "",
    examinationDate: null as string | null,
  };
  for (const name of names) {
    const metadata = readMetadata(workbook.Sheets[name], name, layouts.get(name)?.headerRow);
    if (!all.academicYear && metadata.academicYear) all.academicYear = metadata.academicYear;
    if (!all.examinationName && metadata.examinationName) all.examinationName = metadata.examinationName;
    if (!all.examinationDate && metadata.examinationDate) all.examinationDate = metadata.examinationDate;
  }
  return all;
}

export function parseMultiSheetExamWorkbook(
  buffer: Buffer,
  fileName: string,
  options: ParseOptions = {},
): WorkbookParseResult {
  const missingFormulaResults = validateFile(buffer, fileName);
  const extension = fileName.toLowerCase().split(".").pop();
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    raw: true,
    cellFormula: true,
    cellDates: true,
    bookVBA: false,
    dense: false,
    WTF: false,
    ...(extension === "csv" ? { FS: "," } : {}),
  });

  if (workbook.SheetNames.length === 0) {
    throw new Error("The workbook contains no worksheets.");
  }
  if (workbook.SheetNames.length > MAX_SHEETS) {
    throw new Error(`The workbook contains more than ${MAX_SHEETS} worksheets.`);
  }

  const layouts = new Map(workbook.SheetNames.map((name) => [name, buildLayout(workbook.Sheets[name])]));
  const workbookMetadata = metadataFromWorkbook(workbook, workbook.SheetNames, layouts);
  const result: WorkbookParseResult = {
    worksheets: [],
    students: [],
    warnings: [],
    duplicates: [],
    missingData: [],
    errors: [],
  };
  for (const [worksheet, addresses] of missingFormulaResults) {
    for (const address of addresses) {
      const { r } = XLSX.utils.decode_cell(address);
      const message = `${worksheet}!${address}: formula result is missing; recalculate and save the workbook.`;
      result.errors.push(message);
      result.missingData.push({
        worksheet,
        rowNumber: r + 1,
        field: "formula result",
        cell: address,
      });
    }
  }
  let totalCellArea = 0;
  const duplicateKeys = new Map<string, WorkbookStudent>();
  const duplicateNames = new Map<string, WorkbookStudent>();

  for (const worksheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[worksheetName];
    const missingFormulaCells = missingFormulaResults.get(worksheetName) ?? new Set<string>();
    const reference = sheet["!ref"];
    if (reference) {
      const range = XLSX.utils.decode_range(reference);
      totalCellArea += (range.e.r - range.s.r + 1) * (range.e.c - range.s.c + 1);
    }
    if (totalCellArea > MAX_TOTAL_CELLS) {
      throw new Error(`The workbook exceeds the ${MAX_TOTAL_CELLS.toLocaleString()} cell processing limit.`);
    }

    const layout = layouts.get(worksheetName) ?? null;
    const metadata = readMetadata(sheet, worksheetName, layout?.headerRow);
    const className =
      metadata.className ||
      normalizeClass(options.className ?? "");
    const academicYear =
      metadata.academicYear ||
      workbookMetadata.academicYear ||
      normalizeAcademicYear(options.academicYear ?? "");
    const examinationName =
      metadata.examinationName ||
      workbookMetadata.examinationName ||
      (options.examinationName ?? "").trim();
    const examinationDate = metadata.examinationDate || workbookMetadata.examinationDate;
    const sheetWarnings: string[] = [...metadata.warnings];
    const detectedClassName =
      className ||
      (layout?.fields.class !== undefined
        ? normalizeClass(text(cellValue(sheet, layout.dataStartRow, layout.fields.class).value))
        : null);

    if (!layout) {
      const worksheetHasData = Boolean(reference && Object.keys(sheet).some((key) => !key.startsWith("!")));
      const warning = "No student table with recognizable student-name and roll/serial headers was found.";
      if (worksheetHasData) result.errors.push(`${worksheetName}: ${warning}`);
      result.worksheets.push({
        worksheet: worksheetName,
        className,
        studentCount: 0,
        subjects: [],
        examinationName,
        academicYear,
        examinationDate,
        detected: false,
        warnings: [warning],
      });
      continue;
    }

    if (layout.malformedReason) {
      sheetWarnings.push(layout.malformedReason);
      result.errors.push(`${worksheetName}: ${layout.malformedReason}`);
    }
    if (!detectedClassName) {
      const message = `${worksheetName}: class could not be detected from the worksheet name or headers.`;
      sheetWarnings.push(message);
      result.errors.push(message);
    }
    if (!academicYear) {
      const message = `${worksheetName}: academic year/session is missing.`;
      sheetWarnings.push(message);
      result.errors.push(message);
    }
    if (academicYear && !/^\d{4}-\d{2}$/.test(academicYear)) {
      const message = `${worksheetName}: academic year/session must use the format YYYY-YY.`;
      sheetWarnings.push(message);
      result.errors.push(message);
    }
    if (!examinationName) {
      const message = `${worksheetName}: examination name is missing.`;
      sheetWarnings.push(message);
      result.errors.push(message);
    }
    if (examinationName.length > 100) {
      const message = `${worksheetName}: examination name exceeds 100 characters.`;
      sheetWarnings.push(message);
      result.errors.push(message);
    }
    if (layout.fields.total === undefined) {
      const message = `${worksheetName}: total obtained marks column is missing; totals are never calculated.`;
      sheetWarnings.push(message);
      result.errors.push(message);
    }
    if (layout.fields.maximum === undefined && layout.totalMaximumRow === undefined) {
      const message = `${worksheetName}: total maximum marks column is missing; totals are never calculated.`;
      sheetWarnings.push(message);
      result.errors.push(message);
    }
    if (layout.fields.percentage === undefined) {
      const message = `${worksheetName}: percentage column is missing; percentages are never calculated.`;
      sheetWarnings.push(message);
      result.errors.push(message);
    }

    const sheetStudents: WorkbookStudent[] = [];
    if (!layout.malformedReason) {
      const ref = sheet["!ref"]!;
      const range = XLSX.utils.decode_range(ref);
      for (let row = layout.dataStartRow; row <= range.e.r; row += 1) {
        const identityColumns = [
          layout.fields.serial,
          layout.fields.roll,
          layout.fields.name,
          ...layout.subjects.flatMap((subject) => [subject.maximumColumn, subject.obtainedColumn]),
        ].filter((column): column is number => column !== undefined);
        if (identityColumns.every((column) => isBlank(cellValue(sheet, row, column).value))) continue;
        if (result.students.length >= MAX_TOTAL_STUDENTS) {
          throw new Error(`The workbook exceeds the ${MAX_TOTAL_STUDENTS} student processing limit.`);
        }

        const student: WorkbookStudent = {
          worksheet: worksheetName,
          rowNumber: row + 1,
          serialNumber: "",
          rollNumber: "",
          studentName: "",
          className: detectedClassName || "",
          academicYear,
          examinationName,
          examinationDate,
          subjects: [],
          totalMarks: null,
          maximumMarks: null,
          percentage: null,
          grade: "",
          resultStatus: "",
          errors: [],
        };
        const rowClassValue = readField(sheet, row, layout.fields.class, result, student, "className", missingFormulaCells);
        student.className = normalizeClass(text(rowClassValue)) || detectedClassName || "";
        const serial = readField(sheet, row, layout.fields.serial, result, student, "serialNumber", missingFormulaCells);
        const roll = readField(sheet, row, layout.fields.roll, result, student, "rollNumber", missingFormulaCells);
        const name = readField(sheet, row, layout.fields.name, result, student, "studentName", missingFormulaCells);
        student.serialNumber = text(serial);
        student.rollNumber = text(roll);
        student.studentName = text(name);

        if (!student.studentName) {
          addIssue(result, student, "studentName", fieldCell(sheet, row, layout.fields.name), `${worksheetName} row ${row + 1}: student name is missing.`);
        }
        if (typeof name === "number" || typeof name === "boolean") {
          addIssue(result, student, "studentName", fieldCell(sheet, row, layout.fields.name), `${worksheetName} row ${row + 1}: student name must be text.`);
        }
        if (!student.rollNumber && !student.serialNumber) {
          addIssue(result, student, "rollNumber", fieldCell(sheet, row, layout.fields.roll ?? layout.fields.serial), `${worksheetName} row ${row + 1}: roll number and serial number are missing.`);
        }
        if (typeof roll === "boolean") {
          addIssue(result, student, "rollNumber", fieldCell(sheet, row, layout.fields.roll), `${worksheetName} row ${row + 1}: roll number has an invalid value.`);
        }
        if (student.rollNumber.length > 50 || student.studentName.length > 150) {
          addIssue(result, student, "studentIdentity", null, `${worksheetName} row ${row + 1}: roll number or student name exceeds the supported length.`);
        }
        if (!student.className) {
          addIssue(result, student, "className", null, `${worksheetName} row ${row + 1}: class is missing.`);
        }

        for (const subject of layout.subjects) {
          const maxValue = subject.maximumRow === undefined
            ? readField(sheet, row, subject.maximumColumn, result, student, `${subject.name}.maxMarks`, missingFormulaCells)
            : cellValue(sheet, subject.maximumRow, subject.maximumColumn).value;
          const obtainedValue = readField(sheet, row, subject.obtainedColumn, result, student, `${subject.name}.marksObtained`, missingFormulaCells);
          const subjectNameValue = subject.nameColumn === undefined
            ? subject.name
            : text(readField(sheet, row, subject.nameColumn, result, student, `${subject.name}.name`, missingFormulaCells));
          const subjectName = subjectNameValue || subject.name;
          const maxMarks = parseNumeric(maxValue);
          const marksObtained = parseNumeric(obtainedValue);
          const bothMissing = isBlank(maxValue) && isBlank(obtainedValue);
          const missingObtainedMark =
            !isNoMarkValue(obtainedValue) &&
            (marksObtained === null || marksObtained < 0 || marksObtained > (maxMarks ?? 0));

          if (subject.nameColumn !== undefined && !subjectNameValue) {
            addIssue(result, student, `${subject.name}.name`, fieldCell(sheet, row, subject.nameColumn), `${worksheetName} row ${row + 1}: subject name is missing.`);
          }
          if (subjectName.length > 100) {
            addIssue(result, student, `${subjectName}.name`, subject.nameColumn === undefined ? null : fieldCell(sheet, row, subject.nameColumn), `${worksheetName} row ${row + 1}: subject name exceeds 100 characters.`);
          }
          if (bothMissing || maxMarks === null || maxMarks <= 0 || missingObtainedMark) {
            const message = `${worksheetName} row ${row + 1}: invalid or missing marks for "${subjectName}".`;
            addIssue(result, student, `${subjectName}.marks`, fieldCell(sheet, row, subject.obtainedColumn), message);
          }
          const gradeValue = subject.gradeColumn === undefined
            ? null
            : readField(sheet, row, subject.gradeColumn, result, student, `${subjectName}.grade`, missingFormulaCells);
          const remarksValue = subject.remarksColumn === undefined
            ? null
            : readField(sheet, row, subject.remarksColumn, result, student, `${subjectName}.remarks`, missingFormulaCells);
          student.subjects.push({
            subject: subjectName,
            maxMarks: maxValue,
            marksObtained: obtainedValue,
            grade: text(gradeValue),
            remarks: text(remarksValue),
          });
        }
        if (student.subjects.length === 0) {
          addIssue(result, student, "subjects", null, `${worksheetName} row ${row + 1}: no subject marks were found.`);
        }

        student.totalMarks = readField(sheet, row, layout.fields.total, result, student, "totalMarks", missingFormulaCells);
        student.maximumMarks = layout.totalMaximumRow === undefined
          ? readField(sheet, row, layout.fields.maximum, result, student, "maximumMarks", missingFormulaCells)
          : cellValue(sheet, layout.totalMaximumRow, layout.fields.total!).value;
        student.percentage = readField(sheet, row, layout.fields.percentage, result, student, "percentage", missingFormulaCells);
        student.grade = text(readField(sheet, row, layout.fields.grade, result, student, "grade", missingFormulaCells));
        student.resultStatus = text(readField(sheet, row, layout.fields.status, result, student, "resultStatus", missingFormulaCells));
        if (
          student.resultStatus &&
          !["pass", "fail", "needs improvement"].includes(student.resultStatus.toLowerCase())
        ) {
          addIssue(result, student, "resultStatus", fieldCell(sheet, row, layout.fields.status), `${worksheetName} row ${row + 1}: result status is invalid.`);
        }
        const total = parseNumeric(student.totalMarks);
        const maximum = parseNumeric(student.maximumMarks);
        const percentage = parseNumeric(student.percentage);
        if (student.totalMarks === null || total === null || total < 0 || (maximum !== null && total > maximum)) {
          addIssue(result, student, "totalMarks", fieldCell(sheet, row, layout.fields.total), `${worksheetName} row ${row + 1}: total marks are missing or invalid.`);
        }
        if (student.maximumMarks === null || maximum === null || maximum <= 0) {
          addIssue(result, student, "maximumMarks", fieldCell(sheet, row, layout.fields.maximum), `${worksheetName} row ${row + 1}: total maximum marks are missing or invalid.`);
        }
        if (student.percentage === null || percentage === null || percentage < 0 || percentage > 100) {
          addIssue(result, student, "percentage", fieldCell(sheet, row, layout.fields.percentage), `${worksheetName} row ${row + 1}: percentage is missing or invalid.`);
        }
        if (layout.fields.grade !== undefined && !student.grade) {
          addIssue(result, student, "grade", fieldCell(sheet, row, layout.fields.grade), `${worksheetName} row ${row + 1}: grade is missing.`);
        }
        if (!student.resultStatus) student.resultStatus = "Pass";

        const dateColumn = layout.fields.date;
        if (dateColumn !== undefined) {
          const date = readField(sheet, row, dateColumn, result, student, "examinationDate", missingFormulaCells);
          const parsed = dateValue(date);
          if (parsed) student.examinationDate = parsed;
          else if (!isBlank(date)) {
            addIssue(result, student, "examinationDate", fieldCell(sheet, row, dateColumn), `${worksheetName} row ${row + 1}: examination date is invalid.`);
          }
        }

        const studentIdentifier = student.rollNumber || student.serialNumber;
        const duplicateKey = student.className && (studentIdentifier || student.studentName)
          ? `${normalize(student.academicYear)}::${normalize(student.examinationName)}::${normalize(student.className)}::${studentIdentifier ? `roll:${normalize(studentIdentifier)}` : `name:${normalize(student.studentName)}`}`
          : "";
        if (duplicateKey) {
          const original = duplicateKeys.get(duplicateKey);
          if (original) {
            const duplicate = {
              worksheet: student.worksheet,
              rowNumber: student.rowNumber,
              duplicateOfWorksheet: original.worksheet,
              duplicateOfRow: original.rowNumber,
              className: student.className,
              rollNumber: studentIdentifier,
              studentName: student.studentName,
            };
            result.duplicates.push(duplicate);
            const message = `${worksheetName} row ${row + 1}: duplicate roll/serial number "${studentIdentifier}" in class ${student.className}; first seen in ${original.worksheet} row ${original.rowNumber}.`;
            addIssue(result, student, "rollNumber", fieldCell(sheet, row, layout.fields.roll ?? layout.fields.serial), message);
          } else {
            duplicateKeys.set(duplicateKey, student);
          }
        }
        const duplicateNameKey = student.className && student.studentName
          ? `${normalize(student.academicYear)}::${normalize(student.examinationName)}::${normalize(student.className)}::${normalize(student.studentName)}`
          : "";
        if (duplicateNameKey) {
          const original = duplicateNames.get(duplicateNameKey);
          if (original && studentIdentifier.toLowerCase() !== (original.rollNumber || original.serialNumber).toLowerCase()) {
            const duplicate = {
              worksheet: student.worksheet,
              rowNumber: student.rowNumber,
              duplicateOfWorksheet: original.worksheet,
              duplicateOfRow: original.rowNumber,
              className: student.className,
              rollNumber: studentIdentifier,
              studentName: student.studentName,
            };
            result.duplicates.push(duplicate);
            result.warnings.push(`${worksheetName} row ${row + 1}: student name "${student.studentName}" also appears in ${original.worksheet} row ${original.rowNumber}; verify whether these are duplicate records.`);
          } else if (!original) {
            duplicateNames.set(duplicateNameKey, student);
          }
        }

        sheetStudents.push(student);
        result.students.push(student);
      }
    }

    if (sheetStudents.length === 0) {
      const message = `${worksheetName}: no student records were found.`;
      sheetWarnings.push(message);
      result.errors.push(message);
    }
    result.worksheets.push({
      worksheet: worksheetName,
      className: detectedClassName,
      studentCount: sheetStudents.length,
      subjects: [...new Set(sheetStudents.flatMap((student) => student.subjects.map((subject) => subject.subject)))],
      examinationName,
      academicYear,
      examinationDate,
      detected: true,
      warnings: sheetWarnings,
    });
  }

  result.warnings.push(...result.worksheets.flatMap((worksheet) => worksheet.warnings));
  for (const student of result.students) {
    if (student.errors.length) {
      result.warnings.push(...student.errors);
    }
  }
  result.warnings = [...new Set(result.warnings)];
  result.errors = [...new Set(result.errors)];
  return result;
}

export function numericWorkbookValue(value: WorkbookValue): number | null {
  return parseNumeric(value);
}
