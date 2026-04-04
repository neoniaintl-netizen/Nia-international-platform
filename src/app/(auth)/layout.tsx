import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <Link href="/" className="mb-8">
        <span className="text-2xl font-black tracking-tight">MUSINSA</span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
