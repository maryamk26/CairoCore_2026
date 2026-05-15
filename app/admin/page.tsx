import AdminPanelClient from "@/components/admin/AdminPanelClient";
import FixedPhotoBackdrop from "@/components/layout/FixedPhotoBackdrop";
import { requireAdminPage } from "@/lib/auth/requireAdmin";

export default async function AdminPage() {
  await requireAdminPage();

  return (
    <div className="relative flex min-h-screen flex-col font-cinzel">
      <FixedPhotoBackdrop
        src="/images/backgrounds/survey.jpg"
        overlayClassName="bg-gradient-to-br from-[#5d4e37]/40 via-[#8b6f47]/30 to-[#5d4e37]/40"
      />

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-20 pt-24 md:pt-28 md:pb-24">
        <AdminPanelClient />
      </main>
    </div>
  );
}
