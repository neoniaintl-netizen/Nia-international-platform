"use client";

import { useTransition } from "react";
import { updateUserRole } from "@/actions/admin";
import { toast } from "sonner";

const ROLES = [
  { value: "CUSTOMER", label: "회원" },
  { value: "SELLER", label: "판매자" },
  { value: "ADMIN", label: "관리자" },
];

export function UserRoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value;
    if (!confirm(`역할을 '${ROLES.find(r => r.value === newRole)?.label}'(으)로 변경하시겠습니까?`)) {
      e.target.value = currentRole;
      return;
    }
    startTransition(async () => {
      await updateUserRole(userId, newRole);
      toast.success("역할이 변경되었습니다.");
    });
  }

  return (
    <select
      value={currentRole}
      onChange={handleChange}
      disabled={isPending}
      className="text-xs border rounded px-1.5 py-1 bg-white disabled:opacity-50"
    >
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </select>
  );
}
