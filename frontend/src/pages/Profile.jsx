import { useEffect, useState } from "react";
import { User, Lock, AlertTriangle, Save, Trash2, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateProfile, changePassword, deleteAccount, getReminderSettings, updateReminderSettings } from "../services/api";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import AppCard from "../components/ui/AppCard";
import AppButton from "../components/ui/AppButton";
import { Field, TextInput, Select } from "../components/ui/FormField";
import Toggle from "../components/ui/Toggle";
import { useTheme } from "../context/ThemeContext";

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [name, setName] = useState(user?.name || "");
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [deleteData, setDeleteData] = useState({ password: "", confirmText: "" });

  const [reminders, setReminders] = useState(null);
  const [remindersLoading, setRemindersLoading] = useState(true);
  const [remindersSaving, setRemindersSaving] = useState(false);
  const [remindersMessage, setRemindersMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  useEffect(() => {
    let active = true;
    async function fetchReminders() {
      try {
        setRemindersLoading(true);
        const data = await getReminderSettings();
        if (active) setReminders(data.settings || data);
      } catch {
        if (active) setReminders(null);
      } finally {
        if (active) setRemindersLoading(false);
      }
    }
    fetchReminders();
    return () => {
      active = false;
    };
  }, []);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      await updateProfile({ name });
      setMessage({ type: "success", text: "Profile updated successfully." });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setMessage({ type: "error", text: "New passwords do not match." });
    }
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      await changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      setMessage({ type: "success", text: "Password changed successfully." });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleRemindersSave(e) {
    e.preventDefault();
    if (!reminders) return;
    setRemindersSaving(true);
    setRemindersMessage({ type: "", text: "" });
    try {
      const data = await updateReminderSettings(reminders);
      setReminders(data.settings || data);
      setRemindersMessage({ type: "success", text: "Reminder preferences saved." });
    } catch (err) {
      setRemindersMessage({ type: "error", text: err.message || "Unable to save reminder preferences." });
    } finally {
      setRemindersSaving(false);
    }
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    if (deleteData.confirmText !== "DELETE") {
      return setMessage({ type: "error", text: "Please type DELETE to confirm." });
    }
    if (!window.confirm("Are you absolutely sure? This cannot be undone.")) return;
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      await deleteAccount({ password: deleteData.password });
      logout();
      navigate("/");
    } catch (err) {
      setMessage({ type: "error", text: err.message });
      setLoading(false);
    }
  }

  return (
    <div className="app-page" style={{ maxWidth: 760 }}>
      <PageHeader eyebrow="Account" title="Profile settings" description="Manage your personal information and account security." />

      {message.text && <div className={message.type === "error" ? "app-form-error" : "app-form-success"} style={{ margin: 0 }}>{message.text}</div>}

      <AppCard className="p-5 sm:p-6">
        <h2 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-strong)", display: "flex", alignItems: "center", gap: 8 }}>
          <User size={17} style={{ color: "var(--brand)" }} /> Personal information
        </h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <Field label="Full name">
            <TextInput type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </Field>
          <Field label="Email">
            <TextInput type="email" value={user?.email || ""} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
          </Field>
          <AppButton type="submit" loading={loading}>
            <Save size={15} /> Update profile
          </AppButton>
        </form>
      </AppCard>

      <AppCard className="p-5 sm:p-6">
        <h2 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-strong)", display: "flex", alignItems: "center", gap: 8 }}>
          <Lock size={17} style={{ color: "var(--brand)" }} /> Change password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Current password">
              <TextInput type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required />
            </Field>
            <Field label="New password">
              <TextInput type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required minLength={6} />
            </Field>
          </div>
          <Field label="Confirm new password">
            <TextInput type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} required />
          </Field>
          <AppButton type="submit" variant="secondary" loading={loading}>
            <Lock size={15} /> Change password
          </AppButton>
        </form>
      </AppCard>

      <AppCard className="p-5 sm:p-6">
        <h2 style={{ margin: "0 0 0.4rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-strong)", display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={17} style={{ color: "var(--brand)" }} /> Email reminders
        </h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "var(--muted)" }}>
          Receive occasional email reminders about applications waiting for follow-up and upcoming interviews.
        </p>

        {remindersMessage.text && (
          <div className={remindersMessage.type === "error" ? "app-form-error" : "app-form-success"}>{remindersMessage.text}</div>
        )}

        {remindersLoading ? (
          <div className="app-loading-state"><div className="app-skeleton" style={{ height: 120 }} /></div>
        ) : !reminders ? (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted)" }}>
            Reminder preferences are unavailable right now. Please try again later.
          </p>
        ) : (
          <form onSubmit={handleRemindersSave} className="space-y-4">
            <ReminderRow
              label="Email reminders"
              description="Master switch. Turning this off disables all reminder emails."
              control={
                <Toggle
                  label="Email reminders"
                  checked={reminders.emailReminders}
                  onChange={(value) => setReminders({ ...reminders, emailReminders: value })}
                />
              }
            />
            <div style={{ opacity: reminders.emailReminders ? 1 : 0.55 }}>
              <ReminderRow
                label="Application follow-ups"
                description="One digest email when enough applications have waited past the follow-up window."
                control={
                  <Toggle
                    label="Application follow-up reminders"
                    checked={reminders.followupReminders}
                    disabled={!reminders.emailReminders}
                    onChange={(value) => setReminders({ ...reminders, followupReminders: value })}
                  />
                }
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" style={{ marginTop: "0.75rem" }}>
                <Field label="Follow up after">
                  <Select
                    value={reminders.followupAfterDays}
                    disabled={!reminders.emailReminders}
                    onChange={(e) => setReminders({ ...reminders, followupAfterDays: Number(e.target.value) })}
                  >
                    {[3, 5, 7, 10, 14, 21, 30].map((days) => (
                      <option key={days} value={days}>{days} days</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Send when">
                  <Select
                    value={reminders.minPendingApplications}
                    disabled={!reminders.emailReminders}
                    onChange={(e) => setReminders({ ...reminders, minPendingApplications: Number(e.target.value) })}
                  >
                    {[2, 3, 4, 5, 8, 10].map((count) => (
                      <option key={count} value={count}>{count} applications</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <div style={{ marginTop: "0.75rem" }}>
                <ReminderRow
                  label="Interview reminders"
                  description="One consolidated email for interviews entering the reminder window."
                  control={
                    <Toggle
                      label="Interview reminders"
                      checked={reminders.interviewReminders}
                      disabled={!reminders.emailReminders}
                      onChange={(value) => setReminders({ ...reminders, interviewReminders: value })}
                    />
                  }
                />
              </div>
              <div style={{ marginTop: "0.75rem", maxWidth: 280 }}>
                <Field label="Remind me">
                  <Select
                    value={reminders.interviewReminderHours}
                    disabled={!reminders.emailReminders}
                    onChange={(e) => setReminders({ ...reminders, interviewReminderHours: Number(e.target.value) })}
                  >
                    {[1, 2, 6, 12, 24, 48].map((hours) => (
                      <option key={hours} value={hours}>{hours === 1 ? "1 hour before" : `${hours} hours before`}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            </div>
            <AppButton type="submit" loading={remindersSaving}>
              <Save size={15} /> Save reminder preferences
            </AppButton>
          </form>
        )}
      </AppCard>

      <AppCard className="p-5 sm:p-6">
        <h2 style={{ margin: "0 0 0.4rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-strong)" }}>
          Appearance
        </h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "var(--muted)" }}>
          Current theme: <strong style={{ color: "var(--text)" }}>{theme === "dark" ? "Dark" : "Light"}</strong>. You can also use the theme toggle in the top bar.
        </p>
        <AppButton variant="secondary" onClick={toggleTheme}>
          Switch to {theme === "dark" ? "light" : "dark"} mode
        </AppButton>
      </AppCard>

      <AppCard className="p-5 sm:p-6" style={{ borderColor: "var(--danger)" }}>
        <h2 style={{ margin: "0 0 0.4rem", fontSize: "0.95rem", fontWeight: 700, color: "var(--danger)", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={17} /> Danger zone
        </h2>
        <p style={{ margin: "0 0 1rem", fontSize: "0.82rem", color: "var(--muted)" }}>
          Permanently delete your account and all associated data. This action is irreversible.
        </p>
        <form onSubmit={handleDeleteAccount} className="space-y-4" style={{ maxWidth: 420 }}>
          <Field label="Enter your password to confirm">
            <TextInput type="password" value={deleteData.password} onChange={(e) => setDeleteData({ ...deleteData, password: e.target.value })} required />
          </Field>
          <Field label='Type "DELETE" to confirm'>
            <TextInput type="text" value={deleteData.confirmText} onChange={(e) => setDeleteData({ ...deleteData, confirmText: e.target.value })} required />
          </Field>
          <AppButton type="submit" variant="danger" disabled={loading || deleteData.confirmText !== "DELETE"}>
            <Trash2 size={15} /> Delete account
          </AppButton>
        </form>
      </AppCard>
    </div>
  );
}

function ReminderRow({ label, description, control }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: "0.83rem", fontWeight: 650, color: "var(--text-strong)" }}>{label}</div>
        <div style={{ marginTop: 2, fontSize: "0.76rem", lineHeight: 1.5, color: "var(--muted)" }}>{description}</div>
      </div>
      {control}
    </div>
  );
}

export default Profile;
