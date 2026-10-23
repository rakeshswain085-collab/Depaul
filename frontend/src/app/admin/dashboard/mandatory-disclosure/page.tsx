
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

type Field = { label: string; value: string };

type DisclosureDocument = {
  title: string;
  description: string;
  fileId: string;
  fileName: string;
  published: boolean;
  academicYear?: string;
};

type TeacherCategory = "PGT" | "TGT" | "PRT";

type Teacher = {
  _id: string;
  name: string;
  designation: string;
  subject: string;
  category: TeacherCategory;
  photoId?: string;
  photoUrl?: string;
  published: boolean;
};

type DocumentGroup = {
  title: string;
  documents: DisclosureDocument[];
};

type DisclosureContent = {
  generalInformation: {
    title: string;
    description: string;
    fields: Field[];
  };
  documentsAndCertifications: {
    title: string;
    description: string;
    groups: DocumentGroup[];
  };
  resultsAndAcademics: {
    title: string;
    description: string;
    records: DisclosureDocument[];
  };
  staffInformation: {
    title: string;
    description: string;
    pgtTeachers: number;
    tgtTeachers: number;
    prtTeachers: number;
    principal: string;
    teacherStudentRatio: string;
    specialEducator: string;
    counsellor: string;
  };
  schoolInfrastructure: {
    title: string;
    description: string;
    campusArea: string;
    classrooms: number;
    classroomSize: string;
    scienceLabSize: string;
    computerLabSize: string;
    mathematicsLabSize: string;
    internetFacility: boolean;
    girlsToilets: number;
    boysToilets: number;
  };
  campusInspection: {
    title: string;
    description: string;
    videoUrl: string;
    published: boolean;
  };
  updatedAt?: string | Date;
};

type SectionKey = Exclude<keyof DisclosureContent, "updatedAt">;

const sections: {
  key: SectionKey;
  label: string;
  number: string;
  description: string;
}[] = [
  {
    key: "generalInformation",
    label: "General Information",
    number: "01",
    description: "School identity, affiliation and contact information.",
  },
  {
    key: "documentsAndCertifications",
    label: "Documents & Certifications",
    number: "02",
    description: "Statutory documents and school certificates.",
  },
  {
    key: "resultsAndAcademics",
    label: "Results & Academics",
    number: "03",
    description: "Academic records, fee structure and examination results.",
  },
  {
    key: "staffInformation",
    label: "Staff Information",
    number: "04",
    description: "Teacher counts, school leadership and staff details.",
  },
  {
    key: "schoolInfrastructure",
    label: "School Infrastructure",
    number: "05",
    description: "Campus measurements, classrooms and facilities.",
  },
  {
    key: "campusInspection",
    label: "Campus Inspection",
    number: "06",
    description: "Inspection video and public-facing information.",
  },
];

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

const initialRecords: DisclosureDocument[] = [
  {
    title: "Fee Structure of the School",
    description: "School fee details",
    fileId: "",
    fileName: "",
    published: false,
  },
  {
    title: "Annual Academic Calendar",
    description: "Academic schedule and important dates",
    fileId: "",
    fileName: "",
    published: false,
  },
  {
    title: "School Management Committee (SMC)",
    description: "List of committee members",
    fileId: "",
    fileName: "",
    published: false,
  },
  {
    title: "Parent Teacher Association (PTA)",
    description: "List of PTA members",
    fileId: "",
    fileName: "",
    published: false,
  },
  {
    title: "Last Three Years Board Examination Results",
    description: "CBSE board examination results",
    fileId: "",
    fileName: "",
    published: false,
  },
];

