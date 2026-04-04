"use client";

import { useActionState, useEffect, useRef } from "react";
import { createCategory } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

interface ParentCategory {
  id: string;
  name: string;
}

export function CategoryForm({ parentCategories }: { parentCategories: ParentCategory[] }) {
  const [state, formAction, isPending] = useActionState(createCategory, null);
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (state?.success) {
      toast.success("카테고리가 추가되었습니다!");
      formRef.current?.reset();
      setOpen(false);
    }
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-black hover:bg-gray-800 text-white gap-2" />}>
        <Plus className="w-4 h-4" />
        카테고리 추가
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>카테고리 추가</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div>
            <Label className="text-sm mb-1.5">카테고리명</Label>
            <Input name="name" placeholder="상의" required />
          </div>
          <div>
            <Label className="text-sm mb-1.5">Slug</Label>
            <Input name="slug" placeholder="tops" required />
          </div>
          <div>
            <Label className="text-sm mb-1.5">상위 카테고리</Label>
            <select name="parentId" className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">없음 (대분류)</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-sm mb-1.5">아이콘 URL</Label>
            <Input name="iconUrl" placeholder="https://..." />
          </div>
          <div>
            <Label className="text-sm mb-1.5">정렬 순서</Label>
            <Input name="sortOrder" type="number" defaultValue="0" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full bg-black hover:bg-gray-800 text-white">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            카테고리 추가
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
