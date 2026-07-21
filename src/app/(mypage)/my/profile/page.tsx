import { auth } from "@/lib/auth";
import { getUserProfile } from "@/lib/queries";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/mypage/profile-form";
import { ChangePasswordForm } from "@/components/mypage/change-password-form";
import { DeleteAccountForm } from "@/components/mypage/delete-account-form";
import { getTranslations } from "next-intl/server";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/my/profile");

  const user = await getUserProfile(session.user.id);
  if (!user) redirect("/login");
  const t = await getTranslations("Mypage");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">{t("profileTitle")}</h1>
      <ProfileForm user={user} />
      <ChangePasswordForm hasPassword={!!user.passwordHash} />
      <DeleteAccountForm />
    </div>
  );
}
