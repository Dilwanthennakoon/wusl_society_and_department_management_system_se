"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Society = {
  society_id: number;
  society_name: string;
  society_short_name: string | null;
  status: string;
};

type PersonRow = {
  position: string;
  name: string;
  reg_no: string;
  signature?: string;
};

type ActivityRow = {
  month: string;
  activity: string;
};

type SocietyApplication = {
  application_id: number;
  society_id: number | null;
  application_type: "New Society" | "Renewal";
  academic_year: string;
  society_name: string;
  communication_address: string | null;
  constitution_enforced_date: string | null;
  constitution_annex_note: string | null;
  bank_account_no: string | null;
  agm_date: string | null;
  senior_treasurer_name: string | null;
  senior_treasurer_designation: string | null;
  senior_treasurer_department: string | null;
  new_office_bearers: PersonRow[] | null;
  new_committee_members: PersonRow[] | null;
  previous_office_bearers: PersonRow[] | null;
  previous_committee_members: PersonRow[] | null;
  active_members_count: number | null;
  members_annex_note: string | null;
  previous_year_activities: string | null;
  other_activities: string | null;
  difficulties_and_solutions: string | null;
  proposed_activity_plan: ActivityRow[] | null;
  president_signature: string | null;
  secretary_signature: string | null;
  certification_date: string | null;
  certification_secretary_signature: string | null;
  application_status: string;
  change_request: string | null;
  society?: Society | null;
  admin?: { admin_name: string };
  reviews?: {
    review_id: number;
    action: string;
    remarks: string | null;
    reviewed_at: string;
    admin: { admin_name: string; admin_role: string | null };
  }[];
};

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-600";
const indexNumberPattern = "[A-Za-z0-9/-]+";
const indexNumberTitle =
  "Use letters, numbers, slash, or hyphen without spaces";

function todayInputDate() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

const societyApprovalRoles = [
  "Treasurer",
  "Registrar",
  "Student Counsellor",
  "Department Head",
  "Dean",
  "Vice-Chancellor",
];

function forwardApprovalTargets(role: string) {
  const currentIndex = societyApprovalRoles.indexOf(role);
  return currentIndex === -1
    ? societyApprovalRoles
    : societyApprovalRoles.slice(currentIndex + 1);
}

