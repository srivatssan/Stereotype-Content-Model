import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng } from "html-to-image";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  ReferenceArea,
  Label,
} from "recharts";

// ---------- Questionnaire items ----------
const WARMTH_ITEMS = [
  "…is trustworthy",
  "…has good intentions toward our team/org",
  "…is friendly and approachable",
  "…is honest and sincere",
  "…would cooperate rather than compete if resources were scarce",
];

const COMP_ITEMS = [
  "…is capable of achieving its goals",
  "…possesses the skills and expertise required for success",
  "…is efficient and reliable in execution",
  "…has the resources or status to get things done",
  "…earns respect for technical or strategic excellence",
];

const LIKERT = [1, 2, 3, 4, 5, 6, 7];

// ---------- Helpers ----------
function mean(nums) {
  if (!nums || !nums.length) return 0;
  return +(
    nums.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) / nums.length
  ).toFixed(2);
}

function quadrant(warmth, competence) {
  const highW = warmth >= 4;
  const highC = competence >= 4;
  if (highW && highC) return "Admired";
  if (highW && !highC) return "Paternalized";
  if (!highW && highC) return "Envied";
  return "Dehumanized";
}

function biasFor(q) {
  switch (q) {
    case "Admired":
      return { emotion: "Admiration", behavior: "Active & Passive Help" };
    case "Paternalized":
      return { emotion: "Pity", behavior: "Active Help, Passive Neglect" };
    case "Envied":
      return { emotion: "Envy", behavior: "Passive Help, Active Harm" };
    default:
      return { emotion: "Contempt", behavior: "Active & Passive Harm" };
  }
}

// Download a DOM node as PNG (lazy-load html2canvas)
// Download a DOM node as PNG (works around Tailwind v4 OKLCH by injecting safe hex styles)
async function downloadNodeAsPng(node, filename = "bias-map.png") {
  const html2canvas = (await import("html2canvas")).default;

  // Build a CSS override that forces sRGB hex colors in the cloned document
  const SAFE_CSS = `
    /* Scope overrides to the export container */
    #chart-export, #chart-export * {
      /* neutralize gradients & oklch variables */
      background-image: none !important;
      box-shadow: none !important;
    }
    /* Use solid, html2canvas-safe hex colors */
    #chart-export { background: #0b1220 !important; border-color: #334155 !important; }
    #chart-export .text-slate-300, 
    #chart-export, 
    #chart-export * { color: #e2e8f0 !important; }

    /* Recharts surfaces */
    #chart-export .recharts-cartesian-grid line { stroke: #334155 !important; }
    #chart-export .recharts-tooltip-wrapper { color: #e2e8f0 !important; }
  `;

  const canvas = await html2canvas(node, {
    backgroundColor: "#0b1220",
    scale: 2,
    // modify the cloned DOM before rendering
    onclone: (doc) => {
      // inject our safe stylesheet
      const style = doc.createElement("style");
      style.type = "text/css";
      style.appendChild(doc.createTextNode(SAFE_CSS));
      doc.head.appendChild(style);

      // also set explicit hex background on the immediate export blocks
      const panel = doc.getElementById("chart-export");
      if (panel) {
        panel.style.backgroundColor = "#0b1220";
        // if your header bar exists in the export area, set it as well
        const bars = panel.querySelectorAll("div");
        bars.forEach((el) => {
          const hasBarRole = el.textContent && el.textContent.includes("Interactive Scatter");
          if (hasBarRole) el.style.backgroundColor = "#0b1220";
        });
      }
    },
  });

  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = filename;
  a.click();
}


