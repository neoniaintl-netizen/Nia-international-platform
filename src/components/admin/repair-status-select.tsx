"use client";

import { useTransition, useState } from "react";
import { updateRepairStatusAction } from "@/actions/admin-repair";

const STATUSES = [
  { value: "RECEIVED", label: "접수" },
  { value: "INSPECTING", label: "검수중" },
  { value: "QUOTED", label: "견적 발송" },
  { value: "IN_PROGRESS", label: "수선중" },
  { value: "SHIPPING", label: "반송중" },
  { value: "COMPLETED", label: "완료" },
  { value: "CANCELLED", label: "취소" },
];

export function RepairStatusSelect({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newStatus = e.target.value;
    setStatus(newStatus);
    startTransition(async () => {
      await updateRepairStatusAction(id, newStatus);
    });
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      className="h-8 text-xs border rounded px-2 bg-white"
    >
      {STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
