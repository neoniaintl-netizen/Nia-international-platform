import { auth } from "@/lib/auth";
import { getUserAddresses } from "@/lib/queries";
import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddressActions } from "@/components/mypage/address-actions";
import { AddAddressForm } from "@/components/mypage/add-address-form";
import { getTranslations } from "next-intl/server";

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/my/addresses");

  const addresses = await getUserAddresses(session.user.id);
  const t = await getTranslations("Mypage");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("addressesTitle")}</h1>
      </div>

      {/* Address list */}
      {addresses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">{t("noAddresses")}</p>
            <p className="text-xs text-gray-400 mt-1">{t("noAddressesHint")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <Card key={addr.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{addr.label}</span>
                      {addr.isDefault && (
                        <Badge className="bg-black text-white text-[10px]">{t("addrDefault")}</Badge>
                      )}
                    </div>
                    <p className="text-sm">{addr.recipient} · {addr.phone}</p>
                    <p className="text-sm text-gray-500">
                      ({addr.zipCode}) {addr.address1} {addr.address2}
                    </p>
                  </div>
                  <AddressActions addressId={addr.id} isDefault={addr.isDefault} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add address form */}
      <AddAddressForm />
    </div>
  );
}
