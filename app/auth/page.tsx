import AuthContainer from "@/components/auth/AuthContainer";
import FixedPhotoBackdrop from "@/components/layout/FixedPhotoBackdrop";
import Link from "next/link";

type SearchParams = { mode?: string };

export default async function AuthPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolved = await searchParams;
  const mode = resolved?.mode === "sign-up" ? "sign-up" : "sign-in";

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
      <FixedPhotoBackdrop src="/images/backgrounds/authbg.jpg" />

      <div className="absolute top-6 left-6 z-10 md:top-8 md:left-8">
        <Link href="/" className="inline-block">
          <h1 className="text-4xl md:text-5xl font-cinzel font-bold text-[#5d4e37] tracking-tight">
            CairoCore
          </h1>
        </Link>
      </div>

      <div className="relative z-10 flex w-full justify-center">
        <AuthContainer initialMode={mode} useAuthRoute />
      </div>
    </div>
  );
}
