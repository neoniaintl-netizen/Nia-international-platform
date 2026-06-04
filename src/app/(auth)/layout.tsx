import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <Link href="/" className="mb-8" aria-label="NOVAREN 홈">
        <Image
          src="/novaren-logo2.png"
          alt="NOVAREN"
          width={270}
          height={36}
          priority
          unoptimized
          className="h-8 w-auto object-contain"
        />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
