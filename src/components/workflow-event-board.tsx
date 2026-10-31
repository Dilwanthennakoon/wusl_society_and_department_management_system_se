"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EVENT_TYPES } from "@/lib/event-types";

type Entity = {
  society_id?: number;
  society_name?: string;
  department_id?: number;
  department_name?: string;
};

type WorkflowEvent = {
  event_id: number;
  event_name: string;
  event_description: string | null;
  event_type: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  academic_year: string | null;
  applicant_name: string | null;
  applicant_phone: string | null;
  applicant_position: string | null;
  applicant_address: string | null;
  permission_purpose: string | null;
  rehearsal_date: string | null;
  rehearsal_start_time: string | null;
  rehearsal_end_time: string | null;
  preparation_date: string | null;
  preparation_start_time: string | null;
  preparation_end_time: string | null;
  cleanup_start_time: string | null;
  cleanup_end_time: string | null;
  continues_after_8pm: boolean | null;
  hall_warden_permission_details: string | null;
  outside_participants: boolean | null;
  outside_participants_details: string | null;
  facility_permission_date: string | null;
  applicant_signature: string | null;
  applicant_student_reg_no: string | null;
  event_status: string;
  change_request: string | null;
  society?: { society_id: number; society_name: string } | null;
  department?: { department_id: number; department_name: string } | null;
  admin?: { admin_name: string; admin_role: string | null };
  images?: {
    image_id: number;
    file_name: string | null;
    media_type: string;
    mime_type: string | null;
    file_size: number | null;
  }[];
  reviews?: {
    review_id: number;
    action: string;
    from_status: string | null;
    to_status: string;
    remarks: string | null;
    reviewed_at: string;
    admin: { admin_name: string; admin_role: string | null };
  }[];
};

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-blue-600";

const societyApplicationReviewRoles = [
  "Treasurer",
  "Registrar",
  "Student Counsellor",
  "Department Head",
  "Dean",
  "Vice-Chancellor",
];

const societyCompletionReviewRoles = ["Faculty Web Coordinator"];

const departmentReviewRoles = [
  "Department Head",
  "Registrar",
  "Dean",
  "Vice-Chancellor",
];

const departmentCompletionReviewRoles = ["Faculty Web Coordinator"];

export type WorkflowEventBoardMode =
  | "all"
  | "create"
  | "events"
  | "approved"
  | "completed"
  | "published"
  | "completion"
  | "changes"
  | "approvals"
  | "review";

type EventForm = {
  entity_id: string;
  event_name: string;
  event_description: string;
  event_type: string;
  event_date: string;
  event_time: string;
  event_end_time: string;
  venue: string;
  academic_year: string;
  applicant_name: string;
  applicant_phone: string;
  applicant_position: string;
  applicant_address: string;
  permission_purpose: string;
  rehearsal_date: string;
  rehearsal_start_time: string;
  rehearsal_end_time: string;
  preparation_date: string;
  preparation_start_time: string;
  preparation_end_time: string;
  cleanup_start_time: string;
  cleanup_end_time: string;
  continues_after_8pm: string;
  hall_warden_permission_details: string;
  outside_participants: string;
  outside_participants_details: string;
  facility_permission_date: string;
  applicant_signature: string;
  applicant_student_reg_no: string;
};

const emptyForm: EventForm = {
  entity_id: "",
  event_name: "",
  event_description: "",
  event_type: "",
  event_date: "",
  event_time: "",
  event_end_time: "",
  venue: "",
  academic_year: "",
  applicant_name: "",
  applicant_phone: "",
  applicant_position: "",
  applicant_address: "",
  permission_purpose: "",
  rehearsal_date: "",
  rehearsal_start_time: "",
  rehearsal_end_time: "",
  preparation_date: "",
  preparation_start_time: "",
  preparation_end_time: "",
  cleanup_start_time: "",
  cleanup_end_time: "",
  continues_after_8pm: "false",
  hall_warden_permission_details: "",
  outside_participants: "false",
  outside_participants_details: "",
  facility_permission_date: "",
  applicant_signature: "",
  applicant_student_reg_no: "",
};

const createFormPhases = [
  {
    title: "Phase 1",
    description: "Applicant",
  },
  {
    title: "Phase 2",
    description: "Event details",
  },
  {
    title: "Phase 3",
    description: "Schedule and permissions",
  },
] as const;

function draftStorageKey(workflow: "Society" | "Department", role: string) {
  return `workflow-event-create-draft:${workflow}:${role}`;
}

function clampPhase(value: unknown) {
  const phase = Number(value);
  if (!Number.isFinite(phase)) return 0;
  return Math.min(Math.max(Math.trunc(phase), 0), createFormPhases.length - 1);
}

function hasEventFormDraft(form: EventForm) {
  return (Object.keys(emptyForm) as (keyof EventForm)[]).some(
    (key) => form[key] !== emptyForm[key],
  );
}

function phaseComplete(
  workflow: "Society" | "Department",
  phase: number,
  form: EventForm,
) {
  const applicantFields: (keyof EventForm)[] =
    workflow === "Society"
      ? [
          "entity_id",
          "academic_year",
          "applicant_name",
          "applicant_phone",
          "applicant_position",
          "applicant_address",
        ]
      : [
          "entity_id",
          "applicant_name",
          "applicant_phone",
          "applicant_position",
          "applicant_address",
        ];
  const fieldsByPhase: (keyof EventForm)[][] = [
    applicantFields,
    [
      "event_name",
      "event_type",
      "permission_purpose",
      "event_date",
      "event_time",
      "event_end_time",
    ],
    ["venue", "applicant_signature", "applicant_student_reg_no"],
  ];
  const requiredFields = fieldsByPhase[phase] || [];
  const basicsComplete = requiredFields.every((key) => form[key].trim());
  if (phase !== 2) return basicsComplete;
  if (
    form.continues_after_8pm === "true" &&
    !form.hall_warden_permission_details.trim()
  ) {
    return false;
  }
  if (
    form.outside_participants === "true" &&
    !form.outside_participants_details.trim()
  ) {
    return false;
  }
  return basicsComplete;
}

function datePart(value: string | null | undefined) {
  return value?.split("T")[0] || "";
}

function timePart(value: string | null | undefined) {
  return value ? new Date(value).toISOString().slice(11, 16) : "";
}

function buildDateTime(date: string, time: string) {
  return date && time ? new Date(`${date}T${time}`).toISOString() : "";
}

function todayInputDate() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

const indexNumberPattern = "[A-Za-z0-9/-]+";
const indexNumberTitle =
  "Use letters, numbers, slash, or hyphen without spaces";

