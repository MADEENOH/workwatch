const { useEffect, useMemo, useRef, useState } = React;

const ARCHETYPES = [
  "Micromanager",
  "Burnout Driver",
  "Credit Stealer",
  "Mentor",
  "Career Accelerator",
];

const KEYWORDS = {
  Micromanager: ["micromanage", "watching", "hover", "control", "nitpick", "approval", "every detail"],
  "Burnout Driver": ["burnout", "overtime", "weekend", "exhausted", "unrealistic", "understaffed", "pressure"],
  "Credit Stealer": ["credit", "stole", "stolen", "idea", "presentation", "recognition", "blame"],
  Mentor: ["mentor", "coached", "supportive", "patient", "feedback", "growth", "helped"],
  "Career Accelerator": ["promoted", "career", "opportunity", "sponsor", "advocated", "stretch", "visibility"],
};

const COMPANIES = [
  {
    id: "wells-fargo",
    name: "Wells Fargo",
    domain: "wellsfargo.com",
    color: "#f43f5e",
    branches: [
      {
        id: "wf-charlotte",
        name: "Charlotte Operations",
        city: "Charlotte, NC",
        coords: [35.2271, -80.8431],
        riskScore: 76,
        tags: ["Micromanager", "Burnout Driver"],
      },
      {
        id: "wf-san-francisco",
        name: "Bay Area Corporate",
        city: "San Francisco, CA",
        coords: [37.7749, -122.4194],
        riskScore: 42,
        tags: ["Mentor", "Career Accelerator"],
      },
    ],
  },
  {
    id: "jpmorgan",
    name: "JPMorgan",
    domain: "jpmorgan.com",
    color: "#38bdf8",
    branches: [
      {
        id: "jpm-new-york",
        name: "Manhattan Banking Hub",
        city: "New York, NY",
        coords: [40.7128, -74.006],
        riskScore: 68,
        tags: ["Credit Stealer", "Burnout Driver"],
      },
      {
        id: "jpm-chicago",
        name: "Midwest Client Center",
        city: "Chicago, IL",
        coords: [41.8781, -87.6298],
        riskScore: 35,
        tags: ["Mentor"],
      },
    ],
  },
  {
    id: "amazon",
    name: "Amazon",
    domain: "amazon.com",
    color: "#f59e0b",
    branches: [
      {
        id: "amz-seattle",
        name: "Seattle Campus",
        city: "Seattle, WA",
        coords: [47.6062, -122.3321],
        riskScore: 59,
        tags: ["Career Accelerator", "Burnout Driver"],
      },
      {
        id: "amz-dallas",
        name: "North Texas Fulfillment",
        city: "Dallas, TX",
        coords: [32.7767, -96.797],
        riskScore: 83,
        tags: ["Micromanager", "Burnout Driver"],
      },
    ],
  },
];

const BRANCHES = COMPANIES.flatMap((company) =>
  company.branches.map((branch) => ({ ...branch, company }))
);

const initialBranch = BRANCHES[0];

function classifyReview(text) {
  const normalized = text.toLowerCase();
  const matches = ARCHETYPES.filter((type) =>
    KEYWORDS[type].some((keyword) => normalized.includes(keyword))
  );

  return matches.length ? matches : ["Mentor"];
}

