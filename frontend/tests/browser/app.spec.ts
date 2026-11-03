import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { fixture } from "../fixture";
test("map, populated corridor, forecast, responsive layout and accessibility", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    // MapLibre cancels obsolete tile requests when fitBounds changes the viewport.
    if (
      request.url().startsWith("https://tiles.openfreemap.org/") &&
      request.failure()?.errorText === "net::ERR_ABORTED"
    )
      return;
    errors.push(request.url() + ": " + request.failure()?.errorText);
  });
  await page.route("**/api/places?*", (r) =>
    r.fulfill({
      json: {
        places: [
          { label: "Synthetic test location", position: [-77.41, 39.41] },
        ],
      },
    }),
  );
  await page.route("**/api/analysis", (r) => r.fulfill({ json: fixture() }));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".maplibregl-canvas")).toBeVisible();
  const canvas = await page.locator(".maplibregl-canvas").boundingBox();
  expect(canvas?.height).toBeGreaterThan(300);
  await expect(
    page.getByRole("region", { name: "Interactive route and weather map" }),
  ).toHaveAttribute("data-ready", "true", { timeout: 30000 });
  await page.screenshot({
    path: `../docs/empty-${info.project.name}.png`,
    fullPage: true,
  });
  for (const label of ["Origin", "Destination"]) {
    await page
      .getByRole("combobox", { name: label, exact: true })
      .fill("Synthetic");
    await page.getByRole("option", { name: "Synthetic test location" }).click();
  }
  await page.getByRole("button", { name: /Compare routes/ }).click();
  await expect(
    page.getByRole("region", { name: "Route exposure comparison" }),
  ).toBeVisible();
  for (const value of ["0", "24", "48"]) {
    await page.getByRole("slider").fill(value);
    await expect(page.getByRole("slider")).toHaveValue(value);
  }
  await expect(page.getByText(/PREFERRED \/ ROUTE 1/)).toBeVisible();
  await page.getByRole("button", { name: "Fit all routes" }).click();
  await page.getByRole("button", { name: /Route 2/ }).click();
  await page.getByRole("button", { name: /Origin/ }).click();
  await expect(
    page.getByRole("region", { name: "Checkpoint weather" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({
    path: `../docs/populated-synthetic-${info.project.name}.png`,
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("loading and structured errors", async ({ page }) => {
  await page.route("**/api/places?*", (r) =>
    r.fulfill({
      status: 503,
      json: {
        error: {
          code: "credentials_missing",
          message: "Live routing requires ORS_API_KEY in backend/.env.",
        },
      },
    }),
  );
  await page.goto("/");
  await page
    .getByRole("combobox", { name: "Origin", exact: true })
    .fill("Frederick");
  await expect(
    page.getByText("Live routing requires ORS_API_KEY in backend/.env.", {
      exact: true,
    }),
  ).toContainText("ORS_API_KEY");
});
