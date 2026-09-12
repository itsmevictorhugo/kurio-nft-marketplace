/* global URL, process, fetch, setTimeout, console */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import lighthouse, { defaultConfig, desktopConfig } from 'lighthouse';
import { ReportGenerator } from 'lighthouse/report/generator/report-generator.js';
import { launch } from 'chrome-launcher';

const root = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const reportsDir = resolve(root, 'reports', 'lighthouse');
const profileRoot = join(tmpdir(), 'kurio-lighthouse-profiles');
const baseUrl = process.env.LIGHTHOUSE_BASE_URL ?? 'http://127.0.0.1:4199';
const previewPort = Number(process.env.LIGHTHOUSE_PREVIEW_PORT ?? 4199);
const runsPerScenario = Number(process.env.LIGHTHOUSE_RUNS ?? 3);

const categories = ['performance', 'accessibility', 'best-practices', 'seo'];

const thresholds = {
  performance: 90,
  accessibility: 95,
  'best-practices': 95,
  seo: 90,
};

const scenarios = [
  { key: 'home', label: 'Home', url: `${baseUrl}/` },
  { key: 'nft-detail', label: 'NFT Detail', url: `${baseUrl}/nfts/nft-aurora` },
];

const profiles = [
  { key: 'mobile', label: 'mobile' },
  { key: 'desktop', label: 'desktop' },
];

function probeChromePath() {
  if (process.env.CHROME_PATH) {
    return process.env.CHROME_PATH;
  }
  const roots = [
    process.env.PROGRAMFILES,
    process.env['PROGRAMFILES(X86)'],
    process.env.LOCALAPPDATA,
  ].filter(Boolean);
  for (const rootDir of roots) {
    const candidate = join(rootDir, 'Google', 'Chrome', 'Application', 'chrome.exe');
    if (existsSync(candidate)) {
      process.env.CHROME_PATH = candidate;
      return candidate;
    }
  }
  return undefined;
}

