export const CATEGORIES = [
  "Electronics",
  "ID Cards",
  "Wallets",
  "Keys",
  "Documents",
  "Bags",
  "Accessories",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const STATUS_LABELS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  SEARCHING: {
    label: "Searching",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  REPORTED: {
    label: "Reported",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  POSSIBLE_MATCH: {
    label: "Possible Match",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  CLAIM_PENDING: {
    label: "Claim Pending",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  UNDER_VERIFICATION: {
    label: "Under Verification",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  VERIFIED: {
    label: "Verified Ownership",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  READY_FOR_RECOVERY: {
    label: "Ready for Recovery",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
  },
  RECOVERED: {
    label: "Recovered",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
  // Claim statuses
  SUBMITTED: {
    label: "Claim Submitted",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  MORE_INFO_REQUIRED: {
    label: "Info Requested",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  APPROVED: {
    label: "Claim Approved",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  REJECTED: {
    label: "Claim Rejected",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  CANCELLED: {
    label: "Cancelled",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
  MULTIPLE_CLAIMS: {
    label: "MULTIPLE CLAIMS — ADMIN REVIEW REQUIRED",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-300",
  },
};