const defaults: DisclosureContent = {
  generalInformation: {
    title: "General Information",
    description:
      "Official information about De-Paul Senior Secondary School, Aska.",
    fields: [
      { label: "Name of the School", value: "De-Paul Senior Secondary School, Aska" },
      { label: "Affiliation Number", value: "1530153" },
      { label: "School Code", value: "15344" },
      { label: "Board", value: "Central Board of Secondary Education (CBSE)" },
      { label: "School Category", value: "Senior Secondary (Co-educational)" },
      { label: "Classes Offered", value: "Pre-Nursery to Class XII" },
      { label: "Year of Establishment", value: "2000" },
      { label: "Address", value: "Rankanath Vihar, College Square, Nuagam, Aska, Ganjam, Odisha – 761111" },
      { label: "District / State", value: "Ganjam, Odisha – 761111" },
      { label: "Principal", value: "Ms. Rajani Panda" },
      { label: "Chairman", value: "Mr. Ashok Padhy" },
      { label: "School Email", value: "depaulschoolaska@gmail.com" },
      { label: "School Telephone", value: "+91 94387 67946" },
      { label: "Nature of the School", value: "Private, Unaided" },
      { label: "Type of Management", value: "Society / Trust managed" },
    ],
  },
  documentsAndCertifications: {
    title: "Documents & Certificates",
    description:
      "Access the school's affiliation documents, statutory certificates and other mandatory records.",
    groups: [],
  },
  resultsAndAcademics: {
    title: "Results & Academics",
    description:
      "Academic information, examination results, school fees and committee records.",
    records: initialRecords,
  },
  staffInformation: {
    title: "Staff Information",
    description: "Teaching staff, school leadership and student-teacher ratio.",
    pgtTeachers: 6,
    tgtTeachers: 18,
    prtTeachers: 6,
    principal: "Ms. Rajani Panda",
    teacherStudentRatio: "1:21",
    specialEducator: "Ms. Narmada Senapati, TGT",
    counsellor: "Mr. Santosh Kumar Mishra, TGT",
  },
  schoolInfrastructure: {
    title: "School Infrastructure",
    description:
      "Campus area, classrooms, laboratories, sanitation facilities and digital connectivity.",
    campusArea: "8,305",
    classrooms: 19,
    classroomSize: "60.47",
    scienceLabSize: "87.79",
    computerLabSize: "60.47",
    mathematicsLabSize: "46.82",
    internetFacility: true,
    girlsToilets: 12,
    boysToilets: 8,
  },
  campusInspection: {
    title: "Explore Our School Infrastructure",
    description:
      "Watch the school inspection video covering the campus and infrastructure facilities of De-Paul Senior Secondary School.",
    videoUrl: "",
    published: true,
  },
};

function cloneDefaults(): DisclosureContent {
  return JSON.parse(JSON.stringify(defaults)) as DisclosureContent;
}

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <textarea
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-slate-900"
      />
    </label>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-slate-200 pb-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-600">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

