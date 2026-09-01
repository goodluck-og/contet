import TimeSlot from "@/models/TimeSlot";

// Research-based defaults for gaming/anime/MMD niche (evening + night skew).
// These are just the starting candidate pool for the exploration cycle -
// not final posting times.
const DEFAULT_CANDIDATE_SLOTS = [
  { hour: 12, minute: 0 },
  { hour: 15, minute: 30 },
  { hour: 18, minute: 0 },
  { hour: 19, minute: 30 },
  { hour: 21, minute: 0 },
  { hour: 22, minute: 30 },
];

export async function seedDefaultSlots(accountId: string) {
  const existing = await TimeSlot.countDocuments({ accountId });
  if (existing > 0) return;

  await TimeSlot.insertMany(
    DEFAULT_CANDIDATE_SLOTS.map((s) => ({
      accountId,
      hour: s.hour,
      minute: s.minute,
      status: "candidate",
    }))
  );
}
