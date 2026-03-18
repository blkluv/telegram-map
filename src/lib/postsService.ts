import type { CollectionEntry } from "astro:content";

// Support both the real "blog" collection and the test-only "blog-test" collection,
// which share an identical schema.
export type BlogEntry = CollectionEntry<"blog"> | CollectionEntry<"blog-test">;

const REVISION_PATTERN = /^revision-(\d+)$/;

type GroupedEntries = {
  baseSlug: string;
  original?: BlogEntry;
  revisions: BlogEntry[];
};

export interface RevisionMeta {
  baseSlug: string;
  revisionSegment?: string;
  revisionNumber: number;
  isRevision: boolean;
}

export function getRevisionMeta(entry: BlogEntry): RevisionMeta {
  const segments = entry.slug.split("/");
  const baseSlug = segments[0];
  const revisionSegment = segments.length === 2 ? segments[1] : undefined;
  const match = revisionSegment ? REVISION_PATTERN.exec(revisionSegment) : null;
  const revisionNumber = match ? Number.parseInt(match[1], 10) : 0;
  return {
    baseSlug,
    revisionSegment: match ? revisionSegment : undefined,
    revisionNumber,
    isRevision: Boolean(match),
  };
}

export function isRevisionEntry(entry: BlogEntry): boolean {
  return getRevisionMeta(entry).isRevision;
}

export function isDraftEntry(entry: BlogEntry): boolean {
  return entry.data.draft === true;
}

export function isHiddenEntry(entry: BlogEntry): boolean {
  return entry.data.hidden === true;
}

export function shouldDisplayEntry(entry: BlogEntry): boolean {
  return !isDraftEntry(entry) && !isHiddenEntry(entry);
}

export function groupBlogEntries(entries: BlogEntry[]): Map<string, GroupedEntries> {
  const map = new Map<string, GroupedEntries>();
  for (const entry of entries) {
    if (isDraftEntry(entry)) continue;
    const meta = getRevisionMeta(entry);
    const baseSlug = meta.baseSlug;
    if (!map.has(baseSlug)) {
      map.set(baseSlug, { baseSlug, revisions: [] });
    }
    const group = map.get(baseSlug)!;
    if (meta.isRevision) {
      group.revisions.push(entry);
    } else {
      group.original = entry;
    }
  }
  return map;
}

export function sortRevisionsAscending(revisions: BlogEntry[]): BlogEntry[] {
  return [...revisions].sort((a, b) => {
    const aMeta = getRevisionMeta(a);
    const bMeta = getRevisionMeta(b);
    return aMeta.revisionNumber - bMeta.revisionNumber;
  });
}

export function sortRevisionsDescending(revisions: BlogEntry[]): BlogEntry[] {
  return [...revisions].sort((a, b) => {
    const aMeta = getRevisionMeta(a);
    const bMeta = getRevisionMeta(b);
    return bMeta.revisionNumber - aMeta.revisionNumber;
  });
}

export function getLatestEntry(group: GroupedEntries): BlogEntry | undefined {
  if (group.revisions.length === 0) {
    return group.original;
  }
  return sortRevisionsDescending(group.revisions)[0] ?? group.original;
}

export function getBaseEntries(entries: BlogEntry[]): BlogEntry[] {
  return entries.filter((entry) => !isRevisionEntry(entry) && shouldDisplayEntry(entry));
}

export function sortEntriesDefault(entries: BlogEntry[]): BlogEntry[] {
  return [...entries].sort((a, b) => {
    const aOrder = a.data.sortOrder;
    const bOrder = b.data.sortOrder;

    // Both have sortOrder - compare them
    if (aOrder != null && bOrder != null) {
      return aOrder - bOrder;
    }
    // Only a has sortOrder - a comes first
    if (aOrder != null) return -1;
    // Only b has sortOrder - b comes first
    if (bOrder != null) return 1;

    // Neither has sortOrder - sort by publication date (oldest first)
    return a.data.publicationDate.valueOf() - b.data.publicationDate.valueOf();
  });
}