const officerPositions = [
  "President",
  "Vice-President",
  "Secretary",
  "Assistant Secretary",
  "Junior Treasurer",
  "Editor",
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function emptyPeople(positions: string[], signatures = true) {
  return positions.map((position) => ({
    position,
    name: "",
    reg_no: "",
    ...(signatures ? { signature: "" } : {}),
  }));
}

function emptyCommittee(count: number, signatures = true) {
  return Array.from({ length: count }, () => ({
    position: "Committee Member",
    name: "",
    reg_no: "",
    ...(signatures ? { signature: "" } : {}),
  }));
}

const emptyForm = {
  application_type: "New Society" as "New Society" | "Renewal",
  society_id: "",
  academic_year: "",
  society_name: "",
  communication_address: "",
  constitution_enforced_date: "",
  constitution_annex_note: "",
  bank_account_no: "",
  agm_date: "",
  senior_treasurer_name: "",
  senior_treasurer_designation: "",
  senior_treasurer_department: "",
  new_office_bearers: emptyPeople(officerPositions),
  new_committee_members: emptyCommittee(12),
  previous_office_bearers: emptyPeople(officerPositions, false),
  previous_committee_members: emptyCommittee(12, false),
  active_members_count: "",
  members_annex_note: "",
  previous_year_activities: "",
  other_activities: "",
  difficulties_and_solutions: "",
  proposed_activity_plan: months.map((month) => ({ month, activity: "" })),
  president_signature: "",
  secretary_signature: "",
  certification_date: "",
  certification_secretary_signature: "",
};

type FormState = typeof emptyForm;

const applicationFormPhases = [
  { title: "Phase 1", description: "Society details" },
  { title: "Phase 2", description: "People and members" },
  { title: "Phase 3", description: "Activities and certification" },
] as const;

function societyDraftStorageKey(role: string) {
  return `society-application-create-draft:${role}`;
}

function clampApplicationPhase(value: unknown) {
  const phase = Number(value);
  if (!Number.isFinite(phase)) return 0;
  return Math.min(
    Math.max(Math.trunc(phase), 0),
    applicationFormPhases.length - 1,
  );
}

function hasSocietyApplicationDraft(form: FormState) {
  const primitiveKeys: (keyof FormState)[] = [
    "application_type",
    "society_id",
    "academic_year",
    "society_name",
    "communication_address",
    "constitution_enforced_date",
    "constitution_annex_note",
    "bank_account_no",
    "agm_date",
    "senior_treasurer_name",
    "senior_treasurer_designation",
    "senior_treasurer_department",
    "active_members_count",
    "members_annex_note",
    "previous_year_activities",
    "other_activities",
    "difficulties_and_solutions",
    "president_signature",
    "secretary_signature",
    "certification_date",
    "certification_secretary_signature",
  ];
  return (
    primitiveKeys.some((key) => form[key] !== emptyForm[key]) ||
    form.new_office_bearers.some((row, index) =>
      Object.keys(row).some(
        (key) =>
          row[key as keyof PersonRow] !==
          emptyForm.new_office_bearers[index]?.[key as keyof PersonRow],
      ),
    ) ||
    form.new_committee_members.some((row) => row.name || row.reg_no || row.signature) ||
    form.previous_office_bearers.some((row) => row.name || row.reg_no) ||
    form.previous_committee_members.some((row) => row.name || row.reg_no) ||
    form.proposed_activity_plan.some((row) => row.activity)
  );
}

function societyApplicationPhaseComplete(form: FormState, phase: number) {
  if (phase === 0) {
    return Boolean(
      form.academic_year.trim() &&
        form.society_name.trim() &&
        (form.application_type !== "Renewal" || form.society_id),
    );
  }
  if (phase === 2) {
    return Boolean(
      form.president_signature.trim() &&
        form.secretary_signature.trim() &&
        form.certification_date &&
        form.certification_secretary_signature.trim(),
    );
  }
  return true;
}

export default function SocietyApplicationBoard({
  role,
  canCreate = false,
}: {
  role: string;
  canCreate?: boolean;
}) {
  const [applications, setApplications] = useState<SocietyApplication[]>([]);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewingApplication, setViewingApplication] =
    useState<SocietyApplication | null>(null);
  const isRenewal = form.application_type === "Renewal";

  const load = useCallback(async () => {
    const requests = [
      fetch(`/api/workflow/society-applications?role=${encodeURIComponent(role)}`, {
        cache: "no-store",
      }),
    ];
    if (canCreate) requests.push(fetch("/api/societies", { cache: "no-store" }));
    const [appResponse, societyResponse] = await Promise.all(requests);
    const appData = await appResponse.json();
    if (!appResponse.ok) throw new Error(appData.message || "Failed to load applications");
    setApplications(appData);
    if (societyResponse) setSocieties(await societyResponse.json());
  }, [canCreate, role]);

  useEffect(() => {
    async function run() {
      try {
        await load();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    run();
  }, [load]);

  const stats = useMemo(
    () => ({
      total: applications.length,
      draft: applications.filter((item) => item.application_status === "Draft").length,
      pending: applications.filter((item) => item.application_status.startsWith("Pending")).length,
      approved: applications.filter((item) => item.application_status === "Approved").length,
    }),
    [applications],
  );

  function payload() {
    return {
      ...form,
      society_id: form.application_type === "Renewal" ? Number(form.society_id) : null,
      active_members_count: form.active_members_count
        ? Number(form.active_members_count)
        : null,
      previous_office_bearers: isRenewal ? form.previous_office_bearers : null,
      previous_committee_members: isRenewal
        ? form.previous_committee_members
        : null,
      previous_year_activities: isRenewal ? form.previous_year_activities : null,
      other_activities: isRenewal ? form.other_activities : null,
      difficulties_and_solutions: isRenewal
        ? form.difficulties_and_solutions
        : null,
    };
  }

  async function saveApplication(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const response = await fetch(
      editingId
        ? `/api/workflow/society-applications/${editingId}`
        : "/api/workflow/society-applications",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Failed to save society application");
      return false;
    }
    setForm(emptyForm);
    setEditingId(null);
    setMessage("Society application draft saved.");
    await load();
    return true;
  }

  async function act(
    applicationId: number,
    action: "submit" | "approve" | "send-back" | "reject",
    targetRole?: string,
  ) {
    setMessage("");
    const response = await fetch(`/api/workflow/society-applications/${applicationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        remarks: remarks[applicationId] || undefined,
        target_role: targetRole || undefined,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Action failed");
      return;
    }
    setRemarks((current) => ({ ...current, [applicationId]: "" }));
    setMessage("Society application workflow updated.");
    await load();
  }

  function edit(application: SocietyApplication) {
    setEditingId(application.application_id);
    setForm({
      ...emptyForm,
      application_type: application.application_type,
      society_id: String(application.society_id || ""),
      academic_year: application.academic_year || "",
      society_name: application.society_name || "",
      communication_address: application.communication_address || "",
      constitution_enforced_date: datePart(application.constitution_enforced_date),
      constitution_annex_note: application.constitution_annex_note || "",
      bank_account_no: application.bank_account_no || "",
      agm_date: datePart(application.agm_date),
      senior_treasurer_name: application.senior_treasurer_name || "",
      senior_treasurer_designation:
        application.senior_treasurer_designation || "",
      senior_treasurer_department: application.senior_treasurer_department || "",
      new_office_bearers:
        application.new_office_bearers || emptyPeople(officerPositions),
      new_committee_members:
        application.new_committee_members || emptyCommittee(12),
      previous_office_bearers:
        application.previous_office_bearers || emptyPeople(officerPositions, false),
      previous_committee_members:
        application.previous_committee_members || emptyCommittee(12, false),
      active_members_count: String(application.active_members_count || ""),
      members_annex_note: application.members_annex_note || "",
      previous_year_activities: application.previous_year_activities || "",
      other_activities: application.other_activities || "",
      difficulties_and_solutions: application.difficulties_and_solutions || "",
      proposed_activity_plan:
        application.proposed_activity_plan ||
        months.map((month) => ({ month, activity: "" })),
      president_signature: application.president_signature || "",
      secretary_signature: application.secretary_signature || "",
      certification_date: datePart(application.certification_date),
      certification_secretary_signature:
        application.certification_secretary_signature || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Applications" value={stats.total} />
        <Stat label="Drafts" value={stats.draft} />
        <Stat label="Pending" value={stats.pending} />
        <Stat label="Approved" value={stats.approved} />
      </div>

      {message && (
        <p className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
          {message}
        </p>
      )}

      {canCreate && (
        <SocietyApplicationForm
          editingId={editingId}
          form={form}
          setForm={setForm}
          societies={societies}
          saveApplication={saveApplication}
          cancelEdit={() => {
            setEditingId(null);
            setForm(emptyForm);
          }}
        />
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {loading ? (
          <p className="rounded-2xl bg-white p-6 text-gray-600">Loading applications...</p>
        ) : applications.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-gray-600">No society applications found.</p>
        ) : (
          applications.map((application) => (
            <article
              key={application.application_id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{application.application_status}</Badge>
                    <Badge>{application.application_type}</Badge>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-gray-900">
                    {application.society_name}
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Academic year {application.academic_year} - Created by{" "}
                    {application.admin?.admin_name || "Society Admin"}
                  </p>
                  {application.change_request && (
                    <p className="mt-4 rounded-xl bg-amber-50 p-4 text-amber-800">
                      Latest comment/request: {application.change_request}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewingApplication(application)}
                    className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800"
                  >
                    View full application
                  </button>
                  {application.reviews && application.reviews.length > 0 && (
                    <p className="mt-3 text-xs text-gray-500">
                      Latest action: {application.reviews[0].action} by{" "}
                      {application.reviews[0].admin.admin_name}
                    </p>
                  )}
                </div>
                <ApplicationActions
                  application={application}
                  role={role}
                  canCreate={canCreate}
                  remark={remarks[application.application_id] || ""}
                  setRemark={(value) =>
                    setRemarks((current) => ({
                      ...current,
                      [application.application_id]: value,
                    }))
                  }
                  act={(action, targetRole) =>
                    act(application.application_id, action, targetRole)
                  }
                  edit={() => edit(application)}
                />
              </div>
            </article>
          ))
        )}
      </div>
      {viewingApplication && (
        <SocietyApplicationModal
          application={viewingApplication}
          onClose={() => setViewingApplication(null)}
        />
      )}
    </section>
  );
}

function datePart(value: string | null | undefined) {
  return value?.split("T")[0] || "";
}

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "block md:col-span-2" : "block"}>
      <span className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function SocietyApplicationForm({
  editingId,
  form,
  setForm,
  societies,
  saveApplication,
  cancelEdit,
}: {
  editingId: number | null;
  form: FormState;
  setForm: (form: FormState) => void;
  societies: Society[];
  saveApplication: (event: React.FormEvent) => Promise<boolean>;
  cancelEdit: () => void;
}) {
  const isRenewal = form.application_type === "Renewal";
  const [phase, setPhase] = useState(0);
  const [draftStatus, setDraftStatus] = useState("");
  const draftKey = useMemo(() => societyDraftStorageKey("Society Admin"), []);
  const lastPhase = applicationFormPhases.length - 1;
  const canUseBrowserDraft = editingId === null;

  useEffect(() => {
    if (!canUseBrowserDraft) return;
    const timeout = window.setTimeout(() => {
      try {
        const rawDraft = window.localStorage.getItem(draftKey);
        if (!rawDraft) return;
        const draft = JSON.parse(rawDraft) as {
          form?: Partial<FormState>;
          phase?: number;
        };
        if (!draft.form) return;
        setForm({ ...emptyForm, ...draft.form });
        setPhase(clampApplicationPhase(draft.phase));
        setDraftStatus("Draft restored on this device.");
      } catch {
        window.localStorage.removeItem(draftKey);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [canUseBrowserDraft, draftKey, setForm]);

  useEffect(() => {
    if (!canUseBrowserDraft || !hasSocietyApplicationDraft(form)) return;
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          draftKey,
          JSON.stringify({
            form,
            phase,
            savedAt: new Date().toISOString(),
          }),
        );
        setDraftStatus("Draft saved on this device.");
      } catch {
        setDraftStatus("Draft could not be saved in this browser.");
      }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [canUseBrowserDraft, draftKey, form, phase]);

  async function submit(event: React.FormEvent) {
    const saved = await saveApplication(event);
    if (!saved) return;
    if (canUseBrowserDraft) window.localStorage.removeItem(draftKey);
    setPhase(0);
    setDraftStatus("");
  }

  function saveDraftNow() {
    if (!canUseBrowserDraft) return;
    window.localStorage.setItem(
      draftKey,
      JSON.stringify({
        form,
        phase,
        savedAt: new Date().toISOString(),
      }),
    );
    setDraftStatus("Draft saved on this device.");
  }

  function clearDraft() {
    if (canUseBrowserDraft) window.localStorage.removeItem(draftKey);
    setForm(emptyForm);
    setPhase(0);
    setDraftStatus("Draft cleared.");
  }

  function nextPhase() {
    if (!societyApplicationPhaseComplete(form, phase)) {
      setDraftStatus("Complete the required details in this phase first.");
      return;
    }
    saveDraftNow();
    setPhase(Math.min(phase + 1, lastPhase));
  }

  function previousPhase() {
    saveDraftNow();
    setPhase(Math.max(phase - 1, 0));
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2"
    >
      <div className="md:col-span-2">
        <h2 className="text-xl font-bold text-gray-900">
          APPLICATION FOR REGISTRATION / RENEWAL OF STUDENT SOCIETIES
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Complete one phase at a time. Unsaved progress is stored as a draft on
          this device.
        </p>
        {draftStatus && (
          <p className="mt-2 text-sm font-semibold text-blue-700">
            {draftStatus}
          </p>
        )}
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {applicationFormPhases.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => index <= phase && setPhase(index)}
              disabled={index > phase}
              className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                index === phase
                  ? "border-blue-800 bg-blue-800 text-white"
                  : societyApplicationPhaseComplete(form, index)
                    ? "border-green-200 bg-green-50 text-green-800"
                    : "border-gray-200 bg-gray-50 text-gray-600"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span className="block font-bold">{item.title}</span>
              <span>{item.description}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={phase === 0 ? "contents" : "hidden"}>
      <Field label="Application type">
        <select
          value={form.application_type}
          onChange={(event) =>
            setForm({
              ...form,
              application_type: event.target.value as "New Society" | "Renewal",
              society_id: "",
              society_name: "",
            })
          }
          className={inputClass}
        >
          <option>New Society</option>
          <option>Renewal</option>
        </select>
      </Field>
      <Field label="For the Academic Year">
        <input
          value={form.academic_year}
          onChange={(event) =>
            setForm({ ...form, academic_year: event.target.value })
          }
          required
          className={inputClass}
        />
      </Field>
      {isRenewal && (
        <Field label="Existing Society">
          <select
            value={form.society_id}
            onChange={(event) => {
              const selected = societies.find(
                (society) => society.society_id === Number(event.target.value),
              );
              setForm({
                ...form,
                society_id: event.target.value,
                society_name: selected?.society_name || form.society_name,
              });
            }}
            required
            className={inputClass}
          >
            <option value="">Select society</option>
            {societies.map((society) => (
              <option key={society.society_id} value={society.society_id}>
                {society.society_name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Field label="Name of the Society">
        <input
          value={form.society_name}
          onChange={(event) =>
            setForm({ ...form, society_name: event.target.value })
          }
          required
          className={inputClass}
        />
      </Field>
      <Field label="Address for Communication" wide>
        <textarea
          value={form.communication_address}
          onChange={(event) =>
            setForm({ ...form, communication_address: event.target.value })
          }
          rows={3}
          className={inputClass}
        />
      </Field>
      <Field label="Enforce Date of the Constitution of the Society">
        <input
          type="date"
          value={form.constitution_enforced_date}
          onChange={(event) =>
            setForm({
              ...form,
              constitution_enforced_date: event.target.value,
            })
          }
          className={inputClass}
        />
      </Field>
      <Field label="Annex the Constitution">
        <input
          value={form.constitution_annex_note}
          onChange={(event) =>
            setForm({ ...form, constitution_annex_note: event.target.value })
          }
          placeholder="Attachment/reference note"
          className={inputClass}
        />
      </Field>
      <Field label="Bank Account No. (if any)">
        <input
          value={form.bank_account_no}
          onChange={(event) =>
            setForm({ ...form, bank_account_no: event.target.value })
          }
          className={inputClass}
        />
      </Field>
      <Field label="Date of A.G.M. Held">
        <input
          type="date"
          value={form.agm_date}
          onChange={(event) => setForm({ ...form, agm_date: event.target.value })}
          className={inputClass}
        />
      </Field>
      </div>

      <div className={phase === 1 ? "contents" : "hidden"}>
      <Section title="Senior Treasurer" />
      <Field label="Name">
        <input
          value={form.senior_treasurer_name}
          onChange={(event) =>
            setForm({ ...form, senior_treasurer_name: event.target.value })
          }
          className={inputClass}
        />
      </Field>
      <Field label="Designation">
        <input
          value={form.senior_treasurer_designation}
          onChange={(event) =>
            setForm({
              ...form,
              senior_treasurer_designation: event.target.value,
            })
          }
          className={inputClass}
        />
      </Field>
      <Field label="Department">
        <input
          value={form.senior_treasurer_department}
          onChange={(event) =>
            setForm({
              ...form,
              senior_treasurer_department: event.target.value,
            })
          }
          className={inputClass}
        />
      </Field>

      <PeopleTable
        title="Newly Appointed Office Bearers"
        rows={form.new_office_bearers}
        setRows={(rows) => setForm({ ...form, new_office_bearers: rows })}
        signatures
      />
      <PeopleTable
        title="Committee Members"
        rows={form.new_committee_members}
        setRows={(rows) => setForm({ ...form, new_committee_members: rows })}
        signatures
      />

      {isRenewal && (
        <>
          <PeopleTable
            title="Officers of the Previous Academic Year"
            rows={form.previous_office_bearers}
            setRows={(rows) =>
              setForm({ ...form, previous_office_bearers: rows })
            }
          />
          <PeopleTable
            title="Previous Committee Members"
            rows={form.previous_committee_members}
            setRows={(rows) =>
              setForm({ ...form, previous_committee_members: rows })
            }
          />
        </>
      )}

      <Field label="Number of Active Members">
        <input
          type="number"
          min="0"
          value={form.active_members_count}
          onChange={(event) =>
            setForm({ ...form, active_members_count: event.target.value })
          }
          className={inputClass}
        />
      </Field>
      <Field label="Annex complete list of members with registration numbers">
        <input
          value={form.members_annex_note}
          onChange={(event) =>
            setForm({ ...form, members_annex_note: event.target.value })
          }
          placeholder="Attachment/reference note"
          className={inputClass}
        />
      </Field>
      </div>

      <div className={phase === 2 ? "contents" : "hidden"}>
      {isRenewal && (
        <>
          <Field
            label="Activities conducted, progress and achievements made by the Society during the previous year"
            wide
          >
            <textarea
              value={form.previous_year_activities}
              onChange={(event) =>
                setForm({ ...form, previous_year_activities: event.target.value })
              }
              rows={4}
              className={inputClass}
            />
          </Field>
          <Field
            label="Any other cultural, educational or social events, trips or excursions organized by the Society"
            wide
          >
            <textarea
              value={form.other_activities}
              onChange={(event) =>
                setForm({ ...form, other_activities: event.target.value })
              }
              rows={4}
              className={inputClass}
            />
          </Field>
          <Field
            label="Difficulties faced when organizing events and how they will be overcome"
            wide
          >
            <textarea
              value={form.difficulties_and_solutions}
              onChange={(event) =>
                setForm({
                  ...form,
                  difficulties_and_solutions: event.target.value,
                })
              }
              rows={4}
              className={inputClass}
            />
          </Field>
        </>
      )}

      <ActivityPlanTable
        rows={form.proposed_activity_plan}
        setRows={(rows) => setForm({ ...form, proposed_activity_plan: rows })}
      />
      <Field label="Signature of the President">
        <input
          value={form.president_signature}
          onChange={(event) =>
            setForm({ ...form, president_signature: event.target.value })
          }
          required
          className={inputClass}
        />
      </Field>
      <Field label="Signature of the Secretary">
        <input
          value={form.secretary_signature}
          onChange={(event) =>
            setForm({ ...form, secretary_signature: event.target.value })
          }
          required
          className={inputClass}
        />
      </Field>
      <Section title="Certification" />
      <Field label="Date">
        <input
          type="date"
          min={todayInputDate()}
          value={form.certification_date}
          onChange={(event) =>
            setForm({ ...form, certification_date: event.target.value })
          }
          required
          className={inputClass}
        />
      </Field>
      <Field label="Signature of the Secretary">
        <input
          value={form.certification_secretary_signature}
          onChange={(event) =>
            setForm({
              ...form,
              certification_secretary_signature: event.target.value,
            })
          }
          required
          className={inputClass}
        />
      </Field>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 md:col-span-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={previousPhase}
            disabled={phase === 0}
            className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={editingId ? cancelEdit : clearDraft}
            className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-700"
          >
            {editingId ? "Cancel" : "Clear draft"}
          </button>
        </div>
        <div className="flex gap-3">
          {canUseBrowserDraft && (
            <button
              type="button"
              onClick={saveDraftNow}
              className="rounded-xl border border-blue-200 px-5 py-3 font-semibold text-blue-700"
            >
              Save draft
            </button>
          )}
          {phase < lastPhase ? (
            <button
              type="button"
              onClick={nextPhase}
              className="rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white"
            >
              Next phase
            </button>
          ) : (
            <button className="rounded-xl bg-blue-800 px-5 py-3 font-semibold text-white">
              {editingId ? "Save draft changes" : "Save application draft"}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function Section({ title }: { title: string }) {
  return (
    <h3 className="border-t border-gray-200 pt-4 text-base font-bold text-gray-900 md:col-span-2">
      {title}
    </h3>
  );
}

function PeopleTable({
  title,
  rows,
  setRows,
  signatures = false,
}: {
  title: string;
  rows: PersonRow[];
  setRows: (rows: PersonRow[]) => void;
  signatures?: boolean;
}) {
  function update(index: number, key: keyof PersonRow, value: string) {
    setRows(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  }
  return (
    <div className="md:col-span-2">
      <h3 className="mb-3 border-t border-gray-200 pt-4 text-base font-bold text-gray-900">
        {title}
      </h3>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={`${title}-${index}`}
            className={`grid gap-3 ${signatures ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}
          >
            <input
              value={row.position}
              onChange={(event) => update(index, "position", event.target.value)}
              placeholder="Position"
              className={inputClass}
            />
            <input
              value={row.name}
              onChange={(event) => update(index, "name", event.target.value)}
              placeholder="Name"
              className={inputClass}
            />
            <input
              value={row.reg_no}
              onChange={(event) => update(index, "reg_no", event.target.value)}
              placeholder="Reg. No."
              pattern={indexNumberPattern}
              title={indexNumberTitle}
              className={inputClass}
            />
            {signatures && (
              <input
                value={row.signature || ""}
                onChange={(event) => update(index, "signature", event.target.value)}
                placeholder="Signature"
                className={inputClass}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityPlanTable({
  rows,
  setRows,
}: {
  rows: ActivityRow[];
  setRows: (rows: ActivityRow[]) => void;
}) {
  return (
    <div className="md:col-span-2">
      <h3 className="mb-3 border-t border-gray-200 pt-4 text-base font-bold text-gray-900">
        Proposed Activity Plan for the Next Year
      </h3>
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((row, index) => (
          <Field key={row.month} label={row.month}>
            <input
              value={row.activity}
              onChange={(event) =>
                setRows(
                  rows.map((item, rowIndex) =>
                    rowIndex === index
                      ? { ...item, activity: event.target.value }
                      : item,
                  ),
                )
              }
              className={inputClass}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}

function ApplicationDetails({
  application,
}: {
  application: SocietyApplication;
}) {
  const isRenewal = application.application_type === "Renewal";
  return (
      <div className="grid gap-4 md:grid-cols-2">
        <Detail label="For the Academic Year" value={application.academic_year} />
        <Detail label="Name of the Society" value={application.society_name} />
        <Detail label="Address for Communication" value={application.communication_address} wide />
        <Detail label="Constitution Enforced Date" value={formatDate(application.constitution_enforced_date)} />
        <Detail label="Constitution Annex" value={application.constitution_annex_note} />
        <Detail label="Bank Account No." value={application.bank_account_no} />
        <Detail label="Date of A.G.M. Held" value={formatDate(application.agm_date)} />
        <SectionRead title="Senior Treasurer" />
        <Detail label="Name" value={application.senior_treasurer_name} />
        <Detail label="Designation" value={application.senior_treasurer_designation} />
        <Detail label="Department" value={application.senior_treasurer_department} />
        <PeopleRead title="Newly Appointed Office Bearers" rows={application.new_office_bearers || []} />
        <PeopleRead title="Committee Members" rows={application.new_committee_members || []} />
        {isRenewal && (
          <>
            <PeopleRead title="Officers of the Previous Academic Year" rows={application.previous_office_bearers || []} />
            <PeopleRead title="Previous Committee Members" rows={application.previous_committee_members || []} />
          </>
        )}
        <Detail label="Number of Active Members" value={application.active_members_count} />
        <Detail label="Members Annex" value={application.members_annex_note} />
        {isRenewal && (
          <>
            <Detail label="Activities Conducted During Previous Year" value={application.previous_year_activities} wide />
            <Detail label="Other Activities" value={application.other_activities} wide />
            <Detail label="Difficulties and Solutions" value={application.difficulties_and_solutions} wide />
          </>
        )}
        <PlanRead rows={application.proposed_activity_plan || []} />
        <Detail label="Signature of the President" value={application.president_signature} />
        <Detail label="Signature of the Secretary" value={application.secretary_signature} />
        <Detail label="Certification Date" value={formatDate(application.certification_date)} />
        <Detail label="Certification Signature of the Secretary" value={application.certification_secretary_signature} />
      </div>
  );
}

function SocietyApplicationModal({
  application,
  onClose,
}: {
  application: SocietyApplication;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
          <div>
            <p className="text-sm font-semibold uppercase text-blue-700">
              Society application
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              {application.society_name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {application.application_type} - {application.application_status}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 px-4 py-2 font-semibold text-gray-700"
          >
            Close
          </button>
        </div>
        <div className="max-h-[72vh] overflow-y-auto p-5">
          <ApplicationDetails application={application} />
        </div>
      </div>
    </div>
  );
}

function ApplicationActions({
  application,
  role,
  canCreate,
  remark,
  setRemark,
  act,
  edit,
}: {
  application: SocietyApplication;
  role: string;
  canCreate: boolean;
  remark: string;
  setRemark: (value: string) => void;
  act: (
    action: "submit" | "approve" | "send-back" | "reject",
    targetRole?: string,
  ) => void;
  edit: () => void;
}) {
  const status = application.application_status;
  const canSubmit = canCreate && status === "Draft";
  const canEdit = canCreate && status === "Draft";
  const approvalTargets = forwardApprovalTargets(role);
  const changeTargets = [
    "Society Admin",
    ...societyApprovalRoles.filter((item) => item !== role),
  ];
  const [targetRole, setTargetRole] = useState(approvalTargets[0] || "");
  const [changeTargetRole, setChangeTargetRole] = useState("Society Admin");
  const selectedTargetRole = approvalTargets.includes(targetRole)
    ? targetRole
    : approvalTargets[0] || "";
  const selectedChangeTargetRole = changeTargets.includes(changeTargetRole)
    ? changeTargetRole
    : changeTargets[0] || "";
  const canApprove =
    (role === "Treasurer" && status === "Pending Treasurer Society Approval") ||
    (role === "Registrar" && status === "Pending Registrar Society Approval") ||
    (role === "Student Counsellor" && status === "Pending Student Counsellor Society Approval") ||
    (role === "Department Head" && status === "Pending Department Head Society Approval") ||
    (role === "Dean" && status === "Pending Dean Society Approval") ||
    (role === "Vice-Chancellor" && status === "Pending Vice-Chancellor Society Approval");
  const isFinalApprover =
    role === "Vice-Chancellor" &&
    status === "Pending Vice-Chancellor Society Approval";
  const [open, setOpen] = useState(false);
  if (!canSubmit && !canEdit && !canApprove) return null;
  return (
    <div className="mt-4 xl:mt-0">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-blue-800 px-4 py-2 text-sm font-semibold text-white"
      >
        Actions
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
              <div>
                <p className="text-sm font-semibold uppercase text-blue-700">
                  Application actions
                </p>
                <h3 className="mt-1 text-lg font-bold text-gray-900">
                  {application.society_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="max-h-[70vh] space-y-3 overflow-y-auto p-5">
      {canApprove && (
        <textarea
          value={remark}
          onChange={(event) => setRemark(event.target.value)}
          placeholder="Comment required when requesting changes or rejecting"
          rows={3}
          className={inputClass}
        />
      )}
      {(canApprove || canSubmit) &&
        !isFinalApprover &&
        approvalTargets.length > 0 && (
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-gray-700">
            Send to
          </span>
          <select
            value={selectedTargetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            className={inputClass}
          >
            {approvalTargets.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      )}
      {canApprove && (
        <button
          onClick={() => act("approve", selectedTargetRole)}
          className="w-full rounded-xl bg-green-600 px-4 py-2 font-semibold text-white"
        >
          {isFinalApprover ? "Final approval" : "Send for approval"}
        </button>
      )}
      {canApprove && (
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-gray-700">
            Send changes to
          </span>
          <select
            value={selectedChangeTargetRole}
            onChange={(event) => setChangeTargetRole(event.target.value)}
            className={inputClass}
          >
            {changeTargets.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      )}
      {canApprove && (
        <button
          onClick={() => act("send-back", selectedChangeTargetRole)}
          className="w-full rounded-xl bg-amber-600 px-4 py-2 font-semibold text-white"
        >
          Request changes
        </button>
      )}
      {canApprove && (
        <button
          onClick={() => act("reject")}
          className="w-full rounded-xl bg-red-800 px-4 py-2 font-semibold text-white"
        >
          Reject
        </button>
      )}
      {canSubmit && (
        <button
          onClick={() => act("submit", selectedTargetRole)}
          className="w-full rounded-xl bg-green-600 px-4 py-2 font-semibold text-white"
        >
          Submit for approval
        </button>
      )}
      {canEdit && (
        <button
          onClick={edit}
          className="w-full rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white"
        >
          Edit draft
        </button>
      )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <p className="text-xs font-semibold uppercase text-gray-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{value || "-"}</p>
    </div>
  );
}

function SectionRead({ title }: { title: string }) {
  return <h3 className="border-t border-gray-200 pt-4 font-bold text-gray-900 md:col-span-2">{title}</h3>;
}

function PeopleRead({ title, rows }: { title: string; rows: PersonRow[] }) {
  return (
    <div className="md:col-span-2">
      <p className="text-sm font-bold text-gray-900">{title}</p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-gray-500">
            <tr>
              <th className="py-2">Position</th>
              <th>Name</th>
              <th>Reg. No.</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${title}-${index}`} className="border-t border-gray-200">
                <td className="py-2">{row.position || "-"}</td>
                <td>{row.name || "-"}</td>
                <td>{row.reg_no || "-"}</td>
                <td>{row.signature || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanRead({ rows }: { rows: ActivityRow[] }) {
  return (
    <div className="md:col-span-2">
      <p className="text-sm font-bold text-gray-900">Proposed Activity Plan for the Next Year</p>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {rows.map((row) => (
          <Detail key={row.month} label={row.month} value={row.activity} />
        ))}
      </div>
    </div>
  );
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
      {children}
    </span>
  );
}
