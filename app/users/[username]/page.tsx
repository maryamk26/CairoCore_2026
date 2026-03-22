import PublicProfileContent from "@/components/profile/PublicProfileContent";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return <PublicProfileContent username={username} />;
}