export default function MandatoryDisclosureAdminPage() {
  const [content, setContent] = useState<DisclosureContent>(cloneDefaults);
  const [activeSection, setActiveSection] =
    useState<SectionKey>("generalInformation");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [teacherCategory, setTeacherCategory] = useState<TeacherCategory>("PGT");
  const [teacherForm, setTeacherForm] = useState({
    name: "",
    designation: "",
    subject: "",
    category: "PGT" as TeacherCategory,
    published: true,
  });
  const [editingTeacherId, setEditingTeacherId] = useState("");
  const [teacherPhoto, setTeacherPhoto] = useState<File | null>(null);
  const [teacherSaving, setTeacherSaving] = useState(false);


  const normalizeTeacherCategory = (value: unknown): TeacherCategory | null => {
    if (value === "PGT" || value === "PGT Teachers") return "PGT";
    if (value === "TGT" || value === "TGT Teachers") return "TGT";
    if (value === "PRT" || value === "PRT Teachers") return "PRT";
    return null;
  };

  const categoryForApi = (value: TeacherCategory) => `${value} Teachers`;

  const loadTeachers = useCallback(async () => {
    try {
      const response = await fetch("/api/staff", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || result.error || "Unable to load teachers.");
      }

      // The API may return either { staff: [...] } or { data: [...] }.
      // Normalize category names because the UI uses PGT/TGT/PRT while
      // the database helper stores "PGT Teachers", "TGT Teachers", etc.
      const records = Array.isArray(result.staff)
        ? result.staff
        : Array.isArray(result.data)
          ? result.data
          : [];

      setTeachers(
        records.flatMap((record: Record<string, unknown>) => {
          const category = normalizeTeacherCategory(record.category);
          if (!category) return [];
          return [{
            ...record,
            _id: String(record._id ?? ""),
            name: String(record.name ?? ""),
            designation: String(record.designation ?? ""),
            subject: String(record.subject ?? ""),
            category,
            published: record.published === true,
            photoId: record.photoId ? String(record.photoId) : undefined,
            photoUrl: record.photoUrl ? String(record.photoUrl) : undefined,
          } as Teacher];
        })
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load teachers.");
    }
  }, []);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  function resetTeacherForm() {
    setTeacherForm({
      name: "",
      designation: "",
      subject: "",
      category: teacherCategory,
      published: true,
    });
    setEditingTeacherId("");
    setTeacherPhoto(null);
  }

  function editTeacher(teacher: Teacher) {
    setTeacherForm({
      name: teacher.name ?? "",
      designation: teacher.designation ?? "",
      subject: teacher.subject ?? "",
      category: teacher.category,
      published: teacher.published !== false,
    });
    setTeacherCategory(teacher.category);
    setEditingTeacherId(teacher._id);
    setTeacherPhoto(null);
  }

  async function saveTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTeacherSaving(true);
    setError("");
    setMessage("");
    try {
      let photoId: string | undefined;
      if (teacherPhoto) {
        if (!teacherPhoto.type.startsWith("image/")) {
          throw new Error("Please choose an image file for the teacher photo.");
        }
        if (teacherPhoto.size > 5 * 1024 * 1024) {
          throw new Error("Teacher photo must be 5 MB or smaller.");
        }
        const photoData = new FormData();
        photoData.append("file", teacherPhoto);
        const uploadResponse = await fetch("/api/staff/upload-photo", {
          method: "POST",
          body: photoData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok || uploadResult.success === false) {
          throw new Error(uploadResult.message || "Teacher photo upload failed.");
        }
        const uploaded = uploadResult.data ?? uploadResult;
        photoId = String(uploaded.photoId ?? uploaded.fileId ?? uploaded._id ?? "");
        if (!photoId) throw new Error("Photo upload did not return a photo ID.");
      }

      const payload = {
        ...teacherForm,
        // Staff API validates the full category names.
        category: categoryForApi(teacherForm.category),
        ...(photoId ? { photoId } : {}),
      };
      const endpoint = editingTeacherId
        ? `/api/staff/${encodeURIComponent(editingTeacherId)}`
        : "/api/staff";
      const response = await fetch(endpoint, {
        method: editingTeacherId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Unable to save teacher.");
      }
      await loadTeachers();
      resetTeacherForm();
      setMessage(editingTeacherId ? "Teacher details updated." : "Teacher added successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save teacher.");
    } finally {
      setTeacherSaving(false);
    }
  }

  async function deleteTeacher(teacher: Teacher) {
    if (!window.confirm(`Delete ${teacher.name} from the staff list?`)) return;
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/staff/${encodeURIComponent(teacher._id)}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Unable to delete teacher.");
      }
      await loadTeachers();
      if (editingTeacherId === teacher._id) resetTeacherForm();
      setMessage("Teacher deleted.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete teacher.");
    }
  }

  const updateSection = useCallback(
    <K extends SectionKey>(
      key: K,
      updater: (section: DisclosureContent[K]) => DisclosureContent[K]
    ) => {
      setContent((current) => ({
        ...current,
        [key]: updater(current[key]),
      }));
      setDirty(true);
      setMessage("");
    },
    []
  );

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/mandatory-disclosure/content",
        { cache: "no-store" }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load content.");
      }

      if (result.data) {
        setContent((current) => ({
          ...current,
          ...result.data,
        }));
      } else {
        setContent(cloneDefaults());
      }

      setDirty(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load content."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  async function saveAll() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/mandatory-disclosure/content",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(content),
        }
      );
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to save content.");
      }

      setDirty(false);
      setMessage("All disclosure changes have been saved.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save content."
      );
    } finally {
      setSaving(false);
    }
  }

  function updateField(index: number, field: keyof Field, value: string) {
    updateSection("generalInformation", (section) => ({
      ...section,
      fields: section.fields.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function updateDocument(
    sectionKey: "documentsAndCertifications" | "resultsAndAcademics",
    index: number,
    changes: Partial<DisclosureDocument>,
    groupIndex = 0
  ) {
    if (sectionKey === "resultsAndAcademics") {
      updateSection("resultsAndAcademics", (section) => ({
        ...section,
        records: section.records.map((item, i) =>
          i === index ? { ...item, ...changes } : item
        ),
      }));
      return;
    }

    updateSection("documentsAndCertifications", (section) => ({
      ...section,
      groups: section.groups.map((group, i) =>
        i === groupIndex
          ? {
              ...group,
              documents: group.documents.map((item, j) =>
                j === index ? { ...item, ...changes } : item
              ),
            }
          : group
      ),
    }));
  }

  async function uploadDocument(
    file: File,
    sectionKey: "documentsAndCertifications" | "resultsAndAcademics",
    index: number,
    groupIndex = 0
  ) {
    if (file.size > 10 * 1024 * 1024) {
      setError("The document must be 10 MB or smaller.");
      return;
    }

    const document =
      sectionKey === "resultsAndAcademics"
        ? content.resultsAndAcademics.records[index]
        : content.documentsAndCertifications.groups[groupIndex]?.documents[index];

    if (!document) {
      setError("Could not find the selected document.");
      return;
    }

    const key = `${sectionKey}-${groupIndex}-${index}`;
    setUploadingKey(key);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", document.title);
      formData.append("description", document.description);
      formData.append("category", sectionKey);
      formData.append("academicYear", document.academicYear ?? "");

      const response = await fetch(
        "/api/mandatory-disclosure/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Document upload failed.");
      }

      const uploaded = result.data ?? result;
      const fileId =
        uploaded.fileId ??
        uploaded.data?.fileId ??
        uploaded._id;

      if (!fileId) {
        throw new Error(
          "The upload endpoint did not return a fileId. Check its response format."
        );
      }

      updateDocument(
        sectionKey,
        index,
        {
          fileId: String(fileId),
          fileName: String(
            uploaded.fileName ?? uploaded.filename ?? file.name
          ),
        },
        groupIndex
      );

      const originalSize = Number(uploaded.originalFileSize ?? file.size);
      const storedSize = Number(uploaded.fileSize ?? originalSize);
      const sizeSummary =
        storedSize < originalSize
          ? ` Optimized from ${(originalSize / 1024).toFixed(1)} KB to ${(storedSize / 1024).toFixed(1)} KB.`
          : " No further size reduction was possible.";
      setMessage(
        `Uploaded ${file.name}.${sizeSummary} Select Save Changes to save the document link.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Document upload failed."
      );
    } finally {
      setUploadingKey("");
    }
  }

  function addDocument(
    sectionKey: "documentsAndCertifications" | "resultsAndAcademics",
    groupIndex = 0
  ) {
    const newDocument: DisclosureDocument = {
      title: "New document",
      description: "",
      fileId: "",
      fileName: "",
      published: false,
    };

    if (sectionKey === "resultsAndAcademics") {
      updateSection("resultsAndAcademics", (section) => ({
        ...section,
        records: [...section.records, newDocument],
      }));
    } else {
      updateSection("documentsAndCertifications", (section) => ({
        ...section,
        groups: section.groups.map((group, i) =>
          i === groupIndex
            ? { ...group, documents: [...group.documents, newDocument] }
            : group
        ),
      }));
    }
  }

  function removeDocument(
    sectionKey: "documentsAndCertifications" | "resultsAndAcademics",
    index: number,
    groupIndex = 0
  ) {
    if (!window.confirm("Remove this document from the disclosure page?")) {
      return;
    }

    if (sectionKey === "resultsAndAcademics") {
      updateSection("resultsAndAcademics", (section) => ({
        ...section,
        records: section.records.filter((_, i) => i !== index),
      }));
    } else {
      updateSection("documentsAndCertifications", (section) => ({
        ...section,
        groups: section.groups.map((group, i) =>
          i === groupIndex
            ? {
                ...group,
                documents: group.documents.filter((_, j) => j !== index),
              }
            : group
        ),
      }));
    }
  }

  const activeMeta = sections.find((section) => section.key === activeSection)!;

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl p-8">
        <div className="animate-pulse text-sm text-slate-500">
          Loading disclosure settings...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-600">
              School Administration
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Mandatory Public Disclosure
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage the information, certificates, academic records, staff,
              infrastructure and inspection video displayed on your website.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/mandatory-disclosure"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Preview Public Page ↗
            </a>
            <button
              type="button"
              onClick={saveAll}
              disabled={saving || !dirty}
              className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            {message}
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[270px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between px-3 py-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Disclosure Categories
              </h2>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">
                06
              </span>
            </div>

            <nav className="space-y-1" aria-label="Disclosure categories">
              {sections.map((section) => {
                const active = activeSection === section.key;

                return (
                  <button
                    key={section.key}
                    type="button"
                    onClick={() => setActiveSection(section.key)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        active
                          ? "bg-white/10 text-amber-300"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {section.number}
                    </span>
                    <span className="text-sm font-semibold">
                      {section.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-4 border-t border-slate-100 px-3 pt-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span
                  className={`h-2 w-2 rounded-full ${
                    dirty ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                />
                {dirty ? "Unsaved changes" : "All changes saved"}
              </div>
            </div>
          </aside>

          <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-5 sm:p-7">
              <SectionHeading
                eyebrow={`${activeMeta.number} / SECTION EDITOR`}
                title={activeMeta.label}
                description={activeMeta.description}
              />

              <div className="mt-6 space-y-7">
                {activeSection === "generalInformation" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldInput
                        label="Section heading"
                        value={content.generalInformation.title}
                        onChange={(value) =>
                          updateSection("generalInformation", (s) => ({
                            ...s,
                            title: value,
                          }))
                        }
                      />
                      <TextAreaField
                        label="Section description"
                        value={content.generalInformation.description}
                        onChange={(value) =>
                          updateSection("generalInformation", (s) => ({
                            ...s,
                            description: value,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          School information
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Edit the label and value displayed in the public table.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          updateSection("generalInformation", (s) => ({
                            ...s,
                            fields: [...s.fields, { label: "", value: "" }],
                          }))
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                      >
                        + Add row
                      </button>
                    </div>

                    <div className="space-y-3">
                      {content.generalInformation.fields.map((field, index) => (
                        <div
                          key={`${index}-${field.label}`}
                          className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_1.3fr_auto]"
                        >
                          <FieldInput
                            label="Label"
                            value={field.label}
                            onChange={(value) => updateField(index, "label", value)}
                          />
                          <FieldInput
                            label="Value"
                            value={field.value}
                            onChange={(value) => updateField(index, "value", value)}
                          />
                          <button
                            type="button"
                            aria-label={`Remove ${field.label || "information row"}`}
                            onClick={() =>
                              updateSection("generalInformation", (s) => ({
                                ...s,
                                fields: s.fields.filter((_, i) => i !== index),
                              }))
                            }
                            className="self-end rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {activeSection === "documentsAndCertifications" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldInput
                        label="Section heading"
                        value={content.documentsAndCertifications.title}
                        onChange={(value) =>
                          updateSection("documentsAndCertifications", (s) => ({
                            ...s,
                            title: value,
                          }))
                        }
                      />
                      <TextAreaField
                        label="Section description"
                        value={content.documentsAndCertifications.description}
                        onChange={(value) =>
                          updateSection("documentsAndCertifications", (s) => ({
                            ...s,
                            description: value,
                          }))
                        }
                      />
                    </div>

                    {content.documentsAndCertifications.groups.map((group, groupIndex) => (
                      <div
                        key={groupIndex}
                        className="space-y-4 rounded-xl border border-slate-200 p-4 sm:p-5"
                      >
                        <FieldInput
                          label="Document group heading"
                          value={group.title}
                          onChange={(value) =>
                            updateSection("documentsAndCertifications", (s) => ({
                              ...s,
                              groups: s.groups.map((g, i) =>
                                i === groupIndex ? { ...g, title: value } : g
                              ),
                            }))
                          }
                        />

                        <div className="space-y-4">
                          {group.documents.map((doc, index) => {
                            const key = `documentsAndCertifications-${groupIndex}-${index}`;

                            return (
                              <article
                                key={`${groupIndex}-${index}`}
                                className="space-y-4 rounded-xl bg-slate-50 p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <h4 className="text-sm font-bold text-slate-800">
                                    Document {index + 1}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeDocument(
                                        "documentsAndCertifications",
                                        index,
                                        groupIndex
                                      )
                                    }
                                    className="text-xs font-semibold text-red-600 hover:underline"
                                  >
                                    Remove
                                  </button>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                  <FieldInput
                                    label="Document title"
                                    value={doc.title}
                                    onChange={(value) =>
                                      updateDocument(
                                        "documentsAndCertifications",
                                        index,
                                        { title: value },
                                        groupIndex
                                      )
                                    }
                                  />
                                  <FieldInput
                                    label="Description"
                                    value={doc.description}
                                    onChange={(value) =>
                                      updateDocument(
                                        "documentsAndCertifications",
                                        index,
                                        { description: value },
                                        groupIndex
                                      )
                                    }
                                  />
                                </div>

                                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
                                  <label className="block text-sm font-semibold text-slate-700">
                                    Document file (any format, max 10 MB)
                                    <input
                                      type="file"
                                      disabled={uploadingKey === key}
                                      onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        if (file) {
                                          uploadDocument(
                                            file,
                                            "documentsAndCertifications",
                                            index,
                                            groupIndex
                                          );
                                        }
                                        event.currentTarget.value = "";
                                      }}
                                      className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:font-semibold file:text-white"
                                    />
                                  </label>

                                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                    <p className="break-all text-xs text-slate-500">
                                      {uploadingKey === key
                                        ? "Uploading document..."
                                        : doc.fileName || "No document uploaded yet"}
                                    </p>
                                    {doc.fileId && (
                                      <a
                                        href={`/api/mandatory-disclosure/file/${doc.fileId}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs font-semibold text-blue-700 hover:underline"
                                      >
                                        Open document ↗
                                      </a>
                                    )}
                                  </div>
                                </div>

                                <Toggle
                                  label="Publish this document"
                                  checked={doc.published}
                                  onChange={(checked) =>
                                    updateDocument(
                                      "documentsAndCertifications",
                                      index,
                                      { published: checked },
                                      groupIndex
                                    )
                                  }
                                />
                              </article>
                            );
                          })}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            addDocument("documentsAndCertifications", groupIndex)
                          }
                          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          + Add document
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        updateSection("documentsAndCertifications", (s) => ({
                          ...s,
                          groups: [...s.groups, { title: "New document group", documents: [] }],
                        }))
                      }
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                      + Add document group
                    </button>
                  </>
                )}

                {activeSection === "resultsAndAcademics" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldInput
                        label="Section heading"
                        value={content.resultsAndAcademics.title}
                        onChange={(value) =>
                          updateSection("resultsAndAcademics", (s) => ({
                            ...s,
                            title: value,
                          }))
                        }
                      />
                      <TextAreaField
                        label="Section description"
                        value={content.resultsAndAcademics.description}
                        onChange={(value) =>
                          updateSection("resultsAndAcademics", (s) => ({
                            ...s,
                            description: value,
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-4">
                      {content.resultsAndAcademics.records.map((doc, index) => {
                        const key = `resultsAndAcademics-0-${index}`;

                        return (
                          <article
                            key={index}
                            className="space-y-4 rounded-xl border border-slate-200 p-4 sm:p-5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <h3 className="font-semibold text-slate-900">
                                Academic record {String(index + 1).padStart(2, "0")}
                              </h3>
                              <button
                                type="button"
                                onClick={() =>
                                  removeDocument("resultsAndAcademics", index)
                                }
                                className="text-xs font-semibold text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                              <FieldInput
                                label="Record title"
                                value={doc.title}
                                onChange={(value) =>
                                  updateDocument(
                                    "resultsAndAcademics",
                                    index,
                                    { title: value }
                                  )
                                }
                              />
                              <FieldInput
                                label="Description"
                                value={doc.description}
                                onChange={(value) =>
                                  updateDocument(
                                    "resultsAndAcademics",
                                    index,
                                    { description: value }
                                  )
                                }
                              />
                              <FieldInput
                                label="Academic year (optional)"
                                value={doc.academicYear ?? ""}
                                onChange={(value) =>
                                  updateDocument(
                                    "resultsAndAcademics",
                                    index,
                                    { academicYear: value }
                                  )
                                }
                              />
                            </div>

                            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                              <label className="block text-sm font-semibold text-slate-700">
                                Upload document (any format, max 10 MB)
                                <input
                                  type="file"
                                  disabled={uploadingKey === key}
                                  onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) {
                                      uploadDocument(file, "resultsAndAcademics", index);
                                    }
                                    event.currentTarget.value = "";
                                  }}
                                  className="mt-2 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:font-semibold file:text-white"
                                />
                              </label>
                              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                                <p className="break-all text-xs text-slate-500">
                                  {uploadingKey === key
                                    ? "Uploading document..."
                                    : doc.fileName || "No document uploaded yet"}
                                </p>
                                {doc.fileId && (
                                  <a
                                    href={`/api/mandatory-disclosure/file/${doc.fileId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-semibold text-blue-700 hover:underline"
                                  >
                                    Open document ↗
                                  </a>
                                )}
                              </div>
                            </div>

                            <Toggle
                              label="Publish this academic record"
                              checked={doc.published}
                              onChange={(checked) =>
                                updateDocument(
                                  "resultsAndAcademics",
                                  index,
                                  { published: checked }
                                )
                              }
                            />
                          </article>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => addDocument("resultsAndAcademics")}
                      className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                    >
                      + Add academic record
                    </button>
                  </>
                )}

                {activeSection === "staffInformation" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldInput
                        label="Section heading"
                        value={content.staffInformation.title}
                        onChange={(value) =>
                          updateSection("staffInformation", (s) => ({ ...s, title: value }))
                        }
                      />
                      <TextAreaField
                        label="Section description"
                        value={content.staffInformation.description}
                        onChange={(value) =>
                          updateSection("staffInformation", (s) => ({ ...s, description: value }))
                        }
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <FieldInput label="PGT teachers" type="number" value={content.staffInformation.pgtTeachers}
                        onChange={(value) => updateSection("staffInformation", (s) => ({ ...s, pgtTeachers: Math.max(0, Number(value) || 0) }))} />
                      <FieldInput label="TGT teachers" type="number" value={content.staffInformation.tgtTeachers}
                        onChange={(value) => updateSection("staffInformation", (s) => ({ ...s, tgtTeachers: Math.max(0, Number(value) || 0) }))} />
                      <FieldInput label="PRT teachers" type="number" value={content.staffInformation.prtTeachers}
                        onChange={(value) => updateSection("staffInformation", (s) => ({ ...s, prtTeachers: Math.max(0, Number(value) || 0) }))} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldInput label="Principal" value={content.staffInformation.principal}
                        onChange={(value) => updateSection("staffInformation", (s) => ({ ...s, principal: value }))} />
                      <FieldInput label="Teacher-student ratio" value={content.staffInformation.teacherStudentRatio}
                        onChange={(value) => updateSection("staffInformation", (s) => ({ ...s, teacherStudentRatio: value }))} />
                      <FieldInput label="Special educator" value={content.staffInformation.specialEducator}
                        onChange={(value) => updateSection("staffInformation", (s) => ({ ...s, specialEducator: value }))} />
                      <FieldInput label="Counsellor and wellness teacher" value={content.staffInformation.counsellor}
                        onChange={(value) => updateSection("staffInformation", (s) => ({ ...s, counsellor: value }))} />
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Teacher Directory</h3>
                          <p className="mt-1 text-sm text-slate-500">Add, edit, publish or remove teacher profiles and photos.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(["PGT", "TGT", "PRT"] as TeacherCategory[]).map((category) => (
                            <button key={category} type="button" onClick={() => { setTeacherCategory(category); setTeacherForm((f) => ({ ...f, category })); }}
                              className={`rounded-lg px-4 py-2 text-sm font-semibold ${teacherCategory === category ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"}`}>
                              {category} Teachers
                            </button>
                          ))}
                        </div>
                      </div>

                      <form onSubmit={saveTeacher} className="mt-5 space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-semibold text-slate-900">{editingTeacherId ? "Edit teacher" : `Add ${teacherCategory} teacher`}</h4>
                          {editingTeacherId && <button type="button" onClick={resetTeacherForm} className="text-sm font-semibold text-slate-600 hover:underline">Cancel edit</button>}
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <FieldInput label="Teacher name" value={teacherForm.name} onChange={(value) => setTeacherForm((f) => ({ ...f, name: value }))} />
                          <FieldInput label="Designation" value={teacherForm.designation} placeholder="e.g. PGT Mathematics" onChange={(value) => setTeacherForm((f) => ({ ...f, designation: value }))} />
                          <FieldInput label="Subject / Department" value={teacherForm.subject} placeholder="e.g. Mathematics" onChange={(value) => setTeacherForm((f) => ({ ...f, subject: value }))} />
                          <label className="block text-sm font-medium text-slate-700">Teacher category
                            <select value={teacherForm.category} onChange={(event) => { const category = event.target.value as TeacherCategory; setTeacherCategory(category); setTeacherForm((f) => ({ ...f, category })); }} className={inputClass}>
                              <option value="PGT">PGT</option><option value="TGT">TGT</option><option value="PRT">PRT</option>
                            </select>
                          </label>
                          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Teacher photo (optional, JPG/PNG/WebP, max 5 MB)
                            <input type="file" accept="image/jpeg,image/png,image/webp,image/*" onChange={(event) => setTeacherPhoto(event.target.files?.[0] ?? null)} className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:font-semibold file:text-white`} />
                          </label>
                        </div>
                        <Toggle label="Publish teacher profile" checked={teacherForm.published} onChange={(checked) => setTeacherForm((f) => ({ ...f, published: checked }))} />
                        <div className="flex flex-wrap gap-2">
                          <button type="submit" disabled={teacherSaving || !teacherForm.name.trim() || !teacherForm.designation.trim()} className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                            {teacherSaving ? "Saving teacher..." : editingTeacherId ? "Update Teacher" : "Add Teacher"}
                          </button>
                          {!editingTeacherId && <button type="button" onClick={resetTeacherForm} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Clear</button>}
                        </div>
                      </form>

                      <div className="mt-6 space-y-3">
                        <h4 className="font-semibold text-slate-900">{teacherCategory} teacher profiles ({teachers.filter((t) => t.category === teacherCategory).length})</h4>
                        {teachers.filter((t) => t.category === teacherCategory).length === 0 ? (
                          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No {teacherCategory} teacher profiles yet. Add the first profile above.</div>
                        ) : teachers.filter((t) => t.category === teacherCategory).map((teacher) => (
                          <article key={teacher._id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center">
                            {teacher.photoId || teacher.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={teacher.photoUrl || `/api/staff/photo/${teacher.photoId}`} alt={teacher.name} className="h-20 w-20 rounded-xl object-cover ring-1 ring-slate-200" />
                            ) : (
                              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl font-bold text-slate-400">{teacher.name.slice(0, 1).toUpperCase()}</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-slate-900">{teacher.name}</p>
                              <p className="mt-1 text-sm text-slate-600">{teacher.designation}</p>
                              {teacher.subject && <p className="mt-1 text-xs text-slate-500">{teacher.subject}</p>}
                              <p className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${teacher.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{teacher.published ? "Published" : "Draft"}</p>
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button type="button" onClick={() => editTeacher(teacher)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-50">Edit</button>
                              <button type="button" onClick={() => deleteTeacher(teacher)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Delete</button>
                            </div>
                          </article>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeSection === "schoolInfrastructure" && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldInput
                        label="Section heading"
                        value={content.schoolInfrastructure.title}
                        onChange={(value) =>
                          updateSection("schoolInfrastructure", (s) => ({
                            ...s,
                            title: value,
                          }))
                        }
                      />
                      <TextAreaField
                        label="Section description"
                        value={content.schoolInfrastructure.description}
                        onChange={(value) =>
                          updateSection("schoolInfrastructure", (s) => ({
                            ...s,
                            description: value,
                          }))
                        }
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FieldInput
                        label="Total campus area (sq. mtr.)"
                        value={content.schoolInfrastructure.campusArea}
                        onChange={(value) =>
                          updateSection("schoolInfrastructure", (s) => ({
                            ...s,
                            campusArea: value,
                          }))
                        }
                      />
                      <FieldInput
                        label="Number of classrooms"
                        type="number"
                        value={content.schoolInfrastructure.classrooms}
                        onChange={(value) =>
                          updateSection("schoolInfrastructure", (s) => ({
                            ...s,
                            classrooms: Math.max(0, Number(value) || 0),
                          }))
                        }
                      />
                      <FieldInput
                        label="Classroom size (sq. mtr.)"
                        value={content.schoolInfrastructure.classroomSize}
                        onChange={(value) =>
                          updateSection("schoolInfrastructure", (s) => ({
                            ...s,
                            classroomSize: value,
                          }))
                        }
                      />
                      <FieldInput
                        label="Science laboratory size (sq. mtr.)"
                        value={content.schoolInfrastructure.scienceLabSize}
                        onChange={(value) =>
                          updateSection("schoolInfrastructure", (s) => ({
                            ...s,
                            scienceLabSize: value,
                          }))
                        }
                      />
                      <FieldInput
                        label="Computer laboratory size (sq. mtr.)"
                        value={content.schoolInfrastructure.computerLabSize}
                        onChange={(value) =>
                          updateSection("schoolInfrastructure", (s) => ({
                            ...s,
                            computerLabSize: value,
                          }))
                        }
                      />
                      <FieldInput
                        label="Mathematics laboratory size (sq. mtr.)"
                        value={content.schoolInfrastructure.mathematicsLabSize}
                        onChange={(value) =>
                          updateSection("schoolInfrastructure", (s) => ({
                            ...s,
                            mathematicsLabSize: value,
                          }))
                        }
                      />
                      <FieldInput
                        label="Girls' toilets"
                        type="number"
                        value={content.schoolInfrastructure.girlsToilets}
                        onChange={(value) =>
                          updateSection("schoolInfrastructure", (s) => ({
                            ...s,
                            girlsToilets: Math.max(0, Number(value) || 0),
                          }))
                        }
                      />
                      <FieldInput
                        label="Boys' toilets"
                        type="number"
                        value={content.schoolInfrastructure.boysToilets}
                        onChange={(value) =>
                          updateSection("schoolInfrastructure", (s) => ({
                            ...s,
                            boysToilets: Math.max(0, Number(value) || 0),
                          }))
                        }
                      />
                    </div>

                    <Toggle
                      label="Internet facility available"
                      checked={content.schoolInfrastructure.internetFacility}
                      onChange={(checked) =>
                        updateSection("schoolInfrastructure", (s) => ({
                          ...s,
                          internetFacility: checked,
                        }))
                      }
                    />
                  </>
                )}

                {activeSection === "campusInspection" && (
                  <>
                    <FieldInput
                      label="Inspection section heading"
                      value={content.campusInspection.title}
                      onChange={(value) =>
                        updateSection("campusInspection", (s) => ({
                          ...s,
                          title: value,
                        }))
                      }
                    />

                    <TextAreaField
                      label="Inspection video description"
                      value={content.campusInspection.description}
                      onChange={(value) =>
                        updateSection("campusInspection", (s) => ({
                          ...s,
                          description: value,
                        }))
                      }
                    />

                    <FieldInput
                      label="Inspection video URL"
                      placeholder="Paste a YouTube video URL"
                      value={content.campusInspection.videoUrl}
                      onChange={(value) =>
                        updateSection("campusInspection", (s) => ({
                          ...s,
                          videoUrl: value,
                        }))
                      }
                    />

                    {content.campusInspection.videoUrl && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="mb-3 text-sm font-semibold text-slate-700">
                          Video preview
                        </p>
                        {(() => {
                          try {
                            const url = new URL(
                              content.campusInspection.videoUrl
                            );
                            let videoId = "";

                            if (url.hostname.includes("youtu.be")) {
                              videoId = url.pathname.slice(1);
                            } else if (
                              url.hostname.includes("youtube.com")
                            ) {
                              videoId =
                                url.searchParams.get("v") ??
                                url.pathname.split("/").filter(Boolean).pop() ??
                                "";
                            }

                            if (!/^[\w-]{11}$/.test(videoId)) {
                              return (
                                <p className="text-sm text-slate-500">
                                  Enter a valid YouTube video URL to preview it.
                                </p>
                              );
                            }

                            return (
                              <div className="aspect-video overflow-hidden rounded-xl bg-black">
                                <iframe
                                  src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                                  title="Campus inspection video preview"
                                  className="h-full w-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>
                            );
                          } catch {
                            return (
                              <p className="text-sm text-slate-500">
                                Enter a valid video URL to preview it.
                              </p>
                            );
                          }
                        })()}
                      </div>
                    )}

                    <Toggle
                      label="Publish campus inspection section"
                      checked={content.campusInspection.published}
                      onChange={(checked) =>
                        updateSection("campusInspection", (s) => ({
                          ...s,
                          published: checked,
                        }))
                      }
                    />
                  </>
                )}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={saveAll}
                  disabled={saving || !dirty}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  onClick={loadContent}
                  disabled={saving || !dirty}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Discard Changes
                </button>

                <span className="text-xs text-slate-500">
                  {dirty
                    ? "You have unsaved changes."
                    : "Your latest saved content is loaded."}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
