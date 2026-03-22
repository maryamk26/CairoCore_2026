import FeedPage from "@/components/feed/FeedPage";
import MarketingHome from "@/components/home/MarketingHome";
import { getSessionUser } from "@/lib/supabase/server";

export default async function Home() {
  const user = await getSessionUser();
  if (user) {
    return <FeedPage />;
  }

  return <MarketingHome />;
}
