import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { BranchReviews } from "@/components/branches/BranchReviews";
import { summarizeReviews } from "@/lib/reviews/summary";
import type { AppLocale } from "@/types/i18n";
import type { PublicReviewsResult } from "@/types/review";
import { renderWithIntl } from "./helpers/render-with-intl";

const fetchMock = vi.fn();
const empty: PublicReviewsResult = { reviews: [], summary: summarizeReviews([]), page: 1, totalPages: 0 };
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal("fetch", fetchMock); });
afterEach(() => vi.unstubAllGlobals());

function fillForm() {
  fireEvent.click(screen.getByRole("radio", { name: "4 stars" }));
  fireEvent.change(screen.getByLabelText("Your first name or nickname"), { target: { value: "Sarah" } });
  fireEvent.change(screen.getByLabelText(/Your review/), { target: { value: "Friendly and helpful staff." } });
  return screen.getByRole("button", { name: "Submit my review" }).closest("form")!;
}

describe("Branch review form", () => {
  it.each(["en", "fr", "he", "ru", "es"] as AppLocale[])("renders an honest empty state and accessible rating choices in %s", (locale) => {
    renderWithIntl(<BranchReviews slug="ramot" initial={empty} />, locale);
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.queryByText(/100%/)).toBeNull();
    expect(screen.queryByText(/reviews\.title/)).toBeNull();
  });
  it("acknowledges moderation and does not count an unpublished submission", async () => {
    fetchMock.mockResolvedValueOnce(new Response('{"status":"PENDING"}', { status: 202 }));
    renderWithIntl(<BranchReviews slug="ramot" initial={empty} />);
    fireEvent.submit(fillForm());
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("after our team approves it"));
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/branches/ramot/reviews");
    expect(JSON.parse(options.body)).toEqual({ authorName: "Sarah", rating: 4, comment: "Friendly and helpful staff.", locale: "en", website: "" });
    expect(screen.queryByText("1 published review")).toBeNull();
  });
  it("keeps the draft on a failed request and explains the rate limit", async () => {
    fetchMock.mockResolvedValueOnce(new Response('{}', { status: 429 }));
    renderWithIntl(<BranchReviews slug="ramot" initial={empty} />);
    fireEvent.submit(fillForm());
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("in an hour"));
    expect((screen.getByLabelText("Your first name or nickname") as HTMLInputElement).value).toBe("Sarah");
  });
  it("renders review content as literal text with its original language", () => {
    const comment = '<img src=x onerror="alert(1)">';
    const initial = { ...empty, reviews: [{ id: "r1", authorName: "David", rating: 1, comment, locale: "fr", createdAt: "2026-10-25T10:00:00Z" }], summary: summarizeReviews([{ rating: 1, count: 1 }]), totalPages: 1 };
    const { container } = renderWithIntl(<BranchReviews slug="ramot" initial={initial} />);
    expect(screen.getByText(comment).getAttribute("lang")).toBe("fr");
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("0% satisfaction")).toBeTruthy();
  });
});