function appendEventForm(body: FormData, form: EventForm) {
  body.set("event_name", form.event_name);
  body.set("event_description", form.event_description);
  body.set("event_type", form.event_type);
  body.set("event_date", form.event_date);
  const startTime = buildDateTime(form.event_date, form.event_time);
  const endTime = buildDateTime(form.event_date, form.event_end_time);
  if (startTime) body.set("start_time", startTime);
  if (endTime) body.set("end_time", endTime);
  body.set("venue", form.venue);
  body.set("academic_year", form.academic_year);
  body.set("applicant_name", form.applicant_name);
  body.set("applicant_phone", form.applicant_phone);
  body.set("applicant_position", form.applicant_position);
  body.set("applicant_address", form.applicant_address);
  body.set("permission_purpose", form.permission_purpose);
  body.set("rehearsal_date", form.rehearsal_date);
  const rehearsalStart = buildDateTime(
    form.rehearsal_date,
    form.rehearsal_start_time,
  );
  const rehearsalEnd = buildDateTime(
    form.rehearsal_date,
    form.rehearsal_end_time,
  );
  if (rehearsalStart) body.set("rehearsal_start_time", rehearsalStart);
  if (rehearsalEnd) body.set("rehearsal_end_time", rehearsalEnd);
  body.set("preparation_date", form.preparation_date);
  const preparationStart = buildDateTime(
    form.preparation_date,
    form.preparation_start_time,
  );
  const preparationEnd = buildDateTime(
    form.preparation_date,
    form.preparation_end_time,
  );
  if (preparationStart) body.set("preparation_start_time", preparationStart);
  if (preparationEnd) body.set("preparation_end_time", preparationEnd);
  const cleanupStart = buildDateTime(form.event_date, form.cleanup_start_time);
  const cleanupEnd = buildDateTime(form.event_date, form.cleanup_end_time);
  if (cleanupStart) body.set("cleanup_start_time", cleanupStart);
  if (cleanupEnd) body.set("cleanup_end_time", cleanupEnd);
  body.set("continues_after_8pm", form.continues_after_8pm);
  body.set(
    "hall_warden_permission_details",
    form.hall_warden_permission_details,
  );
  body.set("outside_participants", form.outside_participants);
  body.set("outside_participants_details", form.outside_participants_details);
  body.set("facility_permission_date", form.facility_permission_date);
  body.set("applicant_signature", form.applicant_signature);
  body.set("applicant_student_reg_no", form.applicant_student_reg_no);
}

