// Tests for the AI Analyzer v11-groq contract: must-have gaps only, merged
// Good to Have / Improvements, context-respecting activity guard, 8-field
// response, backend-computed scores, Groq provider wiring (mocked SDK).
// Offline only — no AI provider calls. Run with:  npm test
const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  analyzeResumeForJD,
  validateAnalysis,
  validateRequirement,
  computeBreakdown,
  computeOverallScore,
  fitLevelForScore,
  buildUserMessage,
  diagnoseValidationFailure,
  toUserFriendlyError,
  cacheKey,
  GROQ_MODEL,
  AI_PROVIDER,
  PROMPT_VERSION,
} = require("../services/ai.service");

function req(overrides = {}) {
  return {
    requirement: "Node.js",
    category: "skillsTechnicalMatch",
    importance: "required",
    hardRequirement: false,
    material: true,
    evidence: "direct",
    resumeEvidence: "TrackMyHunt backend uses Node.js",
    ...overrides,
  };
}

function validPayload(overrides = {}) {
  return {
    requirements: [
      req(),
      req({ requirement: "React", evidence: "direct", resumeEvidence: "TrackMyHunt UI in React" }),
      req({ requirement: "PostgreSQL", evidence: "none", resumeEvidence: "" }),
      req({
        requirement: "B.Tech CS or equivalent",
        category: "education",
        evidence: "direct",
        resumeEvidence: "B.Tech ECE at IIIT Kota",
      }),
    ],
    summary: "Strong alignment with a genuine database gap.",
    matchedSkills: ["Node.js", "React"],
    missingSkills: ["PostgreSQL"],
    goodToHaveImprovements: ["Consider adding a small project using PostgreSQL."],
    recommendation: "Strong backend alignment with PostgreSQL as the main gap.",
    confidence: "high",
    ...overrides,
  };
}

describe("validateRequirement", () => {
  it("accepts a well-formed requirement", () => {
    assert.deepEqual(validateRequirement(req()), req());
  });

  it("rejects bad enums, empty text, and evidence contradictions", () => {
    assert.equal(validateRequirement(req({ category: "infra" })), null);
    // legacy split categories are no longer valid
    assert.equal(validateRequirement(req({ category: "skills" })), null);
    assert.equal(validateRequirement(req({ category: "technicalStack" })), null);
    assert.equal(validateRequirement(req({ importance: "must" })), null);
    assert.equal(validateRequirement(req({ evidence: "maybe" })), null);
    assert.equal(validateRequirement(req({ requirement: "  " })), null);
    assert.equal(validateRequirement(req({ hardRequirement: "yes" })), null);
    assert.equal(validateRequirement(req({ material: "yes" })), null);
    assert.equal(validateRequirement(req({ material: undefined })), null);
    // evidence "none" must not carry evidence text
    assert.equal(validateRequirement(req({ evidence: "none", resumeEvidence: "TrackMyHunt" })), null);
    assert.ok(validateRequirement(req({ evidence: "none", resumeEvidence: "" })));
  });
});

