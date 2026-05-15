import { loadEnvConfig } from "@next/env";

import { runEmbedPlacesJob } from "@/lib/places/embedPlacesJob";

loadEnvConfig(process.cwd());

async function main() {
  const limit = process.env.EMBED_LIMIT ? Number.parseInt(process.env.EMBED_LIMIT, 10) : undefined;
  const skipExisting = process.env.EMBED_SKIP_EXISTING === "1";
  const placeIds = process.env.EMBED_PLACE_IDS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const result = await runEmbedPlacesJob({
    limit: Number.isFinite(limit) ? limit : undefined,
    skipExisting,
    placeIds: placeIds?.length ? placeIds : undefined,
  });

  console.log(JSON.stringify(result, null, 2));
  if (result.errors.length > 0) {
    process.exitCode = 1;
  }
}

void main();
