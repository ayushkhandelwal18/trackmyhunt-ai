import { useState } from "react";
import { X, Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Crosshair } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { signupUser, verifyOtp, loginUser, resendOtp, googleLogin, forgotPassword, resetPassword } from "../../services/api";
import { GoogleLogin } from "@react-oauth/google";

function AuthOverlay({ onClose, initialMode = "login", isStandalone = false }) {
  const [mode, setMode] = useState(initialMode);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", otp: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleGoogleSuccess(credentialResponse) {
    try {
      setLoading(true);
      setError("");
      const data = await googleLogin(credentialResponse.credential);
      login(data.user, data.token);
      if (!isStandalone && onClose) onClose();
      navigate("/dashboard");
    } catch {
      setError("Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const res = await loginUser({ email: formData.email, password: formData.password });
      login(res.user, res.token);
      if (!isStandalone && onClose) onClose();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError("");
      await signupUser({ name: formData.name, email: formData.email, password: formData.password });
      setMode("otp");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpVerify(e) {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const res = await verifyOtp({ email: formData.email, otp: formData.otp });
      login(res.user, res.token);
      if (!isStandalone && onClose) onClose();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    try {
      setResendLoading(true);
      setError("");
      setSuccessMessage("");
      await resendOtp(formData.email);
      setSuccessMessage("New OTP sent to your email.");
      setFormData({ ...formData, otp: "" });
      startResendCooldown();
    } catch (err) {
      setError(err.message);
    } finally {
      setResendLoading(false);
    }
  }

  function startResendCooldown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const wrapperClass = isStandalone
    ? "w-full max-w-[880px]"
    : "fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4";

  const cardClass = isStandalone ? "" : "w-full max-w-[880px]";

  const card = (
    <div className={`app-card overflow-hidden ${cardClass}`} style={{ display: "grid", gridTemplateColumns: "1fr", borderRadius: 16 }}>
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="p-7 md:p-9">
          {!isStandalone && onClose && (
            <div className="mb-4 flex justify-end md:hidden">
              <button type="button" onClick={onClose} className="app-icon-button" aria-label="Close login dialog">
                <X size={18} />
              </button>
            </div>
          )}

          {error && <div className="app-form-error">{error}</div>}
          {successMessage && <div className="app-form-success">{successMessage}</div>}

          {mode === "login" && (
            <>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>Welcome back</h2>
              <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "var(--muted)" }}>Sign in to continue your job hunt.</p>
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <label className="app-form-label" htmlFor="auth-email">Email</label>
                  <input id="auth-email" type="email" name="email" value={formData.email} onChange={handleChange} className="app-form-input" placeholder="you@example.com" required />
                </div>
                <div>
                  <label className="app-form-label" htmlFor="auth-password">Password</label>
                  <div style={{ position: "relative" }}>
                    <input id="auth-password" type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="app-form-input" style={{ paddingRight: "2.5rem" }} placeholder="••••••••" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="app-icon-button" style={{ position: "absolute", right: 4, top: 4 }} aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => setMode("forgot")} style={{ background: "none", border: 0, cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: "var(--brand)" }}>
                    Forgot password?
                  </button>
                </div>
                <button type="submit" disabled={loading} className="app-button app-button-primary w-full">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <>Sign in <ArrowRight size={16} /></>}
                </button>
              </form>
              <Divider />
              <div className="flex justify-center">
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google login failed")} theme="outline" shape="rect" text="signin_with" width="280" />
              </div>
              <SwitchMode text="Don't have an account?" label="Create account" onClick={() => { setMode("signup"); setError(""); }} />
            </>
          )}

          {mode === "signup" && (
            <>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-strong)" }}>Create account</h2>
              <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "var(--muted)" }}>Start tracking your job hunt today.</p>
              <form onSubmit={handleSignup} className="space-y-3">
                <div>
                  <label className="app-form-label" htmlFor="auth-name">Full name</label>
                  <input id="auth-name" type="text" name="name" value={formData.name} onChange={handleChange} className="app-form-input" placeholder="Your name" required />
                </div>
                <div>
                  <label className="app-form-label" htmlFor="auth-email2">Email</label>
                  <input id="auth-email2" type="email" name="email" value={formData.email} onChange={handleChange} className="app-form-input" placeholder="you@example.com" required />
                </div>
                <div>
                  <label className="app-form-label" htmlFor="auth-password2">Password</label>
                  <div style={{ position: "relative" }}>
                    <input id="auth-password2" type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="app-form-input" style={{ paddingRight: "2.5rem" }} placeholder="Min. 6 characters" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="app-icon-button" style={{ position: "absolute", right: 4, top: 4 }} aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="app-button app-button-primary w-full">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Create account"}
                </button>
              </form>
              <Divider />
              <div className="flex justify-center">
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google login failed")} theme="outline" shape="rect" text="signup_with" width="280" />
              </div>
              <SwitchMode text="Already have an account?" label="Sign in" onClick={() => { setMode("login"); setError(""); }} />
            </>
          )}

          {mode === "otp" && (
            <>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.4rem", fontWeight: 800, color: "var(--text-strong)" }}>Verify email</h2>
              <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "var(--muted)" }}>Enter the 6-digit code sent to {formData.email}.</p>
              <form onSubmit={handleOtpVerify} className="space-y-4">
                <input type="text" name="otp" maxLength="6" value={formData.otp} onChange={handleChange} className="app-form-input" style={{ textAlign: "center", letterSpacing: "0.4em", fontFamily: "monospace", fontSize: "1.1rem" }} placeholder="000000" required />
                <p className="text-center" style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)" }}>Didn&apos;t receive the OTP? Check your spam folder.</p>
                <button type="submit" disabled={loading} className="app-button app-button-primary w-full">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Verify & continue"}
                </button>
              </form>
              <div className="mt-4 text-center">
                {resendCooldown > 0 ? (
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Resend available in {resendCooldown}s</p>
                ) : (
                  <button type="button" onClick={handleResendOtp} disabled={resendLoading} style={{ background: "none", border: 0, cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "var(--brand)" }}>
                    {resendLoading ? "Sending…" : "Resend OTP"}
                  </button>
                )}
              </div>
              <BackButton onClick={() => setMode("signup")} label="Back to signup" />
            </>
          )}

          {mode === "forgot" && (
            <>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.4rem", fontWeight: 800, color: "var(--text-strong)" }}>Reset password</h2>
              <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "var(--muted)" }}>Enter your email to receive a reset code.</p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  setError("");
                  try {
                    await forgotPassword(formData.email);
                    setMode("reset");
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="app-form-label">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="app-form-input" required />
                </div>
                <button type="submit" disabled={loading} className="app-button app-button-primary w-full">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Send reset code"}
                </button>
              </form>
              <BackButton onClick={() => setMode("login")} label="Back to login" />
            </>
          )}

          {mode === "reset" && (
            <>
              <h2 style={{ margin: "0 0 4px", fontSize: "1.4rem", fontWeight: 800, color: "var(--text-strong)" }}>Set new password</h2>
              <p style={{ margin: "0 0 1.25rem", fontSize: "0.85rem", color: "var(--muted)" }}>Enter the code sent to {formData.email}.</p>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  setError("");
                  try {
                    await resetPassword({ email: formData.email, otp: formData.otp, newPassword: formData.password });
                    setSuccessMessage("Password reset. Please sign in.");
                    setMode("login");
                  } catch (err) {
                    setError(err.message);
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-3"
              >
                <div>
                  <label className="app-form-label">OTP</label>
                  <input type="text" name="otp" maxLength="6" value={formData.otp} onChange={handleChange} className="app-form-input" style={{ fontFamily: "monospace", letterSpacing: "0.25em" }} required />
                  <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "var(--muted)" }}>Didn&apos;t receive the OTP? Check your spam folder.</p>
                </div>
                <div>
                  <label className="app-form-label">New password</label>
                  <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className="app-form-input" required minLength={6} />
                </div>
                <button type="submit" disabled={loading} className="app-button app-button-primary w-full">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : "Reset password"}
                </button>
              </form>
              <BackButton onClick={() => setMode("forgot")} label="Back" />
            </>
          )}
        </div>

        <div className="hidden p-9 md:flex md:flex-col md:justify-center" style={{ background: "var(--surface-2)", borderLeft: "1px solid var(--border)" }}>
          <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", marginBottom: "1.25rem" }}>
            <span style={{ display: "grid", placeItems: "center", height: 30, width: 30, borderRadius: 9, background: "var(--brand)", color: "#fff" }}>
              <Crosshair size={16} />
            </span>
            <span style={{ fontWeight: 800, color: "var(--text-strong)" }}>TrackMyHunt</span>
          </Link>
          <h3 style={{ margin: "0 0 0.6rem", fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text-strong)", lineHeight: 1.3 }}>
            Your job hunt, in one calm place.
          </h3>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.9rem", fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.55 }}>
            <li style={{ display: "flex", gap: "0.6rem" }}><User size={16} style={{ flexShrink: 0, marginTop: 2, color: "var(--brand)" }} /> Track applications, interviews, and follow-ups.</li>
            <li style={{ display: "flex", gap: "0.6rem" }}><Mail size={16} style={{ flexShrink: 0, marginTop: 2, color: "var(--brand)" }} /> Save opportunities while you browse with the extension.</li>
            <li style={{ display: "flex", gap: "0.6rem" }}><Lock size={16} style={{ flexShrink: 0, marginTop: 2, color: "var(--brand)" }} /> Secure sign-in with email OTP or Google.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  if (isStandalone) {
    return <div className="w-full max-w-[880px]">{card}</div>;
  }

  return (
    <div className={wrapperClass} role="dialog" aria-modal="true" aria-label="Authentication">
      <div style={{ position: "relative", width: "100%", maxWidth: 880 }}>
        {onClose && (
          <button type="button" onClick={onClose} className="app-icon-button hidden md:inline-grid" style={{ position: "absolute", top: 12, right: 12, zIndex: 2, background: "var(--surface)" }} aria-label="Close">
            <X size={17} />
          </button>
        )}
        {card}
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="my-5 flex items-center gap-3" aria-hidden="true">
      <span className="app-divider" style={{ flex: 1 }} />
      <span style={{ fontSize: "0.72rem", color: "var(--faint)" }}>or continue with</span>
      <span className="app-divider" style={{ flex: 1 }} />
    </div>
  );
}

function SwitchMode({ text, label, onClick }) {
  return (
    <p className="mt-5 text-center" style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
      {text}{" "}
      <button type="button" onClick={onClick} style={{ background: "none", border: 0, cursor: "pointer", fontWeight: 700, color: "var(--brand)" }}>
        {label}
      </button>
    </p>
  );
}

function BackButton({ onClick, label }) {
  return (
    <button type="button" onClick={onClick} className="app-button app-button-ghost mt-4 w-full">
      ← {label}
    </button>
  );
}

export default AuthOverlay;