describe("score computation", () => {
  it("scores all-direct evidence as 100", () => {
    const breakdown = computeBreakdown([
      req({ category: "skillsTechnicalMatch" }),
      req({ category: "skillsTechnicalMatch", requirement: "DSA" }),
    ]);
    assert.equal(breakdown.skillsTechnicalMatch, 100);
  });

  it("scores all-missing evidence as 0", () => {
    const breakdown = computeBreakdown([req({ category: "skillsTechnicalMatch", evidence: "none", resumeEvidence: "" })]);
    assert.equal(breakdown.skillsTechnicalMatch, 0);
  });

  it("weights required above preferred and skips unlearned learn_on_job", () => {
    const breakdown = computeBreakdown([
      req({ category: "skillsTechnicalMatch", requirement: "JS", importance: "required", evidence: "direct" }),
      req({ category: "skillsTechnicalMatch", requirement: "Go", importance: "preferred", evidence: "none", resumeEvidence: "" }),
      req({ category: "skillsTechnicalMatch", requirement: "Rust", importance: "learn_on_job", evidence: "none", resumeEvidence: "" }),
    ]);
    // (1*1 + 0*0.5) / (1 + 0.5) = 66.7 -> 67
    assert.equal(breakdown.skillsTechnicalMatch, 67);
  });

  it("gives partial credit for listed_only / partial / transferable", () => {
    assert.equal(computeBreakdown([req({ category: "skillsTechnicalMatch", evidence: "listed_only" })]).skillsTechnicalMatch, 60);
    assert.equal(computeBreakdown([req({ category: "skillsTechnicalMatch", evidence: "partial" })]).skillsTechnicalMatch, 50);
    assert.equal(computeBreakdown([req({ category: "skillsTechnicalMatch", evidence: "transferable" })]).skillsTechnicalMatch, 35);
  });

  it("skips non-material misses so ordinary activities never reduce the score", () => {
    const breakdown = computeBreakdown([
      req({ category: "responsibilities", requirement: "Build REST APIs", evidence: "direct" }),
      req({ category: "responsibilities", requirement: "Code reviews", importance: "preferred", material: false, evidence: "none", resumeEvidence: "" }),
      req({ category: "responsibilities", requirement: "Documentation", importance: "preferred", material: false, evidence: "none", resumeEvidence: "" }),
    ]);
    assert.equal(breakdown.responsibilities, 100);
  });

  it("still penalizes material misses", () => {
    const breakdown = computeBreakdown([
      req({ category: "responsibilities", requirement: "Build REST APIs", evidence: "direct" }),
      req({ category: "responsibilities", requirement: "Build data pipelines", evidence: "none", resumeEvidence: "" }),
    ]);
    assert.equal(breakdown.responsibilities, 50);
  });

  it("demotes preferred ordinary activities with no evidence", () => {
    const clean = validateAnalysis(
      validPayload({
        requirements: [
          req({ category: "responsibilities", requirement: "Build REST APIs", evidence: "direct" }),
          req({ category: "responsibilities", requirement: "Debugging issues", importance: "preferred", evidence: "none", resumeEvidence: "" }),
          req({ category: "responsibilities", requirement: "Code review participation", importance: "preferred", evidence: "none", resumeEvidence: "" }),
        ],
        missingSkills: ["Debugging issues", "Code review participation", "PostgreSQL"],
      })
    );
    assert.ok(clean);
    assert.equal(clean.breakdown.responsibilities, 100);
    assert.deepEqual(clean.missingSkills, ["PostgreSQL"]);
  });

  it("respects explicitly required + material capabilities even when generic", () => {
    const clean = validateAnalysis(
      validPayload({
        requirements: [
          req({ category: "responsibilities", requirement: "Build REST APIs", evidence: "direct" }),
          req({
            category: "responsibilities",
            requirement: "Must have experience with unit and integration testing",
            importance: "required",
            material: true,
            evidence: "none",
            resumeEvidence: "",
          }),
        ],
        missingSkills: ["Unit and integration testing", "PostgreSQL"],
      })
    );
    assert.ok(clean);
    // (1*1 + 0*1) / 2 = 50: the explicit requirement keeps its full force.
    assert.equal(clean.breakdown.responsibilities, 50);
    assert.deepEqual(clean.missingSkills, ["Unit and integration testing", "PostgreSQL"]);
  });

  it("keeps tool-qualified testing requirements material", () => {
    const clean = validateAnalysis(
      validPayload({
        requirements: [
          req({
            category: "skillsTechnicalMatch",
            requirement: "Automation testing with Selenium",
            evidence: "none",
            resumeEvidence: "",
          }),
        ],
        missingSkills: ["Automation testing with Selenium"],
      })
    );
    assert.equal(clean.breakdown.skillsTechnicalMatch, 0);
    assert.deepEqual(clean.missingSkills, ["Automation testing with Selenium"]);
  });

  it("never demotes explicit knock-outs", () => {
    const clean = validateAnalysis(
      validPayload({
        requirements: [
          req({
            category: "responsibilities",
            requirement: "Minimum 3 years debugging large systems",
            hardRequirement: true,
            evidence: "none",
            resumeEvidence: "",
          }),
        ],
      })
    );
    assert.ok(clean.overallScore <= 39);
  });

  it("falls back to a conditional suggestion when Good to Have is empty", () => {
    const clean = validateAnalysis(validPayload({ goodToHaveImprovements: [] }));
    assert.equal(clean.goodToHaveImprovements.length, 1);
    assert.match(clean.goodToHaveImprovements[0], /If you have performed/);
  });

  it("scores an unasked category as 100", () => {
    assert.equal(computeBreakdown([req({ category: "skillsTechnicalMatch" })]).education, 100);
  });

  it("computes the weighted overall score from the merged breakdown", () => {
    const breakdown = { skillsTechnicalMatch: 80, experience: 70, responsibilities: 75, education: 90 };
    // 80*.55 + 70*.20 + 75*.15 + 90*.10 = 78.25 -> 78
    assert.equal(computeOverallScore(breakdown, []), 78);
  });

  it("caps the overall score when an explicit knock-out fails", () => {
    const breakdown = { skillsTechnicalMatch: 100, experience: 100, responsibilities: 100, education: 100 };
    const capped = computeOverallScore(
      breakdown,
      [req({ requirement: "Minimum 3 years", category: "experience", hardRequirement: true, evidence: "none", resumeEvidence: "" })]
    );
    assert.ok(capped <= 39);
    assert.equal(fitLevelForScore(capped), "Weak Match");
  });

  it("maps thresholds to fit levels", () => {
    assert.equal(fitLevelForScore(80), "Strong Match");
    assert.equal(fitLevelForScore(60), "Good Match");
    assert.equal(fitLevelForScore(40), "Partial Match");
    assert.equal(fitLevelForScore(39), "Weak Match");
  });
});

