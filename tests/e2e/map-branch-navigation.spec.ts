import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

import { locales } from "../../types/i18n";
import { installGoogleMapsStub } from "./helpers/google-maps";

test.use({ video: "off" });

for (const mobile of [false, true]) {
  test.describe(mobile ? "Map links on mobile" : "Map links on desktop", () => {
    test.use({ viewport: { width: mobile ? 393 : 1280, height: 900 }, hasTouch: mobile });

    for (const locale of locales) {
      test(`${locale}: marker → popup → localized branch page`, async ({ page, request }) => {
        const messages = JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
        const response = await request.get(`/api/branches?locale=${locale}`);
        expect(response.ok()).toBeTruthy();
        const { branches } = await response.json();
        const branch = branches.find((entry: { slug: string }) => entry.slug === "jerusalem-ramot");
        expect(branch).toBeTruthy();
        await installGoogleMapsStub(page);

        await page.goto(`/${locale}/branches`);
        if (mobile) await page.getByRole("tab", { name: messages.mobileView.map, exact: true }).click();
        await expect(page.getByRole("button", { name: `Map marker: ${branch.displayName}`, exact: true })).toBeVisible();
        const otherBranch = branches.find((entry: { id: string }) => entry.id !== branch.id);
        for (const selected of [branch, otherBranch]) {
          if (mobile) await page.getByRole("tab", { name: messages.mobileView.list, exact: true }).click();
          const card = page.locator(`[id="branch-card-${selected.id}"] .locator-card`);
          if (mobile) await card.tap({ position: { x: 8, y: 8 } });
          else await card.click({ position: { x: 8, y: 8 } });
          await expect(card).toHaveAttribute("data-selected", "true");
          await expect(page.locator('.locator-card[data-selected="true"]')).toHaveCount(1);
          await expect(page).toHaveURL(new RegExp(`/${locale}/branches$`));
          if (mobile) await page.getByRole("tab", { name: messages.mobileView.map, exact: true }).click();
          await expect(page.locator("[data-map-center]")).toHaveAttribute("data-map-center",
            JSON.stringify({ lat: selected.latitude, lng: selected.longitude }));
          await expect(page.locator("[data-map-zoom]")).toHaveAttribute("data-map-zoom", "14");
          const selectionPopup = mobile
            ? page.getByRole("dialog", { name: selected.displayName }) : page.getByTestId("map-info-window");
          await expect(selectionPopup.getByRole("link", { name: messages.branches.details, exact: true }))
            .toHaveAttribute("href", `/${locale}/branches/${selected.slug}`);
          if (!mobile) await expect(selectionPopup).toHaveAttribute("data-native-header-disabled", "true");
          const close = selectionPopup.getByRole("button", { name: messages.map.closePopup, exact: true });
          if (mobile) await close.tap();
          else await close.click();
          await expect(selectionPopup).not.toBeVisible();
          await expect(page.locator('.locator-card[data-selected="true"]')).toHaveCount(0);
        }

        for (const label of [messages.branches.details, branch.displayName]) {
          await page.goto(`/${locale}/branches`);
          if (mobile) await page.getByRole("tab", { name: messages.mobileView.map, exact: true }).click();
          const marker = page.getByRole("button", { name: `Map marker: ${branch.displayName}`, exact: true });
          if (mobile) await marker.tap();
          else await marker.click();
          const popup = mobile
            ? page.getByRole("dialog", { name: branch.displayName })
            : page.getByTestId("map-info-window");
          const link = popup.getByRole("link", { name: label, exact: true });
          await expect(link).toHaveAttribute("href", `/${locale}/branches/${branch.slug}`);
          if (mobile) await link.tap();
          else await link.click();
          await expect(page).toHaveURL(new RegExp(`/${locale}/branches/${branch.slug}$`));
          await expect(page.getByRole("heading", { level: 1, name: branch.displayName, exact: true })).toBeVisible();
        }
      });
    }
  });
}
