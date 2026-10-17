import { DemoBanner, Results } from "@/components/Results";
import { SearchShell } from "@/components/SearchShell";
import { parseFilters } from "@/lib/filters";
import { favoriteIds, searchJobs } from "@/lib/jobs";
import { getSponsor } from "@/lib/sponsors";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const page = Math.max(1, Number(params.pagina) || 1);
  const [res, favs, sponsor] = await Promise.all([searchJobs(filters, page), favoriteIds(), getSponsor("sito")]);
  return (
    <>
      {res.demo && <DemoBanner />}
      <SearchShell filters={filters} facets={res.facets} total={res.total}>
        <Results jobs={res.jobs} favs={favs} total={res.total} page={page} filters={filters} sponsor={sponsor} />
      </SearchShell>
    </>
  );
}