describe("validateAnalysis (prompt v8 schema)", () => {
  it("accepts a valid payload, computes scores, and returns exactly 8 fields", () => {
    const clean = validateAnalysis(validPayload());
    assert.ok(clean);
    // skillsTechnicalMatch: direct + direct + none -> (1+1+0)/3 = 67
    assert.equal(clean.breakdown.skillsTechnicalMatch, 67);
    assert.ok(!("skills" in clean.breakdown));
    assert.ok(!("technicalStack" in clean.breakdown));
    assert.equal(clean.fitLevel, fitLevelForScore(clean.overallScore));
    assert.deepEqual(
      Object.keys(clean).sort(),
      ["breakdown", "fitLevel", "goodToHaveImprovements", "matchedSkills", "missingSkills", "overallScore", "recommendation", "summary"]
    );
    assert.ok(!("requirements" in clean));
    assert.ok(!("confidence" in clean));
    assert.ok(!("experienceGaps" in clean));
    assert.ok(!("resumeImprovements" in clean));
  });

  it("never reads scores from the model", () => {
    const clean = validateAnalysis(
      validPayload({ overallScore: 100, fitLevel: "Weak Match", breakdown: { skills: 0 } })
    );
    assert.ok(clean);
    assert.notEqual(clean.overallScore, 100);
    assert.equal(clean.fitLevel, fitLevelForScore(clean.overallScore));
  });

  it("trims display lists to their maxima instead of failing", () => {
    const clean = validateAnalysis(
      validPayload({
        matchedSkills: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"],
        missingSkills: ["1", "2", "3", "4", "5", "6"],
      })
    );
    assert.equal(clean.matchedSkills.length, 10);
    assert.equal(clean.missingSkills.length, 5);
  });

  it("trims goodToHaveImprovements to 8 instead of failing", () => {
    const clean = validateAnalysis(
      validPayload({ goodToHaveImprovements: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] })
    );
    assert.equal(clean.goodToHaveImprovements.length, 8);
  });

  it("rejects payloads missing the new goodToHaveImprovements field", () => {
    assert.equal(validateAnalysis(validPayload({ goodToHaveImprovements: undefined })), null);
    assert.equal(validateAnalysis(validPayload({ goodToHaveImprovements: "improve" })), null);
  });

  it("passes model error objects through", () => {
    assert.deepEqual(validateAnalysis({ error: "RESUME_UNREADABLE" }), { error: "RESUME_UNREADABLE" });
    assert.deepEqual(validateAnalysis({ error: "JD_INSUFFICIENT" }), { error: "JD_INSUFFICIENT" });
    assert.equal(validateAnalysis({ error: "SOMETHING_ELSE" }), null);
  });

  it("rejects structural problems", () => {
    assert.equal(validateAnalysis(validPayload({ requirements: [] })), null);
    assert.equal(validateAnalysis(validPayload({ requirements: "reqs" })), null);
    assert.equal(
      validateAnalysis(validPayload({ requirements: [req({ evidence: "maybe" })] })),
      null
    );
    assert.equal(validateAnalysis(validPayload({ summary: "  " })), null);
    assert.equal(validateAnalysis(validPayload({ matchedSkills: "Node" })), null);
  });
});

