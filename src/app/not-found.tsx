import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <p className="text-xs font-black tracking-[0.3em] text-gray-300 mb-4">NOVAREN</p>
      <h1 className="text-xl font-bold mb-2">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        주소가 잘못되었거나, 삭제된 페이지일 수 있습니다.
      </p>
      <div className="flex gap-3 justify-center">
        <Link href="/">
          <Button className="h-11 bg-black text-white hover:bg-gray-800">홈으로</Button>
        </Link>
        <Link href="/products">
          <Button variant="outline" className="h-11">상품 둘러보기</Button>
        </Link>
      </div>
    </div>
  );
}
