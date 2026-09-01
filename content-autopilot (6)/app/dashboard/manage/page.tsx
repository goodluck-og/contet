"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Heart, MessageCircle, ChevronLeft, TrendingUp } from "lucide-react";
import { CycleProgressRing } from "@/components/CycleProgressRing";

type Post = {
  _id: string;
  driveFileName?: string;
  caption?: string;
  platform?: string;
  status: string;
  scheduledFor?: string;
  postedAt?: string;
  views24h?: number;
  likes?: number;
  comments?: number;
  coverFrameUrl?: string;
  partNumber?: number;
  seriesLabel?: string;
};

type Account = { _id: string };
type ScheduleStatus = { mode: string; daysElapsed?: number; totalDays?: number };

const STATUS_FILTERS = [
  { id: "all", label: "All" },
  { id: "queued", label: "Scheduled" },
  { id: "posted", label: "Posted" },
  { id: "draft", label: "Draft" },
];

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "views", label: "Video views" },
  { id: "engagement", label: "Engagement" },
];

export default function ManagePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        const acc = d.accounts?.[0] || null;
        setAccount(acc);
        if (acc) {
          fetch(`/api/schedule/status?accountId=${acc._id}`)
            .then((r) => r.json())
            .then(setScheduleStatus);
        }
      });
  }, []);

  useEffect(() => {
    if (!account) return;
    setLoading(true);
    const params = new URLSearchParams({ accountId: account._id, sortBy });
    if (statusFilter !== "all") params.set("status", statusFilter);
    fetch(`/api/videos?${params}`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts || []))
      .finally(() => setLoading(false));
  }, [account, statusFilter, sortBy]);

  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="border-b border-teal/40 sticky top-0 z-10 bg-ink">
        <div className="max-w-4xl mx-auto px-5 py-5 flex items-center gap-3">
          <Link href="/dashboard" className="text-cream/50 hover:text-cream">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold">Manage</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-5 py-6">
        {scheduleStatus && scheduleStatus.mode !== "not_started" && (
          <div className="mb-6 flex items-center gap-3">
            <CycleProgressRing
              daysElapsed={scheduleStatus.daysElapsed || 0}
              totalDays={scheduleStatus.totalDays || 30}
              mode={scheduleStatus.mode}
            />
            <div className="flex items-center gap-1.5 text-xs text-cream/40">
              <TrendingUp size={13} />
              <span>
                {scheduleStatus.mode === "locked"
                  ? "Auto-posting on your learned best times"
                  : "Testing time slots to find your best posting window"}
              </span>
            </div>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto mb-3 pb-1">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
                statusFilter === f.id
                  ? "bg-lime text-ink border-lime font-medium"
                  : "border-teal/40 text-cream/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto mb-5 pb-1">
          {SORTS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSortBy(s.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
                sortBy === s.id
                  ? "bg-teal/40 border-teal text-cream"
                  : "border-teal/30 text-cream/40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-cream/40 text-sm">Loading…</p>}
        {!loading && posts.length === 0 && (
          <p className="text-cream/40 text-sm">No posts match this filter yet.</p>
        )}

        <div className="space-y-3">
          {posts.map((p) => (
            <div key={p._id} className="border border-teal/40 rounded-lg p-3 bg-teal/10 flex gap-3">
              <div className="w-16 h-20 rounded-md bg-teal/30 border border-teal/40 shrink-0 overflow-hidden">
                {p.coverFrameUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverFrameUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-cream truncate">
                  {p.partNumber ? `${p.seriesLabel} ${p.partNumber}: ` : ""}
                  {p.caption || p.driveFileName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={p.status} />
                  {p.platform && (
                    <span className="text-[10px] uppercase text-ember bg-ember/10 px-1.5 py-0.5 rounded">
                      {p.platform}
                    </span>
                  )}
                  {p.scheduledFor && p.status === "queued" && (
                    <span className="text-[11px] text-cream/40">
                      {new Date(p.scheduledFor).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-cream/40 text-xs">
                  <span className="flex items-center gap-1">
                    <Play size={12} /> {p.views24h || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={12} /> {p.likes || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={12} /> {p.comments || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    queued: "bg-lime/20 text-lime",
    posted: "bg-teal/40 text-cream/70",
    draft: "bg-cream/10 text-cream/40",
    pending_review: "bg-ember/20 text-ember",
    failed: "bg-red-900/40 text-red-300",
  };
  const label: Record<string, string> = {
    queued: "Scheduled",
    posted: "Posted",
    draft: "Draft",
    pending_review: "Pending review",
    failed: "Failed",
  };
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full ${map[status] || "bg-teal/30 text-cream/50"}`}>
      {label[status] || status}
    </span>
  );
}
