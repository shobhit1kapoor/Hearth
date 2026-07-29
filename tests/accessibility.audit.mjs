import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";

const baseUrl = process.env.HEARTH_A11Y_URL || "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const auditedAt = new Date().toISOString();
const pages = [];

async function audit(label) {
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  pages.push({
    label,
    url: page.url(),
    violations: report.violations.map((item) => ({
      id: item.id,
      impact: item.impact,
      description: item.description,
      help: item.help,
      nodes: item.nodes.map((node) => ({ target: node.target, failureSummary: node.failureSummary })),
    })),
    passes: report.passes.length,
    incomplete: report.incomplete.length,
  });
}

await page.goto(baseUrl, { waitUntil: "networkidle" });
await audit("Welcome and scope");
await page.getByRole("button", { name: "Reviewer demo", exact: true }).click();
await audit("Guided reviewer demo");
await page.getByRole("button", { name: "Timed burden study" }).click();
await audit("Timed burden study");

await page.goto(baseUrl, { waitUntil: "networkidle" });
await page.keyboard.press("Tab");
const skipFocused = await page.locator(".skip-link").evaluate((element) => document.activeElement === element);
await page.keyboard.press("Enter");
const skipReachedMain = await page.locator("#main-content").evaluate((element) => document.activeElement === element);

await page.getByRole("button", { name: "Reviewer demo", exact: true }).click();
const focusChecks = [];
for (let index = 0; index < 18; index += 1) {
  await page.keyboard.press("Tab");
  focusChecks.push(await page.evaluate(() => {
    const element = document.activeElement;
    if (!(element instanceof HTMLElement)) return { tag: "unknown", visible: false };
    const style = getComputedStyle(element);
    return {
      tag: element.tagName,
      name: element.innerText || element.getAttribute("aria-label") || "",
      visible: Number.parseFloat(style.outlineWidth || "0") >= 2 || style.boxShadow !== "none",
    };
  }));
}

await page.setViewportSize({ width: 320, height: 720 });
await page.goto(baseUrl, { waitUntil: "networkidle" });
const beforeOpen = await page.getByRole("button", { name: "Open navigation" }).isVisible();
await page.getByRole("button", { name: "Open navigation" }).click();
const mobileNavVisible = await page.getByRole("navigation", { name: "HEARTH sections" }).isVisible();
const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
await page.getByRole("button", { name: "Timed burden study" }).click();
const studyOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

function rgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255);
}
function luminance(hex) {
  const values = rgb(hex).map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
}
function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return Number(((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2));
}
const contrastMatrix = [
  ["Ink on paper", "#1b2823", "#f7f3eb", 4.5],
  ["Muted on paper", "#63706b", "#f7f3eb", 4.5],
  ["Faint on white", "#65716c", "#ffffff", 4.5],
  ["White on pine", "#ffffff", "#173f32", 4.5],
  ["Pine on white", "#173f32", "#ffffff", 4.5],
  ["Focus amber on paper", "#8a5b17", "#f7f3eb", 3],
].map(([label, foreground, background, threshold]) => {
  const ratio = contrast(foreground, background);
  return { label, foreground, background, ratio, threshold, passed: ratio >= threshold };
});

const result = {
  auditedAt,
  baseUrl,
  tool: "Playwright + axe-core",
  axe: {
    pages,
    violationCount: pages.reduce((sum, item) => sum + item.violations.length, 0),
    seriousOrCritical: pages.flatMap((item) => item.violations).filter((item) => item.impact === "serious" || item.impact === "critical").length,
  },
  keyboard: {
    skipFocused,
    skipReachedMain,
    sampledFocusIndicatorsVisible: focusChecks.every((item) => item.visible),
    samples: focusChecks,
  },
  mobile: { beforeOpen, mobileNavVisible, mobileOverflow, studyOverflow },
  contrastMatrix,
};
await mkdir("evidence/accessibility", { recursive: true });
await writeFile("evidence/accessibility/results.json", JSON.stringify(result, null, 2));

const violationLines = pages.flatMap((item) => item.violations.map((violation) =>
  `- **${item.label} / ${violation.id} (${violation.impact ?? "unknown"}):** ${violation.help}; ${violation.nodes.length} affected node(s).`,
));
const report = `# Automated accessibility results

Executed: ${auditedAt}  
Runtime: Playwright Chromium with axe-core WCAG 2 A/AA, 2.1 AA, and 2.2 AA rules  
Target: ${baseUrl}

## Summary

| Check | Result |
|---|---|
| Axe page states | ${pages.length} |
| Axe rule violations | ${result.axe.violationCount} |
| Serious or critical violations | ${result.axe.seriousOrCritical} |
| Skip link receives first focus | ${skipFocused ? "Pass" : "Fail"} |
| Skip link moves focus to main | ${skipReachedMain ? "Pass" : "Fail"} |
| Sampled focus indicators visible | ${result.keyboard.sampledFocusIndicatorsVisible ? "Pass" : "Fail"} |
| 320px navigation available | ${beforeOpen && mobileNavVisible ? "Pass" : "Fail"} |
| 320px welcome horizontal overflow | ${mobileOverflow ? "Fail" : "Pass"} |
| 320px burden-study horizontal overflow | ${studyOverflow ? "Fail" : "Pass"} |

## Axe findings

${violationLines.length ? violationLines.join("\n") : "No axe violations detected in the three audited states."}

## Token contrast

| Pair | Ratio | Threshold | Result |
|---|---:|---:|---|
${contrastMatrix.map((item) => `| ${item.label} | ${item.ratio}:1 | ${item.threshold}:1 | ${item.passed ? "Pass" : "Fail"} |`).join("\n")}

Automated checks do not establish full WCAG conformance or caregiver usability. Screen-reader testing with caregivers remains unperformed.
`;
await writeFile("evidence/accessibility/automated-results.md", report);
await browser.close();

const blocking = result.axe.seriousOrCritical > 0 || !skipFocused || !skipReachedMain || mobileOverflow || studyOverflow;
console.log(`Accessibility: ${result.axe.violationCount} axe violations; blocking=${blocking}.`);
if (blocking) process.exitCode = 1;
