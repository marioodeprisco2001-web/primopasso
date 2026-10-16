import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemoBanner, Results } from "@/components/Results";
import { SearchShell } from "@/components/SearchShell";
import { favoriteIds, searchJobs } from "@/lib/jobs";
import { SEO_PAGES, findSeoPage } from "@/lib/seo";
import { EMPTY_FILTERS } from "@/lib/types";

export const revalidate = 3600;
export const dynamicParams = false;
export const generateStaticParams = () => SEO_PAGES.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const page = findSeoPage((await params).slug);
  if (!page) return {};
  return { title: page.title, description: page.intro, alternates: { canonical: `/lavoro/${page.slug}` } };
}

export default async function SeoPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = findSeoPage((await params).slug);
  if (!page) notFound();
  const filters = { ...EMPTY_FILTERS, ...page.filters };
  const [res, favs] = await Promise.all([searchJobs(filters), favoriteIds()]);
  return (
    <>
      {res.demo && <DemoBanner />}
      <SearchShell filters={filters} facets={res.facets} total={res.total} heading={<h1>{page.title}</h1>} intro={page.intro}>
        <Results jobs={res.jobs} favs={favs} total={res.total} page={1} filters={filters} />
      </SearchShell>
    </>
  );
}
