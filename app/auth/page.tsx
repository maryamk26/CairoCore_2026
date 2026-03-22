import AuthContainer from "@/components/auth/AuthContainer";
import Link from "next/link";

type SearchParams = { mode?: string };

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolved = await searchParams;
  const mode = resolved?.mode === "sign-up" ? "sign-up" : "sign-in";

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative"
      style={{
        backgroundImage: "url(/images/backgrounds/authbg.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute top-6 left-6 md:top-8 md:left-8">
        <Link href="/" className="inline-block">
          <h1
            className="text-4xl md:text-5xl font-cinzel font-bold text-[#5d4e37] tracking-tight"
          >
            CairoCore
          </h1>
        </Link>
      </div>

      <AuthContainer initialMode={mode} useAuthRoute />
    </div>
  );
}