async function sha256(value) {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function riskTone(score) {
  if (score >= 75) return "text-rose-300 bg-rose-500/10 border-rose-400/30";
  if (score >= 55) return "text-amber-200 bg-amber-500/10 border-amber-300/30";
  return "text-emerald-200 bg-emerald-500/10 border-emerald-300/30";
}

function App() {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);
  const [reviews, setReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ text: "", role: "Supervisor", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const branchReviews = reviews.filter((review) => review.branchId === selectedBranch.id);
  const cardTags = useMemo(() => {
    const reviewTags = branchReviews.flatMap((review) => review.tags);
    return [...new Set([...selectedBranch.tags, ...reviewTags])];
  }, [branchReviews, selectedBranch]);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("workwatch-map", {
        zoomControl: false,
        attributionControl: false,
      }).setView([39.5, -98.35], 4);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
      }).addTo(mapRef.current);

      L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
      layerRef.current = L.layerGroup().addTo(mapRef.current);
    }

    layerRef.current.clearLayers();
    BRANCHES.forEach((branch) => {
      const isSelected = selectedBranch.id === branch.id;
      const icon = L.divIcon({
        className: "",
        html: `<button class="grid h-${isSelected ? "9" : "7"} w-${isSelected ? "9" : "7"} place-items-center rounded-full border-2 border-white shadow-lg" style="background:${branch.company.color}"><span class="h-2 w-2 rounded-full bg-white"></span></button>`,
        iconSize: isSelected ? [36, 36] : [28, 28],
        iconAnchor: isSelected ? [18, 18] : [14, 14],
      });

      L.marker(branch.coords, { icon })
        .addTo(layerRef.current)
        .on("click", () => setSelectedBranch(branch))
        .bindTooltip(`${branch.company.name} · ${branch.city}`, {
          direction: "top",
          offset: [0, -12],
          opacity: 0.95,
        });
    });
  }, [selectedBranch]);

  useEffect(() => {
    setTimeout(() => mapRef.current?.invalidateSize(), 80);
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.text.trim() || !form.email.trim()) return;

    setIsSubmitting(true);
    const emailHash = await sha256(form.email);
    const domain = form.email.split("@").pop()?.toLowerCase().trim();
    const verified = domain === selectedBranch.company.domain;

    setReviews((current) => [
      {
        id: crypto.randomUUID(),
        branchId: selectedBranch.id,
        companyId: selectedBranch.company.id,
        role: form.role,
        text: form.text.trim(),
        tags: classifyReview(form.text),
        emailHash,
        verified,
        createdAt: new Date().toLocaleDateString(),
      },
      ...current,
    ]);

    setForm({ text: "", role: "Supervisor", email: "" });
    setIsSubmitting(false);
    setIsModalOpen(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <style>{`
        #workwatch-map { background: #020617; }
        .leaflet-container { font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
        .leaflet-tile { filter: saturate(.45) brightness(.72) contrast(1.12); }
        .leaflet-tooltip {
          border: 1px solid rgba(148, 163, 184, .28);
          border-radius: 8px;
          background: rgba(15, 23, 42, .94);
          color: #f8fafc;
          box-shadow: 0 16px 40px rgba(2, 6, 23, .35);
        }
        .leaflet-control-zoom a {
          background: rgba(15, 23, 42, .94);
          border-color: rgba(148, 163, 184, .24);
          color: #f8fafc;
        }
      `}</style>

      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[380px_1fr]">
        <aside className="border-b border-slate-800 bg-slate-950/95 p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-300">
                WorkWatch
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                Branch Risk Intelligence
              </h1>
            </div>
            <div className="rounded-md border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-sm font-semibold text-cyan-100">
              {BRANCHES.length} pins
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-400">{selectedBranch.company.name}</p>
                <h2 className="text-xl font-bold text-white">{selectedBranch.name}</h2>
                <p className="text-sm text-slate-400">{selectedBranch.city}</p>
              </div>
              <div
                className={`rounded-md border px-3 py-2 text-center ${riskTone(
                  selectedBranch.riskScore
                )}`}
              >
                <p className="text-xs font-medium uppercase tracking-wider">Risk</p>
                <p className="text-2xl font-black">{selectedBranch.riskScore}</p>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-500"
                style={{ width: `${selectedBranch.riskScore}%` }}
              />
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-300">Manager Archetypes</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {cardTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-6 w-full rounded-md bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Add Review
            </button>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Recent Reviews
              </h3>
              <span className="text-sm text-slate-500">{branchReviews.length}</span>
            </div>
            {branchReviews.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                No anonymous reviews yet for this branch.
              </div>
            ) : (
              branchReviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-lg border border-slate-800 bg-slate-900/55 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{review.role}</p>
                    {review.verified && (
                      <span className="rounded-md border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-200">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{review.text}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {review.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-800 px-2 py-1 text-xs text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 truncate text-xs text-slate-500">
                    SHA-256: {review.emailHash}
                  </p>
                </article>
              ))
            )}
          </div>
        </aside>

        <section className="relative min-h-[620px]">
          <div id="workwatch-map" className="absolute inset-0" />
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-slate-700 bg-slate-950/85 p-3 shadow-2xl backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Company Pins
            </p>
            <div className="mt-2 grid gap-2">
              {COMPANIES.map((company) => (
                <div key={company.id} className="flex items-center gap-2 text-sm text-slate-200">
                  <span
                    className="h-3 w-3 rounded-full border border-white/70"
                    style={{ background: company.color }}
                  />
                  {company.name}
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-cyan-200">
                  {selectedBranch.company.name} · {selectedBranch.city}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">Add Anonymous Review</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-300">Review</span>
              <textarea
                required
                rows="5"
                value={form.text}
                onChange={(event) => setForm({ ...form, text: event.target.value })}
                className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
                placeholder="Share what the manager culture feels like at this branch."
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-300">Role</span>
                <select
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition focus:border-cyan-300"
                >
                  <option>Supervisor</option>
                  <option>Manager</option>
                  <option>Associate</option>
                  <option>Analyst</option>
                  <option>Operations Lead</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-300">Verification Email</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300"
                  placeholder={`name@${selectedBranch.company.domain}`}
                />
              </label>
            </div>

            <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-3 text-sm text-slate-400">
              Email is SHA-256 hashed before it is stored. Reviews with a matching company
              domain receive a Verified badge.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 w-full rounded-md bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Hashing..." : "Submit Review"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
