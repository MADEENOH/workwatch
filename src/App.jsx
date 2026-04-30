import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const LEAFLET_ASSET_BASE = "https://unpkg.com/leaflet@1.9.4/dist/images/";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: `${LEAFLET_ASSET_BASE}marker-icon-2x.png`,
  iconUrl: `${LEAFLET_ASSET_BASE}marker-icon.png`,
  shadowUrl: `${LEAFLET_ASSET_BASE}marker-shadow.png`,
});

const ARCHETYPE_DETAILS = {
  Micromanager: "High control, low autonomy",
  "Burnout Driver": "Unrealistic workload expectations",
  "Credit Stealer": "Takes credit for team work",
  Mentor: "Supports growth and development",
  "Career Accelerator": "Actively promotes advancement",
};

const ARCHETYPES = Object.keys(ARCHETYPE_DETAILS);

const US_CENTER = [39.8283, -98.5795];
const US_DEFAULT_ZOOM = 4;

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
        tags: ["Micromanager", "Burnout Driver", "Mentor"],
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

const SAMPLE_REVIEWS = [
  {
    id: "sample-wf-charlotte-1",
    branchId: "wf-charlotte",
    role: "Operations Analyst",
    text: "My supervisor reviews every small change and expects approvals before we can move work forward, which slows the team down.",
    tags: ["Micromanager"],
    verified: true,
    createdAt: "Apr 12, 2026",
    emailHash: "sample-verified-wf-charlotte-1",
  },
  {
    id: "sample-wf-charlotte-2",
    branchId: "wf-charlotte",
    role: "Branch Associate",
    text: "Weekend coverage became routine during quarter close, and the staffing plan never matched the workload.",
    tags: ["Burnout Driver"],
    verified: true,
    createdAt: "Apr 8, 2026",
    emailHash: "sample-verified-wf-charlotte-2",
  },
  {
    id: "sample-wf-charlotte-3",
    branchId: "wf-charlotte",
    role: "Supervisor",
    text: "There are a few helpful leads, but the dominant style is high pressure and constant status checking.",
    tags: ["Micromanager", "Burnout Driver"],
    verified: false,
    createdAt: "Mar 29, 2026",
    emailHash: "sample-unverified-wf-charlotte-3",
  },
  {
    id: "sample-wf-san-francisco-1",
    branchId: "wf-san-francisco",
    role: "Relationship Manager",
    text: "My manager created stretch assignments and gave useful feedback after client meetings.",
    tags: ["Mentor", "Career Accelerator"],
    verified: true,
    createdAt: "Apr 11, 2026",
    emailHash: "sample-verified-wf-sf-1",
  },
  {
    id: "sample-wf-san-francisco-2",
    branchId: "wf-san-francisco",
    role: "Analyst",
    text: "Leadership actively advocated for promotions and made sure junior staff had visibility with directors.",
    tags: ["Career Accelerator"],
    verified: true,
    createdAt: "Apr 2, 2026",
    emailHash: "sample-verified-wf-sf-2",
  },
  {
    id: "sample-wf-san-francisco-3",
    branchId: "wf-san-francisco",
    role: "Operations Lead",
    text: "The team has high standards, but coaching is patient and the feedback is usually specific enough to act on.",
    tags: ["Mentor"],
    verified: false,
    createdAt: "Mar 25, 2026",
    emailHash: "sample-unverified-wf-sf-3",
  },
  {
    id: "sample-jpm-new-york-1",
    branchId: "jpm-new-york",
    role: "Associate",
    text: "A senior manager used my client deck in a steering meeting and presented the strategy as their own.",
    tags: ["Credit Stealer"],
    verified: true,
    createdAt: "Apr 14, 2026",
    emailHash: "sample-verified-jpm-ny-1",
  },
  {
    id: "sample-jpm-new-york-2",
    branchId: "jpm-new-york",
    role: "Analyst",
    text: "The team gets strong exposure, but the workload spikes are unrealistic and late-night requests are normalized.",
    tags: ["Burnout Driver", "Career Accelerator"],
    verified: true,
    createdAt: "Apr 6, 2026",
    emailHash: "sample-verified-jpm-ny-2",
  },
  {
    id: "sample-jpm-new-york-3",
    branchId: "jpm-new-york",
    role: "Manager",
    text: "Recognition is inconsistent. People who prepare the analysis are not always credited when results are presented upward.",
    tags: ["Credit Stealer"],
    verified: false,
    createdAt: "Mar 30, 2026",
    emailHash: "sample-unverified-jpm-ny-3",
  },
  {
    id: "sample-jpm-chicago-1",
    branchId: "jpm-chicago",
    role: "Client Service Associate",
    text: "My manager is a steady mentor who gives direct feedback without making mistakes feel career limiting.",
    tags: ["Mentor"],
    verified: true,
    createdAt: "Apr 10, 2026",
    emailHash: "sample-verified-jpm-chicago-1",
  },
  {
    id: "sample-jpm-chicago-2",
    branchId: "jpm-chicago",
    role: "Supervisor",
    text: "The branch lead helped me prepare for a lateral move and introduced me to partners in another group.",
    tags: ["Career Accelerator", "Mentor"],
    verified: true,
    createdAt: "Apr 4, 2026",
    emailHash: "sample-verified-jpm-chicago-2",
  },
  {
    id: "sample-jpm-chicago-3",
    branchId: "jpm-chicago",
    role: "Operations Analyst",
    text: "There are busy periods, but managers usually adjust priorities and protect the team from unnecessary escalation.",
    tags: ["Mentor"],
    verified: false,
    createdAt: "Mar 28, 2026",
    emailHash: "sample-unverified-jpm-chicago-3",
  },
  {
    id: "sample-amz-seattle-1",
    branchId: "amz-seattle",
    role: "Program Manager",
    text: "The pace is intense, but my manager sponsored me for a high-visibility roadmap review and helped frame the promotion case.",
    tags: ["Career Accelerator", "Burnout Driver"],
    verified: true,
    createdAt: "Apr 13, 2026",
    emailHash: "sample-verified-amz-seattle-1",
  },
  {
    id: "sample-amz-seattle-2",
    branchId: "amz-seattle",
    role: "Product Analyst",
    text: "Managers expect fast turnarounds and weekly metrics deep dives, but the best leaders still coach through ambiguity.",
    tags: ["Burnout Driver", "Mentor"],
    verified: true,
    createdAt: "Apr 3, 2026",
    emailHash: "sample-verified-amz-seattle-2",
  },
  {
    id: "sample-amz-seattle-3",
    branchId: "amz-seattle",
    role: "Engineering Manager",
    text: "Strong performers get real advancement opportunities, though the workload can crowd out recovery time.",
    tags: ["Career Accelerator", "Burnout Driver"],
    verified: false,
    createdAt: "Mar 27, 2026",
    emailHash: "sample-unverified-amz-seattle-3",
  },
  {
    id: "sample-amz-dallas-1",
    branchId: "amz-dallas",
    role: "Area Manager",
    text: "Hourly targets changed with little warning, and managers pushed overtime instead of fixing process gaps.",
    tags: ["Burnout Driver"],
    verified: true,
    createdAt: "Apr 9, 2026",
    emailHash: "sample-verified-amz-dallas-1",
  },
  {
    id: "sample-amz-dallas-2",
    branchId: "amz-dallas",
    role: "Operations Lead",
    text: "My manager tracked every decision and reversed small calls after the fact, which made supervisors hesitant to act.",
    tags: ["Micromanager"],
    verified: true,
    createdAt: "Apr 1, 2026",
    emailHash: "sample-verified-amz-dallas-2",
  },
  {
    id: "sample-amz-dallas-3",
    branchId: "amz-dallas",
    role: "Supervisor",
    text: "The culture rewards speed, but burnout is high and autonomy is low during peak periods.",
    tags: ["Burnout Driver", "Micromanager"],
    verified: false,
    createdAt: "Mar 24, 2026",
    emailHash: "sample-unverified-amz-dallas-3",
  },
];