// ---------- Small UI shells ----------
function LikertRow({ label, value, onChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-3 sm:gap-4 w-full">
      <div className="text-slate-200 text-sm md:text-base sm:w-[46%]">{label}</div>
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-start sm:justify-end gap-2">
        {LIKERT.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={
              "h-10 w-10 rounded-md border text-sm transition " +
              (value === n
                ? "border-emerald-400 bg-emerald-400/20 text-emerald-200 shadow"
                : "border-slate-600 hover:border-slate-400 text-slate-300")
            }
            title={`${n}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={"rounded-2xl border border-slate-700 bg-slate-800/70 w-full " + className}>
      {children}
    </div>
  );
}

function CardHeader({ title, desc }) {
  return (
    <div className="px-4 sm:px-6 pt-5 pb-2">
      <h3 className="text-xl md:text-2xl font-semibold text-white">{title}</h3>
      {desc && <p className="text-slate-300 mt-1">{desc}</p>}
    </div>
  );
}

function CardBody({ children, className = "" }) {
  return <div className={"px-4 sm:px-6 pb-6 " + className}>{children}</div>;
}

const PulseDot = ({ color = "#22c55e" }) => (
  <span className="relative inline-block h-3 w-3">
    <span className="absolute inset-0 rounded-full opacity-40" style={{ background: color }} />
    <span className="absolute inset-0 rounded-full animate-ping" style={{ background: color }} />
    <span className="absolute inset-[3px] rounded-full" style={{ background: color }} />
  </span>
);

// ---------- Main App ----------
export default function App() {
  const [step, setStep] = useState(0);
  const [groups, setGroups] = useState(["Cloud Engineering", "Compliance (Regional)"]);

  const [answers, setAnswers] = useState(() => ({
    warmth: Object.fromEntries(groups.map((g) => [g, Array(WARMTH_ITEMS.length).fill(undefined)])),
    comp: Object.fromEntries(groups.map((g) => [g, Array(COMP_ITEMS.length).fill(undefined)])),
  }));

  const addGroup = () => {
    const name = prompt("Group / Team / Role name?");
    if (!name) return;
    if (groups.includes(name)) return alert("Group already exists");
    const next = [...groups, name];
    setGroups(next);
    setAnswers((prev) => ({
      warmth: { ...prev.warmth, [name]: Array(WARMTH_ITEMS.length).fill(undefined) },
      comp: { ...prev.comp, [name]: Array(COMP_ITEMS.length).fill(undefined) },
    }));
  };

  const removeGroup = (name) => {
    const next = groups.filter((g) => g !== name);
    setGroups(next);
    setAnswers((prev) => {
      const { [name]: _w, ...restW } = prev.warmth;
      const { [name]: _c, ...restC } = prev.comp;
      return { warmth: restW, comp: restC };
    });
  };

  const canContinue = useMemo(() => {
    if (step === 0) return groups.length > 0;
    if (step === 1) {
      return groups.every((g) =>
        [...(answers.warmth[g] || []), ...(answers.comp[g] || [])].every(
          (v) => typeof v === "number"
        )
      );
    }
    return true;
  }, [step, groups, answers]);

  const results = useMemo(() => {
    return groups.map((g) => {
      const wVals = (answers.warmth[g] || []).map((v) => v ?? 0);
      const cVals = (answers.comp[g] || []).map((v) => v ?? 0);
      const w = mean(wVals);
      const c = mean(cVals);
      const q = quadrant(w, c);
      const b = biasFor(q);
      return { group: g, warmth: w, competence: c, quadrant: q, ...b };
    });
  }, [groups, answers]);

  const qColor = {
    Admired: "#22c55e", // green-500
    Paternalized: "#eab308", // amber-500
    Envied: "#ef4444", // red-500
    Dehumanized: "#94a3b8", // slate-400
  };

  const ChartLegend = () => (
    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
      <span className="inline-flex items-center gap-2">
        <PulseDot color="#22c55e" /> Admired
      </span>
      <span className="inline-flex items-center gap-2">
        <PulseDot color="#eab308" /> Paternalized
      </span>
      <span className="inline-flex items-center gap-2">
        <PulseDot color="#ef4444" /> Envied
      </span>
      <span className="inline-flex items-center gap-2">
        <PulseDot color="#94a3b8" /> Dehumanized
      </span>
    </div>
  );

  return (
    <div className="min-h-screen w-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <header className="mb-6 w-full">
          <motion.h1
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight"
          >
            SCM + BIAS Map Survey
          </motion.h1>
          <p className="text-slate-300 mt-2 max-w-[90ch]">
            Rate how each group is perceived on <strong>warmth</strong> and <strong>competence</strong>. We’ll map them into
            quadrants and infer likely emotions & behaviors.
          </p>
        </header>

        {/* Stepper */}
        <div className="flex flex-wrap items-center gap-3 mb-8 text-sm w-full">
          {["Groups", "Survey", "BIAS Map"].map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={`h-8 w-8 grid place-items-center rounded-full border ${
                  step === i
                    ? "border-emerald-400 bg-emerald-400/20"
                    : i < step
                    ? "border-sky-400 bg-sky-400/10"
                    : "border-slate-600"
                }`}
              >
                {i + 1}
              </div>
              <span className={`${i === step ? "text-white" : "text-slate-400"}`}>{label}</span>
              {i < 2 && <span className="w-10 h-px bg-slate-600" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.section
              key="step0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <Card>
                <CardHeader
                  title="Choose groups to evaluate"
                  desc="Add teams/roles/stakeholders you want to place on the map."
                />
                <CardBody>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {groups.map((g) => (
                      <motion.div
                        key={g}
                        layout
                        className="group flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2"
                      >
                        <span className="text-slate-200">{g}</span>
                        <button
                          onClick={() => removeGroup(g)}
                          className="opacity-60 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </motion.div>
                    ))}
                  </div>
                  <button
                    onClick={addGroup}
                    className="rounded-xl border border-emerald-500/50 bg-emerald-500/15 px-4 py-2 text-emerald-200 hover:bg-emerald-500/25 transition"
                  >
                    + Add group
                  </button>
                </CardBody>
              </Card>
            </motion.section>
          )}

          {step === 1 && (
            <motion.section
              key="step1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              {groups.map((g) => (
                <Card key={g} className="mb-6">
                  <CardHeader title={`Rate: ${g}`} desc="Use 1 (low) to 7 (high)" />
                  <CardBody>
                    <div className="grid md:grid-cols-2 gap-6 w-full">
                      <div className="w-full">
                        <h4 className="text-slate-100 font-semibold mb-2">Warmth</h4>
                        {WARMTH_ITEMS.map((q, i) => (
                          <LikertRow
                            key={i}
                            label={q}
                            value={answers.warmth[g]?.[i]}
                            onChange={(v) =>
                              setAnswers((prev) => ({
                                ...prev,
                                warmth: {
                                  ...prev.warmth,
                                  [g]: (prev.warmth[g] || []).map((old, j) => (j === i ? v : old)),
                                },
                              }))
                            }
                          />
                        ))}
                      </div>
                      <div className="w-full">
                        <h4 className="text-slate-100 font-semibold mb-2">Competence</h4>
                        {COMP_ITEMS.map((q, i) => (
                          <LikertRow
                            key={i}
                            label={q}
                            value={answers.comp[g]?.[i]}
                            onChange={(v) =>
                              setAnswers((prev) => ({
                                ...prev,
                                comp: {
                                  ...prev.comp,
                                  [g]: (prev.comp[g] || []).map((old, j) => (j === i ? v : old)),
                                },
                              }))
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 text-slate-300 text-sm">
                      <span className="mr-4">
                        Warmth avg: <strong>{mean((answers.warmth[g] || []).map((v) => v || 0))}</strong>
                      </span>
                      <span>
                        Competence avg: <strong>{mean((answers.comp[g] || []).map((v) => v || 0))}</strong>
                      </span>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </motion.section>
          )}

          {step === 2 && (
            <motion.section
              key="step2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <div className="grid lg:grid-cols-12 gap-6 w-full">
                {/* Chart side */}
                <Card className="lg:col-span-7">
                  <CardHeader title="BIAS Map" desc="Y: Warmth, X: Competence (1–7). Threshold lines at 4." />
                  <CardBody>
                    <div className="mb-3">
                      <div className="flex flex-wrap items-center justify-start">
                        <ChartLegend />
                      </div>
                    </div>

                    {/* Full-width, viewport-tall chart area */}
                    <div
                      id="chart-export"
                      className="rounded-2xl overflow-hidden w-full border"
                      style={{ height: "60vh", background: "#0b1220", borderColor: "#334155" }}
                    >
                      <div style={{ background: "#0b1220", color: "#cbd5e1", padding: "8px 16px", fontSize: 12 }}>
                        Interactive Scatter
                      </div>
                      <div style={{ background: "#0b1220", width: "100%", height: "calc(60vh - 32px)" }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
                            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />

                            {/* Quadrant backgrounds */}
                            <ReferenceArea y1={7} y2={4} x1={4} x2={7} fill="#22c55e" fillOpacity={0.12} />
                            <ReferenceArea y1={7} y2={4} x1={1} x2={4} fill="#eab308" fillOpacity={0.12} />
                            <ReferenceArea y1={4} y2={1} x1={1} x2={4} fill="#94a3b8" fillOpacity={0.12} />
                            <ReferenceArea y1={4} y2={1} x1={4} x2={7} fill="#ef4444" fillOpacity={0.12} />

                            <XAxis type="number" dataKey="competence" domain={[1, 7]} tick={{ fill: "#cbd5e1" }}>
                              <Label value="Competence →" offset={-10} position="insideBottom" fill="#cbd5e1" />
                            </XAxis>
                            <YAxis type="number" dataKey="warmth" domain={[1, 7]} tick={{ fill: "#cbd5e1" }}>
                              <Label value="Warmth →" angle={-90} position="insideLeft" offset={10} fill="#cbd5e1" />
                            </YAxis>
                            <ZAxis type="number" range={[120, 220]} dataKey="z" />

                            <Tooltip
                              cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4" }}
                              contentStyle={{
                                background: "#0b1220",
                                border: "1px solid #334155",
                                borderRadius: 12,
                                color: "#e2e8f0",
                              }}
                              formatter={(v, k, p) => [
                                v,
                                k === "competence" ? "Competence" : k === "warmth" ? "Warmth" : p.payload.group,
                              ]}
                            />

                            {results.map((r, i) => (
                              <Scatter
                                key={r.group}
                                name={r.group}
                                data={[{ ...r, z: 180 + (i % 3) * 10 }]}
                                fill={qColor[r.quadrant]}
                                shape={(props) => (
                                  <g>
                                    <motion.circle
                                      cx={props.cx}
                                      cy={props.cy}
                                      r={8}
                                      fill={props.fill}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ duration: 0.5, delay: i * 0.1 }}
                                    />
                                    <motion.circle
                                      cx={props.cx}
                                      cy={props.cy}
                                      r={18}
                                      stroke={props.fill}
                                      strokeOpacity={0.5}
                                      fill="none"
                                      animate={{ r: [16, 22, 16], opacity: [0.6, 0.0, 0.6] }}
                                      transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                                    />
                                  </g>
                                )}
                              />
                            ))}
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => {
                          const el = document.getElementById("chart-export");
                          if (el) downloadNodeAsPng(el);
                        }}
                        className="rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2 text-slate-200 hover:bg-slate-700 transition"
                      >
                        ⬇️ Export chart (PNG)
                      </button>
                    </div>
                  </CardBody>
                </Card>

                {/* Insights side */}
                <div className="lg:col-span-5 w-full">
                  <div className="grid gap-6 w-full">
                    {results.map((r) => (
                      <Card key={r.group} className="w-full">
                        <CardBody>
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h4 className="text-lg font-semibold text-white truncate">{r.group}</h4>
                              <p className="text-slate-300 text-sm">
                                Warmth <span className="font-semibold">{r.warmth}</span> • Competence{" "}
                                <span className="font-semibold">{r.competence}</span>
                              </p>
                            </div>
                            <span
                              className="text-xs rounded-full px-2 py-1 shrink-0"
                              style={{
                                background: qColor[r.quadrant] + "22",
                                color: qColor[r.quadrant],
                              }}
                            >
                              {r.quadrant}
                            </span>
                          </div>
                          <div className="mt-3 text-slate-200">
                            <div className="text-sm">
                              Emotion: <span className="font-semibold">{r.emotion}</span>
                            </div>
                            <div className="text-sm">
                              Behavior: <span className="font-semibold">{r.behavior}</span>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Footer controls */}
        <div className="mt-8 flex items-center justify-between w-full">
          <button
            onClick={() => setStep((s) => (s > 0 ? s - 1 : s))}
            className="rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2 text-slate-200 hover:bg-slate-700 transition"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            {step < 2 ? (
              <button
                disabled={!canContinue}
                onClick={() => setStep((s) => s + 1)}
                className={`rounded-xl px-4 py-2 transition ${
                  canContinue
                  ? "border border-slate-600 bg-slate-800/60 text-slate-200 hover:bg-slate-700"
                  : "border border-slate-700 bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}

              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => setStep(0)}
                className="rounded-xl border border-slate-600 bg-slate-800/60 px-4 py-2 text-slate-200 hover:bg-slate-700 transition"
              >
                Start over
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
