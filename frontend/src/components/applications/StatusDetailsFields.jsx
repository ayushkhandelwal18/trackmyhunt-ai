import { Field, TextInput, Select, Textarea } from "../ui/FormField";

const INTERVIEW_TYPES = ["Technical", "HR", "Behavioral", "Managerial", "Other"];

/**
 * Optional detail fields shown only for the currently selected status.
 * Everything is optional — these never block saving. Switching status keeps
 * previously entered details instead of deleting them.
 */
function StatusDetailsFields({ status, details, onChange }) {
  if (status === "Interview Scheduled" || status === "Interview Done") {
    const interview = details.interview || {};
    const set = (patch) => onChange({ ...details, interview: { ...interview, ...patch } });
    return (
      <div className="md:col-span-2">
        <div
          className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)" }} className="sm:col-span-2">
            Interview details <span style={{ fontWeight: 500 }}>(optional)</span>
          </p>
          <Field label="Interview date">
            <TextInput type="date" value={interview.date || ""} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="Interview time">
            <TextInput type="time" value={interview.time || ""} onChange={(e) => set({ time: e.target.value })} />
          </Field>
          <Field label="Interview type">
            <Select value={interview.type || ""} onChange={(e) => set({ type: e.target.value })}>
              <option value="">Select type</option>
              {INTERVIEW_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </Field>
          <Field label="Meeting link">
            <TextInput type="url" value={interview.link || ""} onChange={(e) => set({ link: e.target.value })} placeholder="https://meet.google.com/…" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Interview notes">
              <Textarea rows={2} value={interview.notes || ""} onChange={(e) => set({ notes: e.target.value })} placeholder="e.g. Technical round with the backend team" />
            </Field>
          </div>
        </div>
      </div>
    );
  }

  if (status === "OA Done") {
    const oa = details.oa || {};
    const set = (patch) => onChange({ ...details, oa: { ...oa, ...patch } });
    return (
      <div className="md:col-span-2">
        <div
          className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)" }} className="sm:col-span-2">
            Assessment details <span style={{ fontWeight: 500 }}>(optional)</span>
          </p>
          <Field label="OA date">
            <TextInput type="date" value={oa.date || ""} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="OA link">
            <TextInput type="url" value={oa.link || ""} onChange={(e) => set({ link: e.target.value })} placeholder="https://…" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="OA notes">
              <Textarea rows={2} value={oa.notes || ""} onChange={(e) => set({ notes: e.target.value })} placeholder="e.g. 2 DSA questions, 90 minutes" />
            </Field>
          </div>
        </div>
      </div>
    );
  }

  if (status === "Rejected") {
    const rejection = details.rejection || {};
    const set = (patch) => onChange({ ...details, rejection: { ...rejection, ...patch } });
    return (
      <div className="md:col-span-2">
        <div
          className="grid grid-cols-1 gap-4 rounded-lg border p-4 sm:grid-cols-2"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)" }} className="sm:col-span-2">
            Rejection details <span style={{ fontWeight: 500 }}>(optional)</span>
          </p>
          <Field label="Rejection date">
            <TextInput type="date" value={rejection.date || ""} onChange={(e) => set({ date: e.target.value })} />
          </Field>
          <Field label="Reason">
            <TextInput value={rejection.reason || ""} onChange={(e) => set({ reason: e.target.value })} placeholder="e.g. Position closed" />
          </Field>
        </div>
      </div>
    );
  }

  return null;
}

export default StatusDetailsFields;