function sampleEmailHash(index) {
  return `${(index + 1).toString(16).padStart(2, "0")}${"a4f7c9e2b6d1038f".repeat(4)}`.slice(0, 64);
}

const SEEDED_REVIEWS = SAMPLE_REVIEWS.map((review, index) => ({
  ...review,
  emailHash: sampleEmailHash(index),
}));

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

function riskLabel(score) {
  if (score >= 75) return "High Risk Environment";
  if (score >= 55) return "Watch list";
  return "Stable";
}

function ArchetypeTag({ tag, subtle = false }) {
  return (
    <span className="group relative inline-flex">
      <span
        className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${
          subtle
            ? "border-slate-700 bg-slate-800 text-slate-300"
            : "border-slate-700 bg-slate-800 text-slate-100"
        }`}
        title={`${tag}: ${ARCHETYPE_DETAILS[tag]}`}
      >
        {tag}
      </span>
      <span className="pointer-events-none absolute bottom-full left-0 z-[1200] mb-2 hidden w-56 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium leading-5 text-slate-200 shadow-xl group-hover:block group-focus-within:block">
        <strong className="text-white">{tag}</strong>: {ARCHETYPE_DETAILS[tag]}
      </span>
    </span>
  );
}

function createBranchIcon(branch, isSelected) {
  const size = isSelected ? 34 : 26;
  const ring = isSelected ? "ring-4 ring-white/25" : "ring-2 ring-slate-950/60";

  return L.divIcon({
    className: "",
    html: `
      <button
        aria-label="${branch.company.name} ${branch.city}"
        class="grid place-items-center rounded-full border-2 border-white shadow-xl ${ring}"
        style="height:${size}px;width:${size}px;background:${branch.company.color}"
      >
        <span class="h-2 w-2 rounded-full bg-white"></span>
      </button>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function App() {
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const didSkipInitialFlyToRef = useRef(false);
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);
  const [reviews, setReviews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ text: "", role: "Supervisor", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allReviews = useMemo(() => [...reviews, ...SEEDED_REVIEWS], [reviews]);
  const branchReviews = allReviews.filter((review) => review.branchId === selectedBranch.id);
  const cardTags = useMemo(() => {
    const reviewTags = branchReviews.flatMap((review) => review.tags);
    return [...new Set([...selectedBranch.tags, ...reviewTags])];
  }, [branchReviews, selectedBranch]);

  useEffect(() => {
    const map = L.map("workwatch-map", {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: true,
    }).setView(US_CENTER, US_DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      crossOrigin: true,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const refreshMapSize = () => {
      window.requestAnimationFrame(() => map.invalidateSize({ animate: true }));
    };

    const mapElement = document.getElementById("workwatch-map");
    if (mapElement && "ResizeObserver" in window) {
      resizeObserverRef.current = new ResizeObserver(refreshMapSize);
      resizeObserverRef.current.observe(mapElement);
    }

    refreshMapSize();
    const initialResize = window.setTimeout(refreshMapSize, 250);
    window.addEventListener("resize", refreshMapSize);

    return () => {
      window.clearTimeout(initialResize);
      window.removeEventListener("resize", refreshMapSize);
      resizeObserverRef.current?.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!layerRef.current) return;

    layerRef.current.clearLayers();
    BRANCHES.forEach((branch) => {
      const isSelected = selectedBranch.id === branch.id;

      L.marker(branch.coords, { icon: createBranchIcon(branch, isSelected), keyboard: true })
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
    if (!mapRef.current) return;
    if (!didSkipInitialFlyToRef.current) {
      didSkipInitialFlyToRef.current = true;
      mapRef.current.setView(US_CENTER, US_DEFAULT_ZOOM);
      window.setTimeout(() => mapRef.current?.invalidateSize({ animate: true }), 100);
      return;
    }

    mapRef.current.flyTo(selectedBranch.coords, 5, {
      animate: true,
      duration: 0.65,
    });
    window.setTimeout(() => mapRef.current?.invalidateSize({ animate: true }), 100);
  }, [selectedBranch]);

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
        #workwatch-map {
          min-height: 500px;
          height: 100%;
          width: 100%;
          background: #020617;
        }
        .leaflet-container {
          min-height: 500px;
          height: 100%;
          width: 100%;
          font-family: Inter, ui-sans-serif, system-ui, sans-serif;
        }
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

      <section className="grid min-h-screen grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)]">
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
            <div className="flex items-start justify-between gap-3">
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
                <p className="mt-1 text-[11px] font-bold uppercase tracking-wide">
                  {riskLabel(selectedBranch.riskScore)}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-400">
              Calculated from review sentiment and manager archetypes
            </p>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-500 transition-all duration-700 ease-out"
                style={{ width: `${selectedBranch.riskScore}%` }}
              />
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-300">Manager Archetypes</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {cardTags.map((tag) => (
                  <ArchetypeTag key={tag} tag={tag} />
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

            {branchReviews.map((review) => (
              <article
                key={review.id}
                className="rounded-lg border border-slate-800 bg-slate-900/55 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{review.role}</p>
                    <p className="text-xs text-slate-500">{review.createdAt}</p>
                  </div>
                  {review.verified && (
                    <span className="rounded-md border border-emerald-300/30 bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-200">
                      Verified
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-300">{review.text}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {review.tags.map((tag) => (
                    <ArchetypeTag key={tag} tag={tag} subtle />
                  ))}
                </div>
                <p className="mt-3 truncate text-xs text-slate-500">
                  SHA-256: {review.emailHash}
                </p>
              </article>
            ))}
          </div>
        </aside>

        <section className="relative h-[540px] min-h-[500px] overflow-hidden lg:h-screen">
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

createRoot(document.getElementById("root")).render(<App />);
