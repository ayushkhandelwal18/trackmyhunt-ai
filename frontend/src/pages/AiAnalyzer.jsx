import { useRef, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Target,
  Lightbulb,
  Flag,
  Loader2,
  Upload,
} from "lucide-react";
import { analyzeApplicationUpload } from "../services/api";
import PageHeader from "../components/ui/PageHeader";
import AppButton from "../components/ui/AppButton";
import AppCard from "../components/ui/AppCard";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import { Field, Textarea } from "../components/ui/FormField";

const BREAKDOWN_LABELS = [
  { key: "skillsTechnicalMatch", label: "Skills & Technical Match", weight: "55%" },
  { key: "experience", label: "Experience", weight: "20%" },
  { key: "responsibilities", label: "Responsibilities", weight: "15%" },
  { key: "education", label: "Education", weight: "10%" },
];

function ScoreBar({ value }) {
  return (
    <div
      aria-hidden="true"
      style={{ height: 8, borderRadius: 999, background: "var(--border)", overflow: "hidden" }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(100, value))}%`,
          borderRadius: 999,
          background: "var(--brand)",
        }}
      />
    </div>
  );
}

function TagList({ items }) {
  if (!items || items.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--faint)" }}>None identified.</p>
    );
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="app-badge">
          {item}
        </span>
      ))}
    </div>
  );
}

function BulletList({ items }) {
  if (!items || items.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--faint)" }}>None identified.</p>
    );
  }
  return (
    <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text)" }}>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <AppCard className="p-5">
      <h3
        style={{
          margin: "0 0 0.8rem",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "0.9rem",
          fontWeight: 700,
          color: "var(--text-strong)",
        }}
      >
        <Icon size={16} style={{ color: "var(--brand)" }} />
        {title}
      </h3>
      {children}
    </AppCard>
  );
}

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB — must match the backend limit.

function AiAnalyzer() {
  const [resumeFile, setResumeFile] = useState(null);
  const fileInputRef = useRef(null);
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [result, setResult] = useState(null);
  const [wasCached, setWasCached] = useState(false);

  function clearUploadedFile() {
    setResumeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const isPdf =
      file.type === "application/pdf" || /\.pdf$/i.test(file.name || "");
    if (!isPdf) {
      setAnalysisError("Only PDF files are accepted. Please upload a .pdf file.");
      clearUploadedFile();
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setAnalysisError("The uploaded PDF is larger than 5 MB. Please upload a smaller file.");
      clearUploadedFile();
      return;
    }
    setAnalysisError("");
    setResumeFile(file);
  }

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!resumeFile || !jobDescription.trim() || analyzing) return;
    try {
      setAnalyzing(true);
      setAnalysisError("");
      setResult(null);
      const formData = new FormData();
      formData.append("resumePdf", resumeFile);
      formData.append("jobDescription", jobDescription.trim());
      const data = await analyzeApplicationUpload(formData);
      setResult(data?.analysis || null);
      setWasCached(Boolean(data?.cached));
    } catch (err) {
      setAnalysisError(err.message || "Analysis failed. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="app-page">
      <PageHeader
        eyebrow="AI Tools"
        title="AI Resume & JD Analyzer"
        description="Upload your resume PDF, paste a job description, and get an explainable match report."
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-5">
          <AppCard className="ai-analyzer-input p-5 xl:col-span-2" style={{ alignSelf: "start" }}>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <Field label="Resume" required hint="Upload your resume as a PDF.">
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="sr-only"
                    id="ai-analyzer-pdf"
                    aria-label="Upload resume PDF"
                  />
                  <label
                    htmlFor="ai-analyzer-pdf"
                    className="app-button app-button-secondary w-full"
                    style={{ cursor: "pointer" }}
                  >
                    <Upload size={15} /> {resumeFile ? "Change PDF" : "Upload Resume PDF"}
                  </label>
                  {resumeFile ? (
                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.78rem", color: "var(--text)" }}>
                      {resumeFile.name}{" "}
                      <span style={{ color: "var(--faint)" }}>
                        ({(resumeFile.size / 1024).toFixed(0)} KB)
                      </span>
                    </p>
                  ) : (
                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--faint)" }}>
                      PDF only · max 5 MB · used only for this analysis, never saved.
                    </p>
                  )}
                </div>
              </Field>

              <Field
                label="Job Description"
                required
                hint={`${jobDescription.trim().length} characters`}
              >
                <Textarea
                  rows={12}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here…"
                  required
                />
              </Field>

              {analysisError && <div className="app-form-error">{analysisError}</div>}

              <AppButton type="submit" loading={analyzing} disabled={!resumeFile || !jobDescription.trim()}>
                <Sparkles size={16} /> Analyze Application
              </AppButton>
            </form>
          </AppCard>

          <div className="xl:col-span-3">
            {analyzing ? (
              <AppCard className="p-5">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Loader2 size={18} className="animate-spin" style={{ color: "var(--brand)" }} />
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text)" }}>
                    Analyzing your resume against this job description…
                  </p>
                </div>
                <div style={{ marginTop: "1rem" }}>
                  <LoadingState rows={4} />
                </div>
              </AppCard>
            ) : !result ? (
              <EmptyState
                icon={Target}
                title="No analysis yet"
                description="Upload a PDF, paste a job description, and run the analysis to see your Resume Match Score."
              />
            ) : (
              <div className="space-y-4">
                <AppCard className="p-5">
                  <p className="app-eyebrow">Resume Match Score</p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, margin: "0.25rem 0 0.5rem" }}>
                    <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-strong)" }}>
                      {result.overallScore}%
                    </span>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--brand)" }}>
                      {result.fitLevel}
                    </span>
                  </div>
                  <ScoreBar value={result.overallScore} />
                  <p style={{ margin: "0.8rem 0 0", fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text)" }}>
                    {result.summary}
                  </p>
                  {wasCached && (
                    <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--faint)" }}>
                      Served from a previous identical analysis.
                    </p>
                  )}
                </AppCard>

                <SectionCard icon={Target} title="Match Breakdown">
                  <div style={{ display: "grid", gap: 12 }}>
                    {BREAKDOWN_LABELS.map(({ key, label, weight }) => (
                      <div key={key}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.8rem",
                            marginBottom: 6,
                            color: "var(--text)",
                          }}
                        >
                          <span>
                            {label} <span style={{ color: "var(--faint)" }}>· weight {weight}</span>
                          </span>
                          <strong style={{ color: "var(--text-strong)" }}>{result.breakdown?.[key] ?? 0}%</strong>
                        </div>
                        <ScoreBar value={result.breakdown?.[key] ?? 0} />
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard icon={CheckCircle2} title="Matched Skills">
                  <TagList items={result.matchedSkills} />
                </SectionCard>

                <SectionCard icon={AlertTriangle} title="Missing Skills — Must Have">
                  <TagList items={result.missingSkills} />
                </SectionCard>

                <SectionCard icon={Lightbulb} title="Good to Have / Improvements">
                  <BulletList items={result.goodToHaveImprovements || []} />
                </SectionCard>

                <SectionCard icon={Flag} title="Final Recommendation">
                  <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.7, color: "var(--text)" }}>
                    {result.recommendation}
                  </p>
                </SectionCard>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

export default AiAnalyzer;