describe("domain-agnostic backend (synthetic fixtures)", () => {
  it("scores a Sales JD without software assumptions", () => {
    const clean = validateAnalysis(
      validPayload({
        requirements: [
          req({ requirement: "Salesforce", evidence: "direct", resumeEvidence: "Managed accounts in Salesforce" }),
          req({ requirement: "B2B enterprise sales", evidence: "transferable", resumeEvidence: "3 years B2C sales" }),
          req({ requirement: "Quota attainment", importance: "required", evidence: "none", resumeEvidence: "" }),
        ],
        matchedSkills: ["Salesforce"],
        missingSkills: ["Quota attainment"],
        goodToHaveImprovements: ["Quantify quota attainment if applicable."],
        summary: "Strong tooling alignment with a quota evidence gap.",
        recommendation: "Highlight Salesforce wins and quantify quota results.",
      })
    );
    assert.ok(clean);
    // (1*1 + 0.35*1 + 0*1) / 3 = 45
    assert.equal(clean.breakdown.skillsTechnicalMatch, 45);
    assert.deepEqual(clean.missingSkills, ["Quota attainment"]);
    assert.ok(!("requirements" in clean));
  });

  it("scores a Finance JD and keeps licensed knock-outs rare but effective", () => {
    const clean = validateAnalysis(
      validPayload({
        requirements: [
          req({ requirement: "Financial modeling", evidence: "direct", resumeEvidence: "Built DCF models" }),
          req({
            requirement: "CPA license",
            category: "education",
            hardRequirement: true,
            evidence: "none",
            resumeEvidence: "",
          }),
        ],
        matchedSkills: ["Financial modeling"],
        missingSkills: ["CPA license"],
        goodToHaveImprovements: [],
        summary: "Strong modeling alignment but missing a mandatory license.",
        recommendation: "A CPA license is mandatory for this role.",
      })
    );
    assert.ok(clean);
    assert.ok(clean.overallScore <= 39);
    assert.equal(clean.fitLevel, "Weak Match");
    // Empty Good to Have gets the conditional fallback, never an empty section.
    assert.equal(clean.goodToHaveImprovements.length, 1);
  });
});

describe("buildUserMessage", () => {
  it("sends full resume text plus JD without metadata-only labels", () => {
    const msg = buildUserMessage("Node.js developer with AWS Fundamentals", "Need AWS and Node.js");
    assert.match(msg, /Node\.js developer with AWS Fundamentals/);
    assert.match(msg, /Need AWS and Node\.js/);
    assert.doesNotMatch(msg, /RESUME TITLE|RESUME LINK|RESUME PROFILE/);
  });
});

