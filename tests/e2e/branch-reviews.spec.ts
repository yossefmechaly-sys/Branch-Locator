import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { prisma } from "../../lib/prisma";
import { ReviewRateLimitError, submitBranchReview } from "../../services/review.service";
import { loginAsSuperAdmin } from "./helpers/auth";

test.use({
  video: "off",
  actionTimeout: 15_000,
  launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {},
});

const runId = `${Date.now()}-${process.pid}`;
const slug = `e2e-reviews-${runId}`;
const author = `Review ${runId}`;
const negativeAuthor = `Critical ${runId}`;
let branchId: string;

test.beforeAll(async () => {
  const city = await prisma.city.findFirst({ where: { isActive: true }, select: { id: true } });
  if (!city) throw new Error("Seed the local demo database before running review tests");
  const branch = await prisma.branch.create({ data: {
    slug, branchCode: `REV-${runId}`, cityId: city.id, address: "E2E demo only",
    latitude: 31.8, longitude: 35.2, isActive: true, isDemo: true,
    translations: { create: [
      { locale: "he", displayName: `ביקורות E2E ${runId}` },
      { locale: "fr", displayName: `Magasin avis E2E ${runId}` },
    ] },
  } });
  branchId = branch.id;
});

test.afterAll(async () => {
  if (branchId) await prisma.$transaction([
    prisma.branchReview.deleteMany({ where: { branchId } }),
    prisma.analyticsEvent.deleteMany({ where: { branchId } }),
    prisma.branchTranslation.deleteMany({ where: { branchId } }),
    prisma.branch.delete({ where: { id: branchId } }),
  ]);
  await prisma.$disconnect();
});

test("avis en attente → publication de notes 5 et 1 → satisfaction → refus → autre magasin inchangé", async ({ page, browser, request }) => {
  test.setTimeout(120_000);
  await page.route("https://maps.googleapis.com/**", (route) => route.abort());
  await page.goto(`/fr/branches/${slug}#reviews`);
  const section = page.getByRole("region", { name: "Avis et satisfaction client" });
  await expect(section.getByText(/n’a pas encore d’avis publié/)).toBeVisible();
  await section.getByRole("radio", { name: "5 étoiles" }).check();
  await section.getByLabel("Votre prénom ou pseudonyme").fill(author);
  await section.getByLabel("Votre commentaire", { exact: true }).fill("Personnel accueillant et magasin agréable.");
  await section.getByRole("button", { name: "Envoyer mon avis" }).click();
  await expect(section.getByRole("status")).toContainText("après validation");
  const pending = await request.get(`/api/branches/${slug}/reviews`);
  expect((await pending.json()).summary.total).toBe(0);

  const admin = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  const adminPage = await admin.newPage();
  try {
    await loginAsSuperAdmin(adminPage);
    await adminPage.goto(`/admin/reviews?branchId=${branchId}&status=PENDING`);
    await adminPage.getByRole("listitem").filter({ hasText: author }).getByRole("button", { name: "Publier", exact: true }).click();
    await expect.poll(async () => (await (await request.get(`/api/branches/${slug}/reviews`)).json()).summary.total).toBe(1);
    await page.reload();
    await expect(section.getByText("100 % de satisfaction")).toBeVisible();
    await expect(section.getByText(author, { exact: true })).toBeVisible();

    // A critical review can be published through exactly the same workflow.
    await section.getByRole("radio", { name: "1 étoile", exact: true }).check();
    await section.getByLabel("Votre prénom ou pseudonyme").fill(negativeAuthor);
    await section.getByLabel("Votre commentaire", { exact: true }).fill("Attente trop longue à la caisse pendant ma visite.");
    await section.getByRole("button", { name: "Envoyer mon avis" }).click();
    await expect(section.getByRole("status")).toContainText("après validation");
    await adminPage.goto(`/admin/reviews?branchId=${branchId}&status=PENDING`);
    await adminPage.getByRole("listitem").filter({ hasText: negativeAuthor }).getByRole("button", { name: "Publier", exact: true }).click();
    await expect.poll(async () => (await (await request.get(`/api/branches/${slug}/reviews`)).json()).summary.total).toBe(2);
    const published = await (await request.get(`/api/branches/${slug}/reviews`)).json();
    expect(published.summary).toMatchObject({ averageRating: 3, satisfiedPercent: 50 });
    expect(published.reviews[0]).not.toHaveProperty("clientHash");
    expect(published.reviews[0]).not.toHaveProperty("status");
    await page.reload();
    await expect(section.getByText("50 % de satisfaction")).toBeVisible();
    await expect(section.getByText(negativeAuthor, { exact: true })).toBeVisible();

    await section.screenshot({ path: "/tmp/branch-reviews-desktop.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    await section.screenshot({ path: "/tmp/branch-reviews-mobile.png" });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

    await adminPage.goto(`/admin/reviews?branchId=${branchId}&status=APPROVED`);
    await adminPage.getByRole("listitem").filter({ hasText: author }).getByRole("button", { name: "Refuser", exact: true }).click();
    await expect.poll(async () => (await (await request.get(`/api/branches/${slug}/reviews`)).json()).summary.total).toBe(1);
    await page.reload();
    await expect(section.getByText(author, { exact: true })).toHaveCount(0);
    await expect(section.getByText("0 % de satisfaction")).toBeVisible();
    const otherBranch = await (await request.get("/api/branches/jerusalem-ramot/reviews")).json();
    expect(otherBranch.reviews.some((review: { authorName: string }) => [author, negativeAuthor].includes(review.authorName))).toBe(false);

    // The mutation and its audit are both persisted against the same review.
    const review = await prisma.branchReview.findFirstOrThrow({ where: { branchId, authorName: author } });
    expect(review.status).toBe("REJECTED");
    const audit = await prisma.auditLog.findMany({ where: { entityType: "BranchReview", entityId: review.id }, orderBy: { createdAt: "asc" } });
    expect(audit.map((entry) => entry.action)).toEqual(["review.approved", "review.rejected"]);
  } finally { await admin.close(); }
});

test("la limitation des soumissions résiste aux requêtes concurrentes", async () => {
  const clientHash = createHash("sha256").update(`review-concurrency-${runId}`).digest("hex");
  const results = await Promise.allSettled(Array.from({ length: 8 }, () => submitBranchReview(slug, {
    authorName: "Concurrent test", rating: 3, comment: "Concurrent local demo submission.", locale: "en",
  }, clientHash)));
  expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(3);
  const rejected = results.filter((result) => result.status === "rejected");
  expect(rejected).toHaveLength(5);
  for (const result of rejected) {
    if (result.status === "rejected") expect(result.reason).toBeInstanceOf(ReviewRateLimitError);
  }
  expect(await prisma.branchReview.count({ where: { clientHash } })).toBe(3);
});