export default function WorkflowEventBoard({
  workflow,
  role,
  title,
  description,
  canCreate = false,
  mode = "all",
}: {
  workflow: "Society" | "Department";
  role: string;
  title: string;
  description: string;
  canCreate?: boolean;
  mode?: WorkflowEventBoardMode;
}) {
  const [events, setEvents] = useState<WorkflowEvent[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [createPhase, setCreatePhase] = useState(0);
  const [draftStatus, setDraftStatus] = useState("");
  const [viewingEvent, setViewingEvent] = useState<WorkflowEvent | null>(null);
  const formDraftKey = useMemo(
    () => draftStorageKey(workflow, role),
    [role, workflow],
  );
  const showCreateForm = canCreate && (mode === "all" || mode === "create");
  const showEventList = mode !== "create";
  const showStats = mode !== "create";

  const loadEvents = useCallback(async () => {
    const response = await fetch(`/api/workflow/events?workflow=${workflow}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to load events");
    setEvents(data);
  }, [workflow]);

  useEffect(() => {
    async function load() {
      try {
        const requests: Promise<Response>[] = [
          fetch(`/api/workflow/events?workflow=${workflow}`, {
            cache: "no-store",
          }),
        ];
        if (canCreate) {
          requests.push(
            fetch(workflow === "Society" ? "/api/societies" : "/api/departments"),
          );
        }
        const responses = await Promise.all(requests);
        const eventData = await responses[0].json();
        if (!responses[0].ok) {
          throw new Error(eventData.message || "Failed to load events");
        }
        setEvents(eventData);
        if (responses[1]) setEntities(await responses[1].json());
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [canCreate, workflow]);

  useEffect(() => {
    if (!showCreateForm) return;
    const timeout = window.setTimeout(() => {
      try {
        const rawDraft = window.localStorage.getItem(formDraftKey);
        if (!rawDraft) return;
        const draft = JSON.parse(rawDraft) as {
          form?: Partial<EventForm>;
          phase?: number;
        };
        if (!draft.form) return;
        setForm({ ...emptyForm, ...draft.form });
        setCreatePhase(clampPhase(draft.phase));
        setDraftStatus("Draft restored on this device.");
      } catch {
        window.localStorage.removeItem(formDraftKey);
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [formDraftKey, showCreateForm]);

  useEffect(() => {
    if (!showCreateForm || !hasEventFormDraft(form)) return;
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(
          formDraftKey,
          JSON.stringify({
            form,
            phase: createPhase,
            savedAt: new Date().toISOString(),
          }),
        );
        setDraftStatus("Draft saved on this device.");
      } catch {
        setDraftStatus("Draft could not be saved in this browser.");
      }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [createPhase, form, formDraftKey, showCreateForm]);

  const visibleEvents = useMemo(
    () =>
      events.filter((event) =>
        eventMatchesMode(event, {
          mode,
          role,
          workflow,
        }),
      ),
    [events, mode, role, workflow],
  );

  const stats = useMemo(
    () => ({
      total: visibleEvents.length,
      drafts: visibleEvents.filter((event) => event.event_status === "Draft")
        .length,
      pending: visibleEvents.filter((event) =>
        event.event_status.startsWith("Pending"),
      ).length,
      changes: visibleEvents.filter((event) =>
        event.event_status.startsWith("Changes Requested"),
      ).length,
      published: visibleEvents.filter(
        (event) => event.event_status === "Published",
      ).length,
    }),
    [visibleEvents],
  );

  async function createEvent(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    const body = new FormData();
    body.set("workflow_type", workflow);
    body.set(
      workflow === "Society" ? "society_id" : "department_id",
      form.entity_id,
    );
    appendEventForm(body, form);
    const response = await fetch("/api/workflow/events", {
      method: "POST",
      body,
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Failed to create event");
      return;
    }
    setMessage(
      workflow === "Society"
        ? "Event created and sent to Treasurer for approval."
        : "Event submitted successfully.",
    );
    setForm(emptyForm);
    setCreatePhase(0);
    window.localStorage.removeItem(formDraftKey);
    setDraftStatus("");
    await loadEvents();
  }

  function clearCreateDraft() {
    window.localStorage.removeItem(formDraftKey);
    setForm(emptyForm);
    setCreatePhase(0);
    setDraftStatus("Draft cleared.");
  }

  function saveCreateDraftNow() {
    window.localStorage.setItem(
      formDraftKey,
      JSON.stringify({
        form,
        phase: createPhase,
        savedAt: new Date().toISOString(),
      }),
    );
    setDraftStatus("Draft saved on this device.");
  }

  async function performAction(
    eventId: number,
    action:
      | "approve"
      | "final-approve"
      | "request-change"
      | "publish"
      | "resubmit"
      | "submit"
      | "send-back"
      | "reject",
    targetRole?: string,
  ) {
    setMessage("");
    const response = await fetch(`/api/workflow/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        remarks: remarks[eventId] || undefined,
        target_role: targetRole || undefined,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.message || "Action failed");
      return;
    }
    setRemarks((current) => ({ ...current, [eventId]: "" }));
    setMessage("Workflow updated successfully.");
    await loadEvents();
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 md:p-8">
      <header className="rounded-3xl bg-gradient-to-r from-slate-950 to-blue-800 p-8 text-white shadow-lg">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-200">
          {workflow} workflow · {role}
        </p>
        <h1 className="mt-2 text-3xl font-bold">{title}</h1>
        <p className="mt-3 max-w-3xl text-blue-100">{description}</p>
      </header>

      {showStats && (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Total" value={stats.total} />
          <Stat label="Drafts" value={stats.drafts} />
          <Stat label="Pending" value={stats.pending} />
          <Stat label="Published" value={stats.published} />
        </section>
      )}

      {message && (
        <p className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
          {message}
        </p>
      )}

      {showCreateForm && (
        <StagedCreateForm
          workflow={workflow}
          entities={entities}
          form={form}
          setForm={setForm}
          phase={createPhase}
          setPhase={setCreatePhase}
          draftStatus={draftStatus}
          onSaveDraft={saveCreateDraftNow}
          onClearDraft={clearCreateDraft}
          onSubmit={createEvent}
        />
      )}

      {showEventList && (
      <section className="mt-6 grid gap-4 xl:grid-cols-2">
        {loading ? (
          <p className="rounded-2xl bg-white p-6 text-gray-600">Loading…</p>
        ) : visibleEvents.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-gray-600">
            No workflow events found for this tab.
          </p>
        ) : (
          visibleEvents.map((event) => (
            <article
              key={event.event_id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{event.event_status}</Badge>
                    <Badge>
                      {event.society?.society_name ||
                        event.department?.department_name ||
                        workflow}
                    </Badge>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-gray-900">
                    {event.event_name}
                  </h2>
                  <p className="mt-2 text-gray-600">
                    {event.event_description ||
                      event.permission_purpose ||
                      "No description yet"}
                  </p>
                  <p className="mt-3 text-sm text-gray-500">
                    {event.event_date
                      ? new Date(event.event_date).toLocaleDateString()
                      : "No date"}{" "}
                    · {event.venue || "No venue"} · Created by{" "}
                    {event.admin?.admin_name}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Badge>
                      {
                        event.images?.filter(
                          (item) => item.media_type === "Image",
                        ).length
                      }{" "}
                      photos
                    </Badge>
                    <Badge>
                      {
                        event.images?.filter(
                          (item) => item.media_type === "Video",
                        ).length
                      }{" "}
                      videos
                    </Badge>
                  </div>
                  {event.change_request && (
                    <p className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
                      Latest comment/request: {event.change_request}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setViewingEvent(event)}
                    className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-800"
                  >
                    View full details
                  </button>
                  {event.reviews && event.reviews.length > 0 && (
                    <p className="mt-3 text-xs text-gray-500">
                      Latest action: {event.reviews[0].action} by{" "}
                      {event.reviews[0].admin.admin_name}
                    </p>
                  )}
                </div>
                <ActionPanel
                  event={event}
                  role={role}
                  remarks={remarks[event.event_id] || ""}
                  setRemarks={(value) =>
                    setRemarks((current) => ({
                      ...current,
                      [event.event_id]: value,
                    }))
                  }
                  act={(action, targetRole) =>
                    performAction(event.event_id, action, targetRole)
                  }
                  workflow={workflow}
                  entities={entities}
                  onSaved={async (text) => {
                    setMessage(text);
                    await loadEvents();
                  }}
                />
              </div>
            </article>
          ))
        )}
      </section>
      )}
      {viewingEvent && (
        <EventDetailsModal
          event={viewingEvent}
          workflow={workflow}
          onClose={() => setViewingEvent(null)}
        />
      )}
    </div>
  );
}

function eventMatchesMode(
  event: WorkflowEvent,
  {
    mode,
    role,
    workflow,
  }: {
    mode: WorkflowEventBoardMode;
    role: string;
    workflow: "Society" | "Department";
  },
) {
  const status = event.event_status;

  if (mode === "create" || mode === "all" || mode === "events") return true;
  if (mode === "approved") return status === "Event Approved";
  if (mode === "completed") {
    return (
      status.includes("Completion Approval") ||
      status.startsWith("Completion Changes Requested") ||
      status.startsWith("Department Completion Changes Requested") ||
      status === "Published"
    );
  }
  if (mode === "published") return status === "Published";
  if (mode === "completion") {
    return (
      status === "Event Approved" ||
      status.includes("Completion Approval") ||
      status.startsWith("Completion Changes Requested") ||
      status.startsWith("Department Completion Changes Requested") ||
      status === "Published"
    );
  }
  if (mode === "changes") return status.includes("Changes Requested");
  if (mode === "approvals") {
    return isActionableForRole(status, role, workflow);
  }
  if (mode === "review") {
    if (workflow === "Department") return status !== "Published";
    return true;
  }

  return true;
}

function isActionableForRole(
  status: string,
  role: string,
  workflow: "Society" | "Department",
) {
  if (workflow === "Department") {
    return (
      (role === "Department Head" &&
        (status === "Pending Department Head Application Approval" ||
          status === "Pending Department Head Approval")) ||
      (role === "Registrar" &&
        (status === "Pending Registrar Application Approval" ||
          status === "Pending Registrar Approval")) ||
      (role === "Dean" &&
        (status === "Pending Dean Application Approval" ||
          status === "Pending Dean Approval")) ||
      (role === "Vice-Chancellor" &&
        (status === "Pending Vice-Chancellor Application Approval" ||
          status === "Pending Vice-Chancellor Approval")) ||
      (role === "Faculty Web Coordinator" &&
        (status === "Pending Faculty Web Coordinator Completion Approval" ||
          status === "Pending Faculty Web Coordinator Approval"))
    );
  }

  return (
    (role === "Treasurer" &&
      status === "Pending Treasurer Application Approval") ||
    (role === "Registrar" &&
      status === "Pending Registrar Application Approval") ||
    (role === "Student Counsellor" &&
      status === "Pending Student Counsellor Application Approval") ||
    (role === "Department Head" &&
      status === "Pending Department Head Application Approval") ||
    (role === "Dean" &&
      status === "Pending Dean Application Approval") ||
    (role === "Vice-Chancellor" &&
      status === "Pending Vice-Chancellor Application Approval") ||
    (role === "Faculty Web Coordinator" &&
      status === "Pending Faculty Web Coordinator Completion Approval")
  );
}

function eventApprovalStage(
  workflow: "Society" | "Department",
  status: string,
) {
  if (workflow === "Society") {
    if (status === "Draft" || status.includes("Application Approval")) {
      return "application";
    }
    if (
      status === "Event Approved" ||
      status.includes("Completion Approval") ||
      status.startsWith("Completion Changes Requested")
    ) {
      return "completion";
    }
  }
  if (workflow === "Department") {
    if (status.includes("Application Approval")) return "application";
    if (
      status === "Event Approved" ||
      status.includes("Completion Approval") ||
      status.startsWith("Department Completion Changes Requested")
    ) {
      return "completion";
    }
    if (status.startsWith("Department Application Changes Requested")) {
      return "application";
    }
    return "department";
  }
  return null;
}

function reviewRolesForEvent(
  workflow: "Society" | "Department",
  status: string,
) {
  const stage = eventApprovalStage(workflow, status);
  if (workflow === "Society" && stage === "application") {
    return societyApplicationReviewRoles;
  }
  if (workflow === "Society" && stage === "completion") {
    return societyCompletionReviewRoles;
  }
  if (workflow === "Department" && stage === "application") {
    return departmentReviewRoles;
  }
  if (workflow === "Department" && stage === "completion") {
    return departmentCompletionReviewRoles;
  }
  return departmentCompletionReviewRoles;
}

function forwardReviewTargets(roles: string[], role: string) {
  const currentIndex = roles.indexOf(role);
  return currentIndex === -1 ? roles : roles.slice(currentIndex + 1);
}

function changeRequestRole(status: string) {
  const match = status.match(/Changes Requested by (.+)$/);
  return match?.[1] || null;
}

function resubmitTargetsForEvent(
  workflow: "Society" | "Department",
  status: string,
) {
  const targetRole = changeRequestRole(status);
  if (!targetRole) return [];

  if (workflow === "Society") {
    return [
      ...societyApplicationReviewRoles,
      ...societyCompletionReviewRoles,
    ].includes(targetRole)
      ? [targetRole]
      : [];
  }

  return [
    ...departmentReviewRoles,
    ...departmentCompletionReviewRoles,
  ].includes(targetRole)
    ? [targetRole]
    : [];
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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-t border-gray-200 pt-4 text-base font-bold text-gray-900 md:col-span-2">
      {children}
    </h3>
  );
}

function StagedCreateForm({
  workflow,
  entities,
  form,
  setForm,
  phase,
  setPhase,
  draftStatus,
  onSaveDraft,
  onClearDraft,
  onSubmit,
}: {
  workflow: "Society" | "Department";
  entities: Entity[];
  form: EventForm;
  setForm: (form: EventForm) => void;
  phase: number;
  setPhase: (phase: number) => void;
  draftStatus: string;
  onSaveDraft: () => void;
  onClearDraft: () => void;
  onSubmit: (event: React.FormEvent) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const lastPhase = createFormPhases.length - 1;
  const submitLabel =
    workflow === "Society" ? "Create & send for approval" : "Submit event";

  function goToNextPhase() {
    if (!formRef.current?.reportValidity()) return;
    onSaveDraft();
    setPhase(Math.min(phase + 1, lastPhase));
  }

  function goToPreviousPhase() {
    onSaveDraft();
    setPhase(Math.max(phase - 1, 0));
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="mt-6 rounded-2xl bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Create event application
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Complete one phase at a time. Your progress is saved as a draft on
            this device.
          </p>
          {draftStatus && (
            <p className="mt-2 text-sm font-semibold text-blue-700">
              {draftStatus}
            </p>
          )}
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          {createFormPhases.map((item, index) => {
            const isCurrent = index === phase;
            const isDone = phaseComplete(workflow, index, form);
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => index <= phase && setPhase(index)}
                disabled={index > phase}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                  isCurrent
                    ? "border-blue-700 bg-blue-700 text-white"
                    : isDone
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-gray-200 bg-gray-50 text-gray-600"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span className="block font-bold">{item.title}</span>
                <span>{item.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {phase === 0 && (
          <ApplicantPhaseFields
            workflow={workflow}
            entities={entities}
            form={form}
            setForm={setForm}
          />
        )}
        {phase === 1 && (
          <EventDetailsPhaseFields
            workflow={workflow}
            form={form}
            setForm={setForm}
          />
        )}
        {phase === 2 && (
          <SocietyApplicationFields
            form={form}
            setForm={setForm}
            startNumber={workflow === "Society" ? 8 : 7}
          />
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={goToPreviousPhase}
            disabled={phase === 0}
            className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={onClearDraft}
            className="rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-700"
          >
            Clear draft
          </button>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onSaveDraft}
            className="rounded-xl border border-blue-200 px-5 py-3 font-semibold text-blue-700"
          >
            Save draft
          </button>
          {phase < lastPhase ? (
            <button
              type="button"
              onClick={goToNextPhase}
              className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white"
            >
              Next phase
            </button>
          ) : (
            <button className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white">
              {submitLabel}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

function ApplicantPhaseFields({
  workflow,
  entities,
  form,
  setForm,
}: {
  workflow: "Society" | "Department";
  entities: Entity[];
  form: EventForm;
  setForm: (form: EventForm) => void;
}) {
  const isSociety = workflow === "Society";
  return (
    <>
      <SectionHeading>
        A. Details of the {isSociety ? "Society" : "Department"} and Applicant
      </SectionHeading>
      <Field label={`1. Name of the ${isSociety ? "Society" : "Department"}`}>
        <select
          value={form.entity_id}
          onChange={(event) =>
            setForm({ ...form, entity_id: event.target.value })
          }
          required
          className={inputClass}
        >
          <option value="">
            Select {isSociety ? "society" : "department"}
          </option>
          {entities.map((entity) => {
            const id = isSociety ? entity.society_id : entity.department_id;
            return (
              <option key={id} value={id}>
                {isSociety ? entity.society_name : entity.department_name}
              </option>
            );
          })}
        </select>
      </Field>
      {isSociety && (
        <Field label="2. Academic Year for which the Society is Registered">
          <input
            value={form.academic_year}
            onChange={(event) =>
              setForm({ ...form, academic_year: event.target.value })
            }
            required
            className={inputClass}
          />
        </Field>
      )}
      <Field label={`${isSociety ? "3" : "2"}. Name of the Applicant`}>
        <input
          value={form.applicant_name}
          onChange={(event) =>
            setForm({ ...form, applicant_name: event.target.value })
          }
          required
          className={inputClass}
        />
      </Field>
      <Field label="Telephone Number">
        <input
          type="tel"
          inputMode="numeric"
          pattern="[0-9]+"
          value={form.applicant_phone}
          onChange={(event) =>
            setForm({ ...form, applicant_phone: digitsOnly(event.target.value) })
          }
          required
          className={inputClass}
        />
      </Field>
      <Field
        label={`${isSociety ? "4" : "3"}. Position currently held by the Applicant in the ${isSociety ? "Society" : "Department"}`}
      >
        <input
          value={form.applicant_position}
          onChange={(event) =>
            setForm({ ...form, applicant_position: event.target.value })
          }
          required
          className={inputClass}
        />
      </Field>
      <Field label={`${isSociety ? "5" : "4"}. Personal Address of the Applicant`} wide>
        <textarea
          value={form.applicant_address}
          onChange={(event) =>
            setForm({ ...form, applicant_address: event.target.value })
          }
          required
          rows={3}
          className={inputClass}
        />
      </Field>
    </>
  );
}

function EventDetailsPhaseFields({
  workflow,
  form,
  setForm,
}: {
  workflow: "Society" | "Department";
  form: EventForm;
  setForm: (form: EventForm) => void;
}) {
  const dateNumber = workflow === "Society" ? 7 : 6;
  return (
    <>
      <SectionHeading>B. Details of the Event / Programme</SectionHeading>
      <Field label="Event / Programme Name">
        <input
          value={form.event_name}
          onChange={(event) =>
            setForm({ ...form, event_name: event.target.value })
          }
          required
          className={inputClass}
        />
      </Field>
      <Field label="Event / Programme Type">
        <EventTypeSelect form={form} setForm={setForm} />
      </Field>
      <Field
        label={`${workflow === "Society" ? "6" : "5"}. Purpose for which permission is requested`}
        wide
      >
        <textarea
          value={form.permission_purpose}
          onChange={(event) =>
            setForm({ ...form, permission_purpose: event.target.value })
          }
          required
          rows={3}
          className={inputClass}
        />
      </Field>
      <Field label={`${dateNumber}. Date of the Event / Programme`}>
        <input
          type="date"
          min={todayInputDate()}
          value={form.event_date}
          onChange={(event) =>
            setForm({ ...form, event_date: event.target.value })
          }
          required
          className={inputClass}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Time: From">
          <input
            type="time"
            value={form.event_time}
            onChange={(event) =>
              setForm({ ...form, event_time: event.target.value })
            }
            required
            className={inputClass}
          />
        </Field>
        <Field label="Time: To">
          <input
            type="time"
            value={form.event_end_time}
            onChange={(event) =>
              setForm({ ...form, event_end_time: event.target.value })
            }
            required
            className={inputClass}
          />
        </Field>
      </div>
    </>
  );
}

function EventTypeSelect({
  form,
  setForm,
}: {
  form: EventForm;
  setForm: (form: EventForm) => void;
}) {
  return (
    <select
      value={form.event_type}
      onChange={(event) =>
        setForm({ ...form, event_type: event.target.value })
      }
      required
      className={inputClass}
    >
      <option value="">Select event type</option>
      {EVENT_TYPES.map((eventType) => (
        <option key={eventType} value={eventType}>
          {eventType}
        </option>
      ))}
    </select>
  );
}

function SocietyApplicationFields({
  form,
  setForm,
  startNumber = 8,
}: {
  form: EventForm;
  setForm: (form: EventForm) => void;
  startNumber?: number;
}) {
  return (
    <>
      <SectionHeading>
        {startNumber}. Dates and times required for rehearsals and other preparations
      </SectionHeading>
      <Field label="Rehearsals - Date">
        <input
          type="date"
          min={todayInputDate()}
          value={form.rehearsal_date}
          onChange={(event) =>
            setForm({ ...form, rehearsal_date: event.target.value })
          }
          className={inputClass}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Rehearsals - Time: From">
          <input
            type="time"
            value={form.rehearsal_start_time}
            onChange={(event) =>
              setForm({ ...form, rehearsal_start_time: event.target.value })
            }
            className={inputClass}
          />
        </Field>
        <Field label="Rehearsals - Time: To">
          <input
            type="time"
            value={form.rehearsal_end_time}
            onChange={(event) =>
              setForm({ ...form, rehearsal_end_time: event.target.value })
            }
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Decorations and other preparations - Date">
        <input
          type="date"
          min={todayInputDate()}
          value={form.preparation_date}
          onChange={(event) =>
            setForm({ ...form, preparation_date: event.target.value })
          }
          className={inputClass}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Decorations and preparations - Time: From">
          <input
            type="time"
            value={form.preparation_start_time}
            onChange={(event) =>
              setForm({ ...form, preparation_start_time: event.target.value })
            }
            className={inputClass}
          />
        </Field>
        <Field label="Decorations and preparations - Time: To">
          <input
            type="time"
            value={form.preparation_end_time}
            onChange={(event) =>
              setForm({ ...form, preparation_end_time: event.target.value })
            }
            className={inputClass}
          />
        </Field>
      </div>

      <SectionHeading>
        {startNumber + 1}. Time required after the event for removing decorations and completing
        other work
      </SectionHeading>
      <Field label="From">
        <input
          type="time"
          value={form.cleanup_start_time}
          onChange={(event) =>
            setForm({ ...form, cleanup_start_time: event.target.value })
          }
          className={inputClass}
        />
      </Field>
      <Field label="To">
        <input
          type="time"
          value={form.cleanup_end_time}
          onChange={(event) =>
            setForm({ ...form, cleanup_end_time: event.target.value })
          }
          className={inputClass}
        />
      </Field>

      <SectionHeading>
        {startNumber + 2}. Will the event/programme continue after 8.00 p.m.?
      </SectionHeading>
      <Field label="Continue after 8.00 p.m.">
        <select
          value={form.continues_after_8pm}
          onChange={(event) => {
            const value = event.target.value;
            setForm({
              ...form,
              continues_after_8pm: value,
              hall_warden_permission_details:
                value === "true" ? form.hall_warden_permission_details : "",
            });
          }}
          className={inputClass}
        >
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </Field>
      <Field label="Details of permission, when applicable" wide>
        <textarea
          value={form.hall_warden_permission_details}
          onChange={(event) =>
            setForm({
              ...form,
              hall_warden_permission_details: event.target.value,
            })
          }
          rows={3}
          required={form.continues_after_8pm === "true"}
          disabled={form.continues_after_8pm !== "true"}
          className={inputClass}
        />
      </Field>

      <SectionHeading>
        {startNumber + 3}. Will persons from outside the University participate in the
        event/programme?
      </SectionHeading>
      <Field label="Outside participants">
        <select
          value={form.outside_participants}
          onChange={(event) => {
            const value = event.target.value;
            setForm({
              ...form,
              outside_participants: value,
              outside_participants_details:
                value === "true" ? form.outside_participants_details : "",
            });
          }}
          className={inputClass}
        >
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
      </Field>
      <Field
        label="Outside participant details / attached list note"
        wide
      >
        <textarea
          value={form.outside_participants_details}
          onChange={(event) =>
            setForm({
              ...form,
              outside_participants_details: event.target.value,
            })
          }
          rows={3}
          required={form.outside_participants === "true"}
          disabled={form.outside_participants !== "true"}
          className={inputClass}
        />
      </Field>

      <SectionHeading>
        {startNumber + 4}. Venue of the Event / Programme
      </SectionHeading>
      <Field label="Venue of the Event / Programme" wide>
        <textarea
          value={form.venue}
          onChange={(event) => setForm({ ...form, venue: event.target.value })}
          required
          rows={2}
          className={inputClass}
        />
      </Field>
      <Field label="Date">
        <input
          type="date"
          min={todayInputDate()}
          value={form.facility_permission_date}
          onChange={(event) =>
            setForm({ ...form, facility_permission_date: event.target.value })
          }
          className={inputClass}
        />
      </Field>
      <Field label="Signature of the Applicant">
        <input
          value={form.applicant_signature}
          onChange={(event) =>
            setForm({ ...form, applicant_signature: event.target.value })
          }
          required
          className={inputClass}
        />
      </Field>
      <Field label="Student Registration Number">
        <input
          value={form.applicant_student_reg_no}
          onChange={(event) =>
            setForm({ ...form, applicant_student_reg_no: event.target.value })
          }
          required
          pattern={indexNumberPattern}
          title={indexNumberTitle}
          className={inputClass}
        />
      </Field>
    </>
  );
}

function displayDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleDateString() : "-";
}

function displayTime(value: string | null | undefined) {
  return value
    ? new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
}

function yesNo(value: boolean | null | undefined) {
  if (value === null || value === undefined) return "-";
  return value ? "Yes" : "No";
}

function DetailItem({
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
      <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
        {value || "-"}
      </p>
    </div>
  );
}

function ApplicationDetails({
  event,
  workflow,
}: {
  event: WorkflowEvent;
  workflow: "Society" | "Department";
}) {
  const isSociety = workflow === "Society";
  const entityName = isSociety
    ? event.society?.society_name
    : event.department?.department_name;
  const detailStartNumber = isSociety ? 8 : 7;
  return (
      <div className="grid gap-4 md:grid-cols-2">
        <h3 className="font-bold text-gray-900 md:col-span-2">
          A. Details of the {isSociety ? "Society" : "Department"} and Applicant
        </h3>
        <DetailItem
          label={`1. Name of the ${isSociety ? "Society" : "Department"}`}
          value={entityName}
        />
        {isSociety && (
          <DetailItem
            label="2. Academic Year for which the Society is Registered"
            value={event.academic_year}
          />
        )}
        <DetailItem
          label={`${isSociety ? 3 : 2}. Name of the Applicant`}
          value={event.applicant_name}
        />
        <DetailItem label="Telephone Number" value={event.applicant_phone} />
        <DetailItem
          label={`${isSociety ? 4 : 3}. Position currently held by the Applicant in the ${isSociety ? "Society" : "Department"}`}
          value={event.applicant_position}
        />
        <DetailItem
          label={`${isSociety ? 5 : 4}. Personal Address of the Applicant`}
          value={event.applicant_address}
          wide
        />

        <h3 className="border-t border-gray-200 pt-4 font-bold text-gray-900 md:col-span-2">
          B. Details of the Event / Programme
        </h3>
        <DetailItem label="Event / Programme Name" value={event.event_name} />
        <DetailItem label="Event / Programme Type" value={event.event_type} />
        <DetailItem
          label={`${isSociety ? 6 : 5}. Purpose for which permission is requested`}
          value={event.permission_purpose}
          wide
        />
        <DetailItem
          label={`${isSociety ? 7 : 6}. Date of the Event / Programme`}
          value={displayDate(event.event_date)}
        />
        <DetailItem
          label="Time"
          value={`${displayTime(event.start_time)} to ${displayTime(event.end_time)}`}
        />
        <DetailItem label="Rehearsals - Date" value={displayDate(event.rehearsal_date)} />
        <DetailItem
          label="Rehearsals - Time"
          value={`${displayTime(event.rehearsal_start_time)} to ${displayTime(
            event.rehearsal_end_time,
          )}`}
        />
        <DetailItem
          label="Decorations and other preparations - Date"
          value={displayDate(event.preparation_date)}
        />
        <DetailItem
          label="Decorations and preparations - Time"
          value={`${displayTime(event.preparation_start_time)} to ${displayTime(
            event.preparation_end_time,
          )}`}
        />
        <DetailItem
          label={`${detailStartNumber + 1}. Time required after event`}
          value={`${displayTime(event.cleanup_start_time)} to ${displayTime(
            event.cleanup_end_time,
          )}`}
        />
        <DetailItem
          label={`${detailStartNumber + 2}. Continue after 8.00 p.m.`}
          value={yesNo(event.continues_after_8pm)}
        />
        <DetailItem
          label="Details of permission, when applicable"
          value={event.hall_warden_permission_details}
          wide
        />
        <DetailItem
          label={`${detailStartNumber + 3}. Outside participants`}
          value={yesNo(event.outside_participants)}
        />
        <DetailItem
          label="Outside participant details / attached list note"
          value={event.outside_participants_details}
          wide
        />
        <DetailItem
          label={`${detailStartNumber + 4}. Venue of the Event / Programme`}
          value={event.venue}
          wide
        />
        <DetailItem label="Date" value={displayDate(event.facility_permission_date)} />
        <DetailItem
          label="Signature of the Applicant"
          value={event.applicant_signature}
        />
        <DetailItem
          label="Student Registration Number"
          value={event.applicant_student_reg_no}
        />
      </div>
  );
}

function EventDetailsModal({
  event,
  workflow,
  onClose,
}: {
  event: WorkflowEvent;
  workflow: "Society" | "Department";
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-5">
          <div>
            <p className="text-sm font-semibold uppercase text-blue-700">
              {workflow} event application
            </p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              {event.event_name}
            </h2>
            <p className="mt-1 text-sm text-gray-500">{event.event_status}</p>
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
          <ApplicationDetails event={event} workflow={workflow} />
        </div>
      </div>
    </div>
  );
}

function ActionPanel({
  event,
  role,
  remarks,
  setRemarks,
  act,
  workflow,
  entities,
  onSaved,
}: {
  event: WorkflowEvent;
  role: string;
  remarks: string;
  setRemarks: (value: string) => void;
  act: (
    action:
      | "approve"
      | "final-approve"
      | "request-change"
      | "publish"
      | "resubmit"
      | "submit"
      | "send-back"
      | "reject",
    targetRole?: string,
  ) => void;
  workflow: "Society" | "Department";
  entities: Entity[];
  onSaved: (message: string) => Promise<void>;
}) {
  const status = event.event_status;
  const reviewRoles = reviewRolesForEvent(workflow, status);
  const approvalTargets = forwardReviewTargets(reviewRoles, role);
  const changeTargets =
    workflow === "Society"
      ? ["Society Admin", ...reviewRoles.filter((item) => item !== role)]
      : ["Lecturer", ...reviewRoles.filter((item) => item !== role)];
  const [targetRole, setTargetRole] = useState(approvalTargets[0] || "");
  const [changeTargetRole, setChangeTargetRole] = useState(changeTargets[0] || "");
  const selectedTargetRole = approvalTargets.includes(targetRole)
    ? targetRole
    : approvalTargets[0] || "";
  const selectedChangeTargetRole = changeTargets.includes(changeTargetRole)
    ? changeTargetRole
    : changeTargets[0] || "";
  const canReviewApplication =
    (workflow === "Society" &&
      ((role === "Treasurer" &&
      status === "Pending Treasurer Application Approval") ||
      (role === "Registrar" &&
        status === "Pending Registrar Application Approval") ||
      (role === "Student Counsellor" &&
        status === "Pending Student Counsellor Application Approval") ||
      (role === "Department Head" &&
        status === "Pending Department Head Application Approval") ||
      (role === "Dean" &&
        status === "Pending Dean Application Approval") ||
      (role === "Vice-Chancellor" &&
        status === "Pending Vice-Chancellor Application Approval"))) ||
    (workflow === "Department" &&
      ((role === "Department Head" &&
        status === "Pending Department Head Application Approval") ||
        (role === "Registrar" &&
          status === "Pending Registrar Application Approval") ||
        (role === "Dean" &&
          status === "Pending Dean Application Approval") ||
        (role === "Vice-Chancellor" &&
          status === "Pending Vice-Chancellor Application Approval")));
  const canReviewCompletion =
    (workflow === "Society" &&
      role === "Faculty Web Coordinator" &&
      status === "Pending Faculty Web Coordinator Completion Approval") ||
    (workflow === "Department" &&
      role === "Faculty Web Coordinator" &&
      (status === "Pending Faculty Web Coordinator Completion Approval" ||
        status === "Pending Faculty Web Coordinator Approval"));
  const canReview = canReviewApplication || canReviewCompletion;
  const isFinalViceChancellor =
    role === "Vice-Chancellor" &&
    status === "Pending Vice-Chancellor Application Approval";
  const canApproveApplicationHere =
    canReviewApplication &&
    ["Department Head", "Dean", "Vice-Chancellor"].includes(role);
  const isFinalPublisher =
    role === "Faculty Web Coordinator" &&
    (status === "Pending Faculty Web Coordinator Completion Approval" ||
      status === "Pending Faculty Web Coordinator Approval");
  const canSubmitCompletion =
    ((role === "Society Admin" && workflow === "Society") ||
      (role === "Lecturer" && workflow === "Department")) &&
    status === "Event Approved";
  const canSubmitDraft =
    role === "Society Admin" && workflow === "Society" && status === "Draft";
  const canResubmit =
    ((role === "Society Admin" && workflow === "Society") ||
      (role === "Lecturer" && workflow === "Department")) &&
    status.includes("Changes Requested");
  const canEditDraft = canSubmitDraft;
  const [open, setOpen] = useState(false);

  const hasMedia = (event.images?.length || 0) > 0;
  const latestChangeFromStatus = event.reviews?.find(
    (review) => review.to_status === status,
  )?.from_status;
  const isApplicationChangeRequest =
    status.includes("Changes Requested") &&
    ((workflow === "Society" &&
      (status.startsWith("Application Changes Requested") ||
        latestChangeFromStatus?.includes("Application Approval") ||
        (!hasMedia && !event.event_description))) ||
      (workflow === "Department" &&
        (status.startsWith("Department Application Changes Requested") ||
          latestChangeFromStatus?.includes("Application Approval"))));
  if (
    !canReview &&
    !canResubmit &&
    !canSubmitDraft &&
    !canSubmitCompletion &&
    !hasMedia
  ) {
    return null;
  }
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
                  Event actions
                </p>
                <h3 className="mt-1 text-lg font-bold text-gray-900">
                  {event.event_name}
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
      {hasMedia && (
        <a
          href={`/api/workflow/events/${event.event_id}/media.zip`}
          className="block w-full rounded-xl bg-slate-800 px-4 py-2 text-center font-semibold text-white"
        >
          Download photos & videos ZIP
        </a>
      )}
      {canReview && (
        <textarea
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
          placeholder="Comment required when requesting changes or rejecting"
          className={inputClass}
          rows={3}
        />
      )}
      {(canReviewApplication || canReviewCompletion || canSubmitDraft) &&
        !isFinalViceChancellor &&
        !isFinalPublisher &&
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
      {(canReviewApplication || canReviewCompletion) &&
        !isFinalViceChancellor &&
        !isFinalPublisher && (
        <button
          onClick={() => act("approve", selectedTargetRole)}
          className="w-full rounded-xl bg-green-600 px-4 py-2 font-semibold text-white"
        >
          Send for approval
        </button>
      )}
      {canApproveApplicationHere && (
        <button
          onClick={() => act("final-approve")}
          className="w-full rounded-xl bg-green-700 px-4 py-2 font-semibold text-white"
        >
          Approve
        </button>
      )}
      {isFinalPublisher && (
        <button
          onClick={() => act("publish")}
          className="w-full rounded-xl bg-green-700 px-4 py-2 font-semibold text-white"
        >
          Publish
        </button>
      )}
      {canReview && (
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
      {canReview && (
        <button
          onClick={() => act("request-change", selectedChangeTargetRole)}
          className="w-full rounded-xl bg-red-600 px-4 py-2 font-semibold text-white"
        >
          Request changes
        </button>
      )}
      {canReview && (
        <button
          onClick={() => act("reject")}
          className="w-full rounded-xl bg-red-800 px-4 py-2 font-semibold text-white"
        >
          Reject
        </button>
      )}
      {canSubmitDraft && (
        <button
          onClick={() => act("submit", selectedTargetRole)}
          className="w-full rounded-xl bg-green-600 px-4 py-2 font-semibold text-white"
        >
          Submit for approval
        </button>
      )}
      {canSubmitCompletion && (
        <CompletionEditor
          event={event}
          workflow={workflow}
          onSaved={onSaved}
        />
      )}
      {canResubmit && workflow === "Society" && !isApplicationChangeRequest && (
        <CompletionEditor
          event={event}
          workflow={workflow}
          onSaved={onSaved}
        />
      )}
      {canResubmit && workflow === "Department" && !isApplicationChangeRequest && (
        <CompletionEditor
          event={event}
          workflow={workflow}
          onSaved={onSaved}
        />
      )}
      {((canResubmit &&
        isApplicationChangeRequest) ||
        canEditDraft) && (
        <CorrectionEditor
          event={event}
          workflow={workflow}
          entities={entities}
          onSaved={onSaved}
        />
      )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function eventToForm(event: WorkflowEvent, workflow: "Society" | "Department") {
  return {
    ...emptyForm,
    entity_id: String(
      workflow === "Society"
        ? event.society?.society_id || ""
        : event.department?.department_id || "",
    ),
    event_name: event.event_name,
    event_description: event.event_description || "",
    event_type: event.event_type || "",
    event_date: datePart(event.event_date),
    event_time: timePart(event.start_time),
    event_end_time: timePart(event.end_time),
    venue: event.venue || "",
    academic_year: event.academic_year || "",
    applicant_name: event.applicant_name || "",
    applicant_phone: event.applicant_phone || "",
    applicant_position: event.applicant_position || "",
    applicant_address: event.applicant_address || "",
    permission_purpose: event.permission_purpose || "",
    rehearsal_date: datePart(event.rehearsal_date),
    rehearsal_start_time: timePart(event.rehearsal_start_time),
    rehearsal_end_time: timePart(event.rehearsal_end_time),
    preparation_date: datePart(event.preparation_date),
    preparation_start_time: timePart(event.preparation_start_time),
    preparation_end_time: timePart(event.preparation_end_time),
    cleanup_start_time: timePart(event.cleanup_start_time),
    cleanup_end_time: timePart(event.cleanup_end_time),
    continues_after_8pm: event.continues_after_8pm ? "true" : "false",
    hall_warden_permission_details:
      event.hall_warden_permission_details || "",
    outside_participants: event.outside_participants ? "true" : "false",
    outside_participants_details: event.outside_participants_details || "",
    facility_permission_date: datePart(event.facility_permission_date),
    applicant_signature: event.applicant_signature || "",
    applicant_student_reg_no: event.applicant_student_reg_no || "",
  };
}

function CompletionEditor({
  event,
  workflow,
  onSaved,
}: {
  event: WorkflowEvent;
  workflow: "Society" | "Department";
  onSaved: (message: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [description, setDescription] = useState(event.event_description || "");
  const [removeMediaIds, setRemoveMediaIds] = useState<number[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  const existingPhotos =
    event.images?.filter((media) => media.media_type === "Image") || [];
  const existingVideos =
    event.images?.filter((media) => media.media_type === "Video") || [];
  const isFirstCompletion = event.event_status === "Event Approved";

  async function save(eventSubmit: React.FormEvent) {
    eventSubmit.preventDefault();
    setError("");
    setSaving(true);
    try {
      const form = {
        ...eventToForm(event, workflow),
        event_description: description,
      };
      const body = new FormData();
      body.set(
        workflow === "Society" ? "society_id" : "department_id",
        form.entity_id,
      );
      appendEventForm(body, form);
      body.set("remove_media_ids", JSON.stringify(removeMediaIds));
      newPhotos.forEach((file) => body.append("photos", file));
      newVideos.forEach((file) => body.append("videos", file));
      const response = await fetch(`/api/workflow/events/${event.event_id}`, {
        method: "PUT",
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Unable to submit completion");
        return;
      }
      setOpen(false);
      await onSaved(
        isFirstCompletion
          ? "Event completion sent to Faculty Web Coordinator."
          : "Event completion updated and sent to Faculty Web Coordinator.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white"
      >
        {isFirstCompletion ? "Complete event" : "Edit completion & resubmit"}
      </button>
    );
  }

  return (
    <form
      onSubmit={save}
      className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4"
    >
      <p className="font-semibold text-blue-900">Event completion</p>
      <textarea
        value={description}
        onChange={(changeEvent) => setDescription(changeEvent.target.value)}
        placeholder="Completion description"
        required
        rows={4}
        className={inputClass}
      />
      {(existingPhotos.length > 0 || existingVideos.length > 0) && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">
            Existing media - check files to remove
          </p>
          {event.images?.map((media) => (
            <label
              key={media.image_id}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={removeMediaIds.includes(media.image_id)}
                onChange={(changeEvent) =>
                  setRemoveMediaIds((current) =>
                    changeEvent.target.checked
                      ? [...current, media.image_id]
                      : current.filter((id) => id !== media.image_id),
                  )
                }
              />
              {media.media_type}: {media.file_name}
            </label>
          ))}
        </div>
      )}
      <label className="block text-sm font-semibold text-gray-700">
        Photos
        <input
          type="file"
          accept="image/*"
          multiple
          required={existingPhotos.length === 0}
          onChange={(changeEvent) =>
            setNewPhotos(Array.from(changeEvent.target.files || []))
          }
          className={`${inputClass} mt-1`}
        />
      </label>
      <label className="block text-sm font-semibold text-gray-700">
        Videos
        <input
          type="file"
          accept="video/*"
          multiple
          required={existingVideos.length === 0}
          onChange={(changeEvent) =>
            setNewVideos(Array.from(changeEvent.target.files || []))
          }
          className={`${inputClass} mt-1`}
        />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-blue-700 px-3 py-2 font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Submit completion"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl bg-white px-3 py-2 font-semibold text-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function CorrectionEditor({
  event,
  workflow,
  entities,
  onSaved,
}: {
  event: WorkflowEvent;
  workflow: "Society" | "Department";
  entities: Entity[];
  onSaved: (message: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [removeMediaIds, setRemoveMediaIds] = useState<number[]>([]);
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [newVideos, setNewVideos] = useState<File[]>([]);
  const isDraft = event.event_status === "Draft";
  const isApplicationCorrection =
    workflow === "Department" &&
    event.event_status.startsWith("Department Application Changes Requested");
  const resubmitTargets = resubmitTargetsForEvent(
    workflow,
    event.event_status,
  );
  const [targetRole, setTargetRole] = useState(resubmitTargets[0] || "");
  const showCompletionFields = !isDraft && !isApplicationCorrection;
  const [form, setForm] = useState<EventForm>(eventToForm(event, workflow));

  async function save(eventSubmit: React.FormEvent) {
    eventSubmit.preventDefault();
    setError("");
    setSaving(true);
    try {
      const body = new FormData();
      body.set(
        workflow === "Society" ? "society_id" : "department_id",
        form.entity_id,
      );
      appendEventForm(body, form);
      if (!isDraft && resubmitTargets.length > 0) {
        body.set(
          "target_role",
          resubmitTargets.includes(targetRole)
            ? targetRole
            : resubmitTargets[0],
        );
      }
      body.set("remove_media_ids", JSON.stringify(removeMediaIds));
      newPhotos.forEach((file) => body.append("photos", file));
      newVideos.forEach((file) => body.append("videos", file));
      const response = await fetch(`/api/workflow/events/${event.event_id}`, {
        method: "PUT",
        body,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Unable to resubmit event");
        return;
      }
      setOpen(false);
      await onSaved(
        isDraft
          ? "Event draft updated."
          : "Event details and media updated, then resubmitted.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white"
      >
        {isDraft ? "Edit draft" : "Edit all details & resubmit"}
      </button>
    );
  }

  return (
    <form
      onSubmit={save}
      className="space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4"
    >
      <p className="font-semibold text-blue-900">
        {isDraft ? "Edit event draft" : "Correct event details"}
      </p>
      <select
        value={form.entity_id}
        onChange={(eventChange) =>
          setForm({ ...form, entity_id: eventChange.target.value })
        }
        required
        className={inputClass}
      >
        <option value="">
          Select {workflow === "Society" ? "society" : "department"}
        </option>
        {entities.map((entity) => {
          const id = entity.society_id || entity.department_id;
          return (
            <option key={id} value={id}>
              {entity.society_name || entity.department_name}
            </option>
          );
        })}
      </select>
      {!isDraft && resubmitTargets.length > 0 && (
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-gray-700">
            Send corrected event to
          </span>
          <select
            value={
              resubmitTargets.includes(targetRole)
                ? targetRole
                : resubmitTargets[0]
            }
            onChange={(eventChange) => setTargetRole(eventChange.target.value)}
            className={inputClass}
          >
            {resubmitTargets.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      )}
      <input
        value={form.event_name}
        onChange={(eventChange) =>
          setForm({ ...form, event_name: eventChange.target.value })
        }
        required
        className={inputClass}
      />
      <select
        value={form.event_type}
        onChange={(eventChange) =>
          setForm({ ...form, event_type: eventChange.target.value })
        }
        required
        className={inputClass}
      >
        <option value="">Select event type</option>
        {EVENT_TYPES.map((eventType) => (
          <option key={eventType}>{eventType}</option>
        ))}
      </select>
      <input
        type="date"
        min={todayInputDate()}
        value={form.event_date}
        onChange={(eventChange) =>
          setForm({ ...form, event_date: eventChange.target.value })
        }
        required
        className={inputClass}
      />
      <input
        type="time"
        value={form.event_time}
        onChange={(eventChange) =>
          setForm({ ...form, event_time: eventChange.target.value })
        }
        required={workflow === "Society"}
        className={inputClass}
      />
      <input
        type="time"
        value={form.event_end_time}
        onChange={(eventChange) =>
          setForm({ ...form, event_end_time: eventChange.target.value })
        }
        required={workflow === "Society"}
        className={inputClass}
      />
      <input
        value={form.venue}
        onChange={(eventChange) =>
          setForm({ ...form, venue: eventChange.target.value })
        }
        required
        className={inputClass}
      />
      {showCompletionFields && (
        <textarea
          value={form.event_description}
          onChange={(eventChange) =>
            setForm({ ...form, event_description: eventChange.target.value })
          }
          required
          rows={4}
          className={inputClass}
        />
      )}
      {workflow === "Society" && (
        <SocietyApplicationFields form={form} setForm={setForm} />
      )}
      {showCompletionFields && (
        <>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">
              Existing media - check files to remove
            </p>
            {event.images?.map((media) => (
              <label
                key={media.image_id}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  checked={removeMediaIds.includes(media.image_id)}
                  onChange={(changeEvent) =>
                    setRemoveMediaIds((current) =>
                      changeEvent.target.checked
                        ? [...current, media.image_id]
                        : current.filter((id) => id !== media.image_id),
                    )
                  }
                />
                {media.media_type}: {media.file_name}
              </label>
            ))}
          </div>
          <label className="block text-sm font-semibold text-gray-700">
            Add replacement photos
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(changeEvent) =>
                setNewPhotos(Array.from(changeEvent.target.files || []))
              }
              className={`${inputClass} mt-1`}
            />
          </label>
          <label className="block text-sm font-semibold text-gray-700">
            Add replacement videos
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={(changeEvent) =>
                setNewVideos(Array.from(changeEvent.target.files || []))
              }
              className={`${inputClass} mt-1`}
            />
          </label>
        </>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-blue-700 px-3 py-2 font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : isDraft ? "Save draft" : "Save & resubmit"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl bg-white px-3 py-2 font-semibold text-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
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
