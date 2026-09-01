"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Film,
  CheckSquare,
  Square,
  EyeOff,
  Link2,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ToastStack, Toast } from "@/components/ToastStack";
import { CycleProgressRing } from "@/components/CycleProgressRing";
import { ThemeSwitcher, applyTheme } from "@/components/ThemeSwitcher";
import { ListChecks, Settings } from "lucide-react";

type Account = {
  _id: string;
  name: string;
  googleConnectedEmail?: string;
  youtubeChannelId?: string;
  themeId?: string;
  useSeriesNumbering?: boolean;
  seriesLabel?: string;
};

type Post = {
  _id: string;
  driveFileName?: string;
  caption?: string;
  hashtags?: string[];
  detectedCharacter?: string;
  detectedSource?: string;
  status: string;
  platform?: string;
  doNotPost?: boolean;
  coverFrameUrl?: string;
  repostRiskLevel?: "none" | "warning" | "high";
  repostRiskReasons?: string[];
};

type ScheduleStatus = {
  mode: string;
  daysElapsed?: number;
  totalDays?: number;
};

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [digest] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  async function toggleSeriesNumbering(enabled: boolean) {
    if (!account) return;
    setAccount({ ...account, useSeriesNumbering: enabled });
    await fetch("/api/accounts/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: account._id, useSeriesNumbering: enabled }),
    });
  }

  async function updateSeriesLabel(label: string) {
    if (!account) return;
    setAccount({ ...account, seriesLabel: label });
    await fetch("/api/accounts/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId: account._id, seriesLabel: label }),
    });
  }

  function pushToast(message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  }

  useEffect(() => {
    fetch("/api/videos")
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .finally(() => setLoading(false));

    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        const acc = d.accounts?.[0] || null;
        setAccount(acc);
        if (acc?.themeId) applyTheme(acc.themeId);
        if (acc) {
          fetch(`/api/schedule/status?accountId=${acc._id}`)
            .then((r) => r.json())
            .then(setScheduleStatus);
        }
      });
  }, []);

  const pending = posts.filter((p) => p.status === "pending_review");
  const queued = posts.filter((p) => p.status === "queued");
  const posted = posts.filter((p) => p.status === "posted");
  const drafts = posts.filter((p) => p.status === "draft");

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function approve(postId: string) {
    await fetch("/api/post/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, status: "queued" } : p)));
    pushToast("Approved and queued");
  }

  async function bulkApprove() {
    if (selected.size === 0) return;
    const count = selected.size;
    await fetch("/api/post/bulk-approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postIds: Array.from(selected) }),
    });
    setPosts((prev) =>
      prev.map((p) => (selected.has(p._id) ? { ...p, status: "queued" } : p))
    );
    setSelected(new Set());
    pushToast(`${count} clips queued`);
  }

  async function markDraft(postId: string) {
    await fetch("/api/post/toggle-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, doNotPost: true }),
    });
    setPosts((prev) => prev.map((p) => (p._id === postId ? { ...p, status: "draft" } : p)));
    pushToast("Saved as draft");
  }

  return (
    <div className="min-h-screen bg-ink text-cream">
      <ToastStack toasts={toasts} />

      <header className="border-b border-teal/40 bg-ink sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-5 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-cream">
              Content <span className="text-lime">Autopilot</span>
            </h1>
            <p className="text-teal-100/60 text-xs mt-0.5 text-cream/50">
              Drive → AI caption → scheduled posting
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/manage"
              className="flex items-center gap-1.5 text-xs border border-teal/40 text-cream/70 px-2.5 py-1.5 rounded-md hover:text-cream transition"
            >
              <ListChecks size={14} />
              <span className="hidden sm:inline">Manage</span>
            </Link>
            {account && (
              <ThemeSwitcher
                accountId={account._id}
                currentThemeId={account.themeId || "original"}
                onChange={(themeId) => setAccount({ ...account, themeId })}
              />
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 text-xs border border-teal/40 text-cream/70 px-2.5 py-1.5 rounded-md hover:text-cream transition"
            >
              <Settings size={14} />
            </button>
            {account?.googleConnectedEmail ? (
              <div className="flex items-center gap-1.5 text-xs text-lime bg-lime/10 border border-lime/30 px-2.5 py-1.5 rounded-md">
                <Link2 size={13} />
                <span className="hidden sm:inline">{account.googleConnectedEmail}</span>
                <span className="sm:hidden">Connected</span>
              </div>
            ) : (
              <a
                href={account ? `/api/auth/google?accountId=${account._id}` : "#"}
                className="flex items-center gap-1.5 text-xs bg-ember text-cream font-medium px-3 py-1.5 rounded-md hover:opacity-90 transition"
              >
                <Link2 size={13} />
                Connect Google
              </a>
            )}
          </div>
        </div>

        {showSettings && account && (
          <div className="max-w-4xl mx-auto px-5 pb-4">
            <div className="border border-teal/40 rounded-lg p-4 bg-teal/10 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-cream">Post numbering</p>
                  <p className="text-xs text-cream/40">Prefix captions with &quot;Post 1&quot;, &quot;Post 2&quot;, etc.</p>
                </div>
                <button
                  onClick={() => toggleSeriesNumbering(!account.useSeriesNumbering)}
                  className={`w-11 h-6 rounded-full transition relative ${
                    account.useSeriesNumbering ? "bg-lime" : "bg-teal/40"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-cream transition-transform ${
                      account.useSeriesNumbering ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {account.useSeriesNumbering && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-cream/50">Label:</p>
                  {["Post", "Part", "Ep"].map((label) => (
                    <button
                      key={label}
                      onClick={() => updateSeriesLabel(label)}
                      className={`text-xs px-2.5 py-1 rounded-md border ${
                        account.seriesLabel === label
                          ? "bg-lime text-ink border-lime"
                          : "border-teal/40 text-cream/50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-5 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <StatCard icon={<AlertCircle size={16} />} label="Pending" value={pending.length} accent="ember" />
          <StatCard icon={<Clock size={16} />} label="Queued" value={queued.length} accent="lime" pulse />
          <StatCard icon={<CheckCircle2 size={16} />} label="Posted" value={posted.length} accent="teal" />
          <StatCard icon={<EyeOff size={16} />} label="Drafts" value={drafts.length} accent="cream" />
        </div>

        {scheduleStatus && scheduleStatus.mode !== "not_started" && (
          <div className="mb-8">
            <CycleProgressRing
              daysElapsed={scheduleStatus.daysElapsed || 0}
              totalDays={scheduleStatus.totalDays || 30}
              mode={scheduleStatus.mode}
            />
          </div>
        )}

        {digest && (
          <div className="mb-8 rounded-lg border border-lime/30 bg-teal/20 p-4">
            <p className="text-xs font-medium text-lime uppercase tracking-wide mb-1.5">
              This week
            </p>
            <p className="text-sm text-cream/90 leading-relaxed">{digest}</p>
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-cream/60 uppercase tracking-wide">
              Pending Review
            </h2>
            {selected.size > 0 && (
              <button
                onClick={bulkApprove}
                className="text-xs bg-lime text-ink font-semibold px-3 py-1.5 rounded-md hover:opacity-90 transition"
              >
                Approve {selected.size} selected
              </button>
            )}
          </div>

          {loading && <p className="text-cream/40 text-sm">Loading…</p>}
          {!loading && pending.length === 0 && (
            <div className="border border-dashed border-teal/40 rounded-lg p-8 text-center">
              <Film size={22} className="mx-auto text-teal/60 mb-2" />
              <p className="text-cream/40 text-sm">
                All caught up — nothing waiting on you 🎬
              </p>
            </div>
          )}

          <div className="space-y-3">
            <AnimatePresence>
              {pending.map((p) => (
                <motion.div
                  key={p._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, scale: 0.97 }}
                  transition={{ duration: 0.25 }}
                  className="border border-teal/40 rounded-lg p-4 bg-teal/10 flex flex-col gap-3"
                >
                  {p.repostRiskLevel && p.repostRiskLevel !== "none" && (
                    <div
                      className={`flex items-start gap-2 text-xs rounded-md px-2.5 py-2 ${
                        p.repostRiskLevel === "high"
                          ? "bg-ember/20 text-ember border border-ember/30"
                          : "bg-ember/10 text-ember/80 border border-ember/20"
                      }`}
                    >
                      <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {p.repostRiskLevel === "high" ? "Reach risk" : "Heads up"}
                        </p>
                        {p.repostRiskReasons?.map((r, i) => (
                          <p key={i} className="text-cream/50 mt-0.5">{r}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <button onClick={() => toggleSelect(p._id)} className="mt-1 text-lime shrink-0">
                      {selected.has(p._id) ? <CheckSquare size={18} /> : <Square size={18} className="text-cream/30" />}
                    </button>

                    {p.coverFrameUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.coverFrameUrl}
                        alt=""
                        className="w-16 h-20 object-cover rounded-md border border-teal/40 shrink-0 bg-ink"
                      />
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-cream truncate">{p.driveFileName || "Untitled clip"}</p>
                        {p.platform && (
                          <span className="text-[10px] uppercase tracking-wide bg-ember/20 text-ember px-1.5 py-0.5 rounded shrink-0">
                            {p.platform}
                          </span>
                        )}
                      </div>
                      {p.detectedCharacter && (
                        <p className="text-xs text-cream/40 mt-0.5">
                          {p.detectedCharacter} — {p.detectedSource}
                        </p>
                      )}
                      <p className="text-sm text-cream/80 mt-2">{p.caption}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {p.hashtags?.map((h) => (
                          <span key={h} className="text-xs bg-ink/60 border border-teal/40 text-cream/50 px-2 py-0.5 rounded">
                            #{h.replace(/^#/, "")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pl-8">
                    <button
                      onClick={() => approve(p._id)}
                      className="flex-1 bg-lime text-ink text-sm font-semibold px-4 py-2.5 rounded-md hover:opacity-90 transition"
                    >
                      Approve &amp; Queue
                    </button>
                    <button
                      onClick={() => markDraft(p._id)}
                      className="text-sm text-cream/40 px-3 py-2.5 rounded-md border border-teal/40 hover:text-cream/70 transition"
                    >
                      Save as draft
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: "ember" | "lime" | "teal" | "cream";
  pulse?: boolean;
}) {
  const accentMap = {
    ember: "text-ember",
    lime: "text-lime",
    teal: "text-teal-300",
    cream: "text-cream/60",
  };
  return (
    <div className="border border-teal/40 rounded-lg p-3.5 bg-teal/10 relative">
      <div className={`${accentMap[accent]} mb-2 flex items-center gap-1.5`}>
        {icon}
        {pulse && value > 0 && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-lime" />
          </span>
        )}
      </div>
      <p className="text-xl font-semibold text-cream">{value}</p>
      <p className="text-[11px] text-cream/40 mt-0.5">{label}</p>
    </div>
  );
}
