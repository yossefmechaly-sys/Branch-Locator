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
