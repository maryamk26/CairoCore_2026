import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ locations: [] });
}

export async function POST() {
  return NextResponse.json({ error: "Not available" }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Not available" }, { status: 501 });
}
