"use client";

import { useActionState, useState } from "react";
import { updateProfile } from "@/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { ImageUpload } from "@/components/shared/image-upload";

interface UserData {
  email: string;
  name: string | null;
  nickname: string | null;
  phone: string | null;
  profileImage: string | null;
  createdAt: Date;
  role: string;
}

export function ProfileForm({ user }: { user: UserData }) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);
  const [profileImage, setProfileImage] = useState<string[]>(
    user.profileImage ? [user.profileImage] : []
  );

  useEffect(() => {
    if (state?.success) toast.success("프로필이 수정되었습니다");
  }, [state]);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 프로필 이미지 */}
          <div>
            <Label className="text-sm mb-1.5">프로필 사진</Label>
            <div className="mt-2">
              <ImageUpload
                category="profiles"
                maxFiles={1}
                value={profileImage}
                onChange={setProfileImage}
                avatar
              />
              <input type="hidden" name="profileImage" value={profileImage[0] || ""} />
            </div>
          </div>

          <Separator />

          <div>
            <Label htmlFor="email" className="text-sm mb-1.5">이메일</Label>
            <div className="flex items-center gap-2">
              <Input id="email" value={user.email} disabled className="bg-gray-50" />
              <Badge variant="outline" className="shrink-0 text-xs">
                <CheckCircle className="w-3 h-3 mr-1" /> 인증됨
              </Badge>
            </div>
          </div>
          <div>
            <Label htmlFor="name" className="text-sm mb-1.5">이름</Label>
            <Input id="name" name="name" defaultValue={user.name ?? ""} placeholder="이름" required />
          </div>
          <div>
            <Label htmlFor="nickname" className="text-sm mb-1.5">닉네임</Label>
            <Input id="nickname" name="nickname" defaultValue={user.nickname ?? ""} placeholder="닉네임 (선택)" />
          </div>
          <div>
            <Label htmlFor="phone" className="text-sm mb-1.5">연락처</Label>
            <Input id="phone" name="phone" defaultValue={user.phone ?? ""} placeholder="010-0000-0000" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">계정 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">회원등급</span>
            <Badge>BRONZE</Badge>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-gray-500">가입일</span>
            <span>{user.createdAt.toLocaleDateString("ko-KR")}</span>
          </div>
          <Separator />
          <div className="flex justify-between">
            <span className="text-gray-500">계정 유형</span>
            <span>{user.role === "ADMIN" ? "관리자" : "일반 회원"}</span>
          </div>
        </CardContent>
      </Card>

      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}

      <Button type="submit" disabled={isPending} className="w-full h-12 bg-black hover:bg-gray-800 text-white font-bold">
        {isPending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> 저장 중...</> : "프로필 저장"}
      </Button>
    </form>
  );
}
