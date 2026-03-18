import { describe, it, expect } from "vitest";
import {
  type BlogEntry,
  type RevisionMeta,
  getRevisionMeta,
  isRevisionEntry,
  isDraftEntry,
  isHiddenEntry,
  shouldDisplayEntry,
  groupBlogEntries,
  sortRevisionsAscending,
  sortRevisionsDescending,
  getLatestEntry,
  getBaseEntries,
  sortEntriesDefault,
} from "./postsService";

// Helper function to create mock blog entries
function createMockEntry(
  slug: string,
  data: Partial<BlogEntry["data"]> = {}
): BlogEntry {
  return {
    id: slug,
    slug,
    body: "Test content",
    collection: "blog",
    data: {
      title: data.title || "Test Post",
      description: data.description || "Test description",
      publicationDate: data.publicationDate || new Date("2025-01-01"),
      draft: data.draft,
      hidden: data.hidden,
      sortOrder: data.sortOrder,
      revisionDate: data.revisionDate,
      ...data,
    },
    render: async () => ({
      Content: () => null,
      headings: [],
      remarkPluginFrontmatter: {},
    }),
  } as BlogEntry;
}

describe("postsService", () => {
  describe("getRevisionMeta", () => {
    it("should identify a base post (no revision)", () => {
      const entry = createMockEntry("my-post");
      const meta = getRevisionMeta(entry);

      expect(meta).toEqual({
        baseSlug: "my-post",
        revisionSegment: undefined,
        revisionNumber: 0,
        isRevision: false,
      });
    });

    it("should identify a revision post", () => {
      const entry = createMockEntry("my-post/revision-1");
      const meta = getRevisionMeta(entry);

      expect(meta).toEqual({
        baseSlug: "my-post",
        revisionSegment: "revision-1",
        revisionNumber: 1,
        isRevision: true,
      });
    });

    it("should handle multi-digit revision numbers", () => {
      const entry = createMockEntry("my-post/revision-42");
      const meta = getRevisionMeta(entry);

      expect(meta.revisionNumber).toBe(42);
      expect(meta.isRevision).toBe(true);
    });

    it("should not treat invalid revision formats as revisions", () => {
      const entry = createMockEntry("my-post/revision");
      const meta = getRevisionMeta(entry);

      expect(meta.isRevision).toBe(false);
      expect(meta.revisionNumber).toBe(0);
    });
  });

  describe("isRevisionEntry", () => {
    it("should return true for revision entries", () => {
      const entry = createMockEntry("my-post/revision-1");
      expect(isRevisionEntry(entry)).toBe(true);
    });

    it("should return false for base entries", () => {
      const entry = createMockEntry("my-post");
      expect(isRevisionEntry(entry)).toBe(false);
    });
  });

  describe("isDraftEntry", () => {
    it("should return true for draft entries", () => {
      const entry = createMockEntry("my-post", { draft: true });
      expect(isDraftEntry(entry)).toBe(true);
    });

    it("should return false for non-draft entries", () => {
      const entry = createMockEntry("my-post", { draft: false });
      expect(isDraftEntry(entry)).toBe(false);
    });

    it("should return false when draft is undefined", () => {
      const entry = createMockEntry("my-post");
      expect(isDraftEntry(entry)).toBe(false);
    });
  });

  describe("isHiddenEntry", () => {
    it("should return true for hidden entries", () => {
      const entry = createMockEntry("my-post", { hidden: true });
      expect(isHiddenEntry(entry)).toBe(true);
    });

    it("should return false for non-hidden entries", () => {
      const entry = createMockEntry("my-post", { hidden: false });
      expect(isHiddenEntry(entry)).toBe(false);
    });

    it("should return false when hidden is undefined", () => {
      const entry = createMockEntry("my-post");
      expect(isHiddenEntry(entry)).toBe(false);
    });
  });

  describe("shouldDisplayEntry", () => {
    it("should return true for normal entries", () => {
      const entry = createMockEntry("my-post");
      expect(shouldDisplayEntry(entry)).toBe(true);
    });

    it("should return false for draft entries", () => {
      const entry = createMockEntry("my-post", { draft: true });
      expect(shouldDisplayEntry(entry)).toBe(false);
    });

    it("should return false for hidden entries", () => {
      const entry = createMockEntry("my-post", { hidden: true });
      expect(shouldDisplayEntry(entry)).toBe(false);
    });

    it("should return false for draft and hidden entries", () => {
      const entry = createMockEntry("my-post", { draft: true, hidden: true });
      expect(shouldDisplayEntry(entry)).toBe(false);
    });
  });

  describe("groupBlogEntries", () => {
    it("should group entries by base slug", () => {
      const entries = [
        createMockEntry("post-a"),
        createMockEntry("post-a/revision-1"),
        createMockEntry("post-a/revision-2"),
        createMockEntry("post-b"),
      ];

      const grouped = groupBlogEntries(entries);

      expect(grouped.size).toBe(2);
      expect(grouped.get("post-a")?.original?.slug).toBe("post-a");
      expect(grouped.get("post-a")?.revisions).toHaveLength(2);
      expect(grouped.get("post-b")?.original?.slug).toBe("post-b");
      expect(grouped.get("post-b")?.revisions).toHaveLength(0);
    });

    it("should skip draft entries", () => {
      const entries = [
        createMockEntry("post-a", { draft: true }),
        createMockEntry("post-b"),
      ];

      const grouped = groupBlogEntries(entries);

      expect(grouped.size).toBe(1);
      expect(grouped.has("post-a")).toBe(false);
      expect(grouped.has("post-b")).toBe(true);
    });

    it("should handle entries with only revisions (no original)", () => {
      const entries = [
        createMockEntry("post-a/revision-1"),
        createMockEntry("post-a/revision-2"),
      ];

      const grouped = groupBlogEntries(entries);

      expect(grouped.size).toBe(1);
      expect(grouped.get("post-a")?.original).toBeUndefined();
      expect(grouped.get("post-a")?.revisions).toHaveLength(2);
    });
  });

  describe("sortRevisionsAscending", () => {
    it("should sort revisions from lowest to highest number", () => {
      const entries = [
        createMockEntry("post/revision-3"),
        createMockEntry("post/revision-1"),
        createMockEntry("post/revision-2"),
      ];

      const sorted = sortRevisionsAscending(entries);

      expect(sorted[0].slug).toBe("post/revision-1");
      expect(sorted[1].slug).toBe("post/revision-2");
      expect(sorted[2].slug).toBe("post/revision-3");
    });

    it("should not mutate the original array", () => {
      const entries = [
        createMockEntry("post/revision-2"),
        createMockEntry("post/revision-1"),
      ];
      const original = [...entries];

      sortRevisionsAscending(entries);

      expect(entries).toEqual(original);
    });
  });

  describe("sortRevisionsDescending", () => {
    it("should sort revisions from highest to lowest number", () => {
      const entries = [
        createMockEntry("post/revision-1"),
        createMockEntry("post/revision-3"),
        createMockEntry("post/revision-2"),
      ];

      const sorted = sortRevisionsDescending(entries);

      expect(sorted[0].slug).toBe("post/revision-3");
      expect(sorted[1].slug).toBe("post/revision-2");
      expect(sorted[2].slug).toBe("post/revision-1");
    });

    it("should not mutate the original array", () => {
      const entries = [
        createMockEntry("post/revision-1"),
        createMockEntry("post/revision-2"),
      ];
      const original = [...entries];

      sortRevisionsDescending(entries);

      expect(entries).toEqual(original);
    });
  });

  describe("getLatestEntry", () => {
    it("should return the original when there are no revisions", () => {
      const original = createMockEntry("post");
      const group = {
        baseSlug: "post",
        original,
        revisions: [],
      };

      const latest = getLatestEntry(group);

      expect(latest).toBe(original);
    });

    it("should return the highest revision when revisions exist", () => {
      const original = createMockEntry("post");
      const rev1 = createMockEntry("post/revision-1");
      const rev2 = createMockEntry("post/revision-2");
      const group = {
        baseSlug: "post",
        original,
        revisions: [rev1, rev2],
      };

      const latest = getLatestEntry(group);

      expect(latest).toBe(rev2);
    });

    it("should return the original when revisions exist but no original is present", () => {
      const rev1 = createMockEntry("post/revision-1");
      const rev2 = createMockEntry("post/revision-2");
      const group = {
        baseSlug: "post",
        revisions: [rev1, rev2],
      };

      const latest = getLatestEntry(group);

      expect(latest).toBe(rev2);
    });
  });

  describe("getBaseEntries", () => {
    it("should return only base entries that should be displayed", () => {
      const entries = [
        createMockEntry("post-a"),
        createMockEntry("post-a/revision-1"),
        createMockEntry("post-b", { draft: true }),
        createMockEntry("post-c", { hidden: true }),
        createMockEntry("post-d"),
      ];

      const baseEntries = getBaseEntries(entries);

      expect(baseEntries).toHaveLength(2);
      expect(baseEntries[0].slug).toBe("post-a");
      expect(baseEntries[1].slug).toBe("post-d");
    });

    it("should exclude revisions even if they should be displayed", () => {
      const entries = [
        createMockEntry("post-a"),
        createMockEntry("post-a/revision-1"),
      ];

      const baseEntries = getBaseEntries(entries);

      expect(baseEntries).toHaveLength(1);
      expect(baseEntries[0].slug).toBe("post-a");
    });
  });

  describe("sortEntriesDefault", () => {
    it("should sort entries with sortOrder first, in ascending order", () => {
      const entries = [
        createMockEntry("post-a", {
          sortOrder: 3,
          publicationDate: new Date("2025-01-01"),
        }),
        createMockEntry("post-b", {
          sortOrder: 1,
          publicationDate: new Date("2025-01-02"),
        }),
        createMockEntry("post-c", {
          sortOrder: 2,
          publicationDate: new Date("2025-01-03"),
        }),
      ];

      const sorted = sortEntriesDefault(entries);

      expect(sorted[0].slug).toBe("post-b");
      expect(sorted[1].slug).toBe("post-c");
      expect(sorted[2].slug).toBe("post-a");
    });

    it("should sort entries without sortOrder by publication date (oldest first)", () => {
      const entries = [
        createMockEntry("post-a", { publicationDate: new Date("2025-01-03") }),
        createMockEntry("post-b", { publicationDate: new Date("2025-01-01") }),
        createMockEntry("post-c", { publicationDate: new Date("2025-01-02") }),
      ];

      const sorted = sortEntriesDefault(entries);

      expect(sorted[0].slug).toBe("post-b");
      expect(sorted[1].slug).toBe("post-c");
      expect(sorted[2].slug).toBe("post-a");
    });

    it("should prioritize sortOrder over publication date", () => {
      const entries = [
        createMockEntry("post-a", { publicationDate: new Date("2025-01-01") }), // no sortOrder
        createMockEntry("post-b", {
          sortOrder: 1,
          publicationDate: new Date("2025-01-10"),
        }),
      ];

      const sorted = sortEntriesDefault(entries);

      expect(sorted[0].slug).toBe("post-b"); // Has sortOrder, comes first
      expect(sorted[1].slug).toBe("post-a"); // No sortOrder, comes second
    });

    it("should handle mixed entries with and without sortOrder", () => {
      const entries = [
        createMockEntry("post-a", { publicationDate: new Date("2025-01-01") }),
        createMockEntry("post-b", {
          sortOrder: 2,
          publicationDate: new Date("2025-01-05"),
        }),
        createMockEntry("post-c", { publicationDate: new Date("2025-01-02") }),
        createMockEntry("post-d", {
          sortOrder: 1,
          publicationDate: new Date("2025-01-06"),
        }),
      ];

      const sorted = sortEntriesDefault(entries);

      // First: entries with sortOrder (1, 2)
      expect(sorted[0].slug).toBe("post-d"); // sortOrder: 1
      expect(sorted[1].slug).toBe("post-b"); // sortOrder: 2
      // Then: entries without sortOrder, by date (oldest first)
      expect(sorted[2].slug).toBe("post-a"); // 2025-01-01
      expect(sorted[3].slug).toBe("post-c"); // 2025-01-02
    });

    it("should not mutate the original array", () => {
      const entries = [
        createMockEntry("post-b", { publicationDate: new Date("2025-01-02") }),
        createMockEntry("post-a", { publicationDate: new Date("2025-01-01") }),
      ];
      const original = [...entries];

      sortEntriesDefault(entries);

      expect(entries).toEqual(original);
    });
  });
});