function buildConfig(profile) {
  const base = profile === 'desktop' ? desktopConfig : defaultConfig;
  return {
    ...base,
    settings: {
      ...base.settings,
      channel: 'kurio-lighthouse-audit',
      onlyCategories: categories,
    },
  };
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function categoryScore(lhr, category) {
  return Math.round((lhr.categories[category]?.score ?? 0) * 100);
}

function metricValue(lhr, metric) {
  return lhr.audits[metric]?.numericValue ?? null;
}

function waitForServer() {
  const deadline = Date.now() + 30_000;
  return new Promise((resolveReady, rejectReady) => {
    async function poll() {
      if (Date.now() > deadline) {
        rejectReady(new Error('Preview server did not become ready in time.'));
        return;
      }
      try {
        const response = await fetch(baseUrl);
        if (response.ok) {
          resolveReady();
          return;
        }
      } catch {
        // server not up yet
      }
      setTimeout(poll, 250);
    }
    poll();
  });
}

function startPreview() {
  const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js');
  const worker = spawn(process.execPath, [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort'], {
    cwd: root,
    stdio: 'ignore',
    windowsHide: true,
  });
  return worker;
}

async function main() {
  probeChromePath();
  mkdirSync(reportsDir, { recursive: true });

  const server = startPreview();
  try {
    await waitForServer();

    const summary = {
      tool: { name: 'Lighthouse', version: undefined },
      environment: {
        node: process.version,
        platform: process.platform,
        chromePath: process.env.CHROME_PATH,
        baseUrl,
        previewPort,
        mockScenario: 'default seed (no scenario selected)',
        runsPerScenario,
      },
      thresholds,
      scenarios: [],
    };

    for (const profile of profiles) {
      for (const scenario of scenarios) {
        const key = `${scenario.key}-${profile.key}`;
        const config = buildConfig(profile.key);
        const runs = [];

        for (let run = 1; run <= runsPerScenario; run += 1) {
          const outputPath = join(reportsDir, `${key}-run${run}`);
          const profileDir = join(profileRoot, key, `run-${run}`);
          mkdirSync(profileDir, { recursive: true });

          const chrome = await launch({
            chromePath: process.env.CHROME_PATH,
            userDataDir: profileDir,
            chromeFlags: ['--headless=new'],
          });

          try {
            const flags = {
              logLevel: 'error',
              port: chrome.port,
            };

            const result = await lighthouse(scenario.url, flags, config);
            if (!result) {
              throw new Error(`Lighthouse returned no result for ${key} run ${run}.`);
            }

            const lhr = result.lhr;
            summary.tool.version = lhr.lighthouseVersion;

            writeFileSync(`${outputPath}.json`, JSON.stringify(lhr, null, 2));
            writeFileSync(`${outputPath}.html`, ReportGenerator.generateReportHtml(lhr));

            const lcpAudit = lhr.audits['largest-contentful-paint-element']?.displayValue ?? null;

          const row = {
            run,
            fetchTime: lhr.fetchTime,
            scores: Object.fromEntries(categories.map((category) => [category, categoryScore(lhr, category)])),
            metrics: {
              lcp: metricValue(lhr, 'largest-contentful-paint'),
              cls: metricValue(lhr, 'cumulative-layout-shift'),
              tbt: metricValue(lhr, 'total-blocking-time'),
            },
            lcpElement: lcpAudit,
            config: {
              formFactor: lhr.configSettings.formFactor,
              throttlingMethod: lhr.configSettings.throttlingMethod,
              screenEmulation: lhr.configSettings.screenEmulation,
            },
            environment: {
              hostUserAgent: lhr.environment.hostUserAgent,
              networkUserAgent: lhr.environment.networkUserAgent,
              benchmarkIndex: lhr.environment.benchmarkIndex,
            },
          };
          runs.push(row);
          console.log(`[${key}] run ${run}/${runsPerScenario} `
            + `P=${row.scores.performance} A=${row.scores.accessibility} `
            + `BP=${row.scores['best-practices']} SEO=${row.scores.seo} `
            + `LCP=${row.metrics.lcp}ms CLS=${row.metrics.cls} TBT=${row.metrics.tbt}ms`);
          } finally {
            await chrome.kill();
          }
        }

        const medians = {
          scores: Object.fromEntries(categories.map((category) => [
            category,
            median(runs.map((run) => run.scores[category])),
          ])),
          metrics: {
            lcp: median(runs.filter((run) => run.metrics.lcp !== null).map((run) => run.metrics.lcp)),
            cls: median(runs.filter((run) => run.metrics.cls !== null).map((run) => run.metrics.cls)),
            tbt: median(runs.filter((run) => run.metrics.tbt !== null).map((run) => run.metrics.tbt)),
          },
        };
        medians.pass = Object.fromEntries(categories.map((category) => [
          category,
          medians.scores[category] >= thresholds[category],
        ]));
        medians.overallPass = categories.every((category) => medians.pass[category]);
        medians.sampleConfig = runs[0].config;
        medians.sampleEnvironment = runs[0].environment;

        summary.scenarios.push({
          scenario: scenario.key,
          label: scenario.label,
          url: scenario.url,
          profile: profile.key,
          medians,
          runs,
        });

        console.log(`-- ${scenario.label} (${profile.key}) medians: `
          + `P=${medians.scores.performance} A=${medians.scores.accessibility} `
          + `BP=${medians.scores['best-practices']} SEO=${medians.scores.seo} `
          + `=> ${medians.overallPass ? 'PASS' : 'FAIL'}`);
      }
    }

    writeFileSync(join(reportsDir, 'summary.json'), JSON.stringify(summary, null, 2));

    console.log('\nEnvironment');
    console.table([summary.environment]);
    console.log(`Reports saved to ${reportsDir}`);

    const failing = summary.scenarios.filter((entry) => !entry.medians.overallPass);
    if (failing.length > 0) {
      console.error(`\nFAIL: ${failing.length} scenario(s) below the required thresholds. See summary.json.`);
      process.exitCode = 1;
    } else {
      console.log('\nPASS: all scenarios meet the required thresholds.');
    }
  } finally {
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});