describe("groq provider wiring (mocked SDK, no network)", () => {
  it("uses the groq provider, model, and versioned prompt", () => {
    assert.equal(AI_PROVIDER, "groq");
    assert.equal(GROQ_MODEL, "openai/gpt-oss-120b");
    assert.equal(PROMPT_VERSION, "v11-groq");
  });

  it("builds cache keys from provider + model + version + user + content + JD", () => {
    const a = cacheKey("u1", "upload:abc", "Software Engineer JD with Node");
    const b = cacheKey("u1", "upload:abc", "Software Engineer JD with Node");
    assert.equal(a, b);
    assert.equal(a.length, 64); // sha256 hex
    // User isolation: same content, different user -> different key.
    assert.notEqual(a, cacheKey("u2", "upload:abc", "Software Engineer JD with Node"));
    // Content sensitivity: different fingerprint -> different key.
    assert.notEqual(a, cacheKey("u1", "upload:xyz", "Software Engineer JD with Node"));
    // JD sensitivity (normalized): different JD -> different key.
    assert.notEqual(a, cacheKey("u1", "upload:abc", "Data Analyst JD with SQL"));
    // Whitespace-only JD differences hit the same entry.
    assert.equal(a, cacheKey("u1", "upload:abc", "Software  Engineer   JD with Node"));
  });

  it("never returns a Gemini-era cache entry (provider+model+version in key)", () => {
    const crypto = require("crypto");
    const legacy = crypto
      .createHash("sha256")
      .update("gemini|gemini-3.8-flash|v10-gemini-3.8|u1|upload:abc|software engineer jd with node")
      .digest("hex");
    assert.notEqual(cacheKey("u1", "upload:abc", "Software Engineer JD with Node"), legacy);
  });

  it("maps provider errors to distinct user-safe statuses", () => {
    const rateLimited = toUserFriendlyError({ status: 429, message: "Rate limit reached for model" });
    assert.equal(rateLimited.statusCode, 429);
    assert.equal(rateLimited.message, "AI usage limit reached. Please try again in a little while.");
    const badKey = toUserFriendlyError({ status: 401, message: "Invalid API Key" });
    assert.equal(badKey.statusCode, 503);
    const forbidden = toUserFriendlyError({ status: 403, message: "Forbidden" });
    assert.equal(forbidden.statusCode, 503);
    const badRequest = toUserFriendlyError({ status: 400, message: "Invalid request" });
    assert.equal(badRequest.statusCode, 400);
    assert.equal(badRequest.message, "The analysis request was invalid. Please check your input and try again.");
    const timeout = toUserFriendlyError({ name: "TimeoutError", message: "timed out after 60000ms" });
    assert.equal(timeout.statusCode, 504);
    const generic = toUserFriendlyError({ status: 500, message: "internal error" });
    assert.equal(generic.statusCode, 502);
    // Never leaks key material or raw provider text.
    for (const err of [rateLimited, badKey, timeout, generic]) {
      assert.doesNotMatch(err.message, /groq_api_key|gsk_/i);
    }
  });

  it("fails closed with 503 when groq_api_key is missing (no network call)", async () => {
    const saved = process.env.groq_api_key;
    delete process.env.groq_api_key;
    try {
      await assert.rejects(
        analyzeResumeForJD({
          userId: "u1",
          resumeId: "upload:missing-key-probe",
          resumeText: "Node.js developer with five years of backend experience building REST APIs.",
          jobDescription: "Software Engineer role requiring Node.js and REST API experience with code reviews.",
        }),
        (err) => err.statusCode === 503 && /not configured/i.test(err.message)
      );
    } finally {
      if (saved !== undefined) process.env.groq_api_key = saved;
    }
  });

  describe("mocked groq chat-completions pipeline", () => {
    const groqPath = require.resolve("groq-sdk");
    const calls = [];
    // Mutable per-test behavior for the stubbed provider.
    const behavior = { type: "success", content: "", status: 429, message: "Rate limit reached" };
    // Dummy key so apiKey checks pass; the stub never touches the network.
    if (!process.env.groq_api_key) process.env.groq_api_key = "unit-test-key";

    class FakeGroq {
      constructor() {
        this.chat = {
          completions: {
            create: async (params) => {
              calls.push(params);
              if (behavior.type === "error") {
                const err = new Error(behavior.message);
                err.status = behavior.status;
                throw err;
              }
              return { choices: [{ message: { content: behavior.content } }] };
            },
          },
        };
      }
    }

    require.cache[groqPath] = {
      id: groqPath,
      filename: groqPath,
      loaded: true,
      exports: FakeGroq,
    };

    const jd = "Software Engineer role requiring Node.js and REST API experience with code reviews. Extra context to pass validation length checks here.";

    it("runs the full pipeline and ignores model-invented scores", async () => {
      behavior.type = "success";
      behavior.content = JSON.stringify({
        ...validPayload(),
        overallScore: 3,
        fitLevel: "Hired",
      });
      calls.length = 0;
      const first = await analyzeResumeForJD({
        userId: "mock-user",
        resumeId: "upload:mock-resume-1",
        resumeText: "Node.js developer with REST API experience.",
        jobDescription: jd,
      });
      assert.equal(first.cached, false);
      // Groq request shape: chat completions, pinned model, JSON mode, temp 0.
      assert.equal(calls.length, 1);
      assert.equal(calls[0].model, "openai/gpt-oss-120b");
      assert.equal(calls[0].temperature, 0);
      assert.deepEqual(calls[0].response_format, { type: "json_object" });
      assert.equal(calls[0].messages[0].role, "system");
      assert.equal(calls[0].messages[1].role, "user");
      // Backend owns the score: junk model scores are ignored.
      assert.notEqual(first.analysis.overallScore, 3);
      assert.equal(first.analysis.fitLevel, fitLevelForScore(first.analysis.overallScore));
      const second = await analyzeResumeForJD({
        userId: "mock-user",
        resumeId: "upload:mock-resume-1",
        resumeText: "Node.js developer with REST API experience.",
        jobDescription: jd,
      });
      assert.equal(second.cached, true);
      assert.deepEqual(second.analysis, first.analysis);
      assert.equal(calls.length, 1); // cache hit: no second provider call
    });

    it("maps a Groq 429 to the rate-limit message", async () => {
      behavior.type = "error";
      behavior.status = 429;
      behavior.message = "Rate limit reached for model openai/gpt-oss-120b";
      await assert.rejects(
        analyzeResumeForJD({
          userId: "mock-user",
          resumeId: "upload:mock-429",
          resumeText: "Node.js developer with REST API experience.",
          jobDescription: jd,
        }),
        (err) =>
          err.statusCode === 429 &&
          err.message === "AI usage limit reached. Please try again in a little while."
      );
    });

    it("maps malformed Groq output to 502 after one retry", async () => {
      behavior.type = "success";
      behavior.content = "this is not JSON {{{";
      calls.length = 0;
      await assert.rejects(
        analyzeResumeForJD({
          userId: "mock-user",
          resumeId: "upload:mock-malformed",
          resumeText: "Node.js developer with REST API experience.",
          jobDescription: jd,
        }),
        (err) => err.statusCode === 502
      );
      assert.equal(calls.length, 2); // initial attempt + exactly one retry
    });

    it("maps model error verdicts without retrying them as provider errors", async () => {
      behavior.type = "success";
      behavior.content = JSON.stringify({ error: "JD_INSUFFICIENT" });
      calls.length = 0;
      await assert.rejects(
        analyzeResumeForJD({
          userId: "mock-user",
          resumeId: "upload:mock-verdict",
          resumeText: "Node.js developer with REST API experience.",
          jobDescription: jd,
        }),
        (err) => err.statusCode === 400
      );
      assert.equal(calls.length, 1); // determinate verdict: no retry
    });
  });
});

describe("diagnoseValidationFailure (temporary diagnostic, content-free)", () => {
  it("names the failing requirement index and field without leaking text", () => {
    const reason = diagnoseValidationFailure(
      validPayload({
        requirements: [
          req(),
          req({ requirement: "Bad one", category: "nope", resumeEvidence: "Database work at day job" }),
        ],
      })
    );
    assert.equal(reason, "requirement[1]-bad-category");
  });

  it("reports over-count requirements", () => {
    const many = Array.from({ length: 26 }, (_, i) => req({ requirement: `R${i}` }));
    assert.equal(diagnoseValidationFailure(validPayload({ requirements: many })), "requirements-count-26");
  });

  it("reports missing sections and bad lists", () => {
    assert.equal(diagnoseValidationFailure(validPayload({ summary: "  " })), "missing-summary");
    assert.equal(
      diagnoseValidationFailure(validPayload({ matchedSkills: "Node" })),
      "bad-matchedSkills"
    );
  });
});
