import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outputDir = dirname(fileURLToPath(import.meta.url));

const profile = {
  name: "David Pine",
  handle: "@IEvangelist",
  links: {
    github: "https://github.com/IEvangelist",
    darkSvg: "https://raw.githubusercontent.com/IEvangelist/IEvangelist/main/dark_mode.svg",
    lightSvg: "https://raw.githubusercontent.com/IEvangelist/IEvangelist/main/light_mode.svg",
  },
};

const columns = {
  left: { labelX: 80, valueRightX: 570, width: 55 },
  right: { labelX: 620, valueRightX: 878, width: 31 },
};

const rows = [
  { column: "left", y: 170, label: "Uptime", value: "12+ years on GitHub" },
  { column: "left", y: 193, label: "Host", value: "Microsoft" },
  { column: "left", y: 216, label: "Kernel", value: "Senior Software Engineer" },
  { column: "left", y: 239, label: "IDE", value: "GitHub Copilot App, Visual Studio Code" },
  { column: "left", y: 296, section: "Languages" },
  { column: "left", y: 324, label: "Programming", value: "C#, TypeScript, JavaScript, Python" },
  { column: "left", y: 347, label: "Markup", value: "HTML, CSS, Markdown, JSON, YAML" },
  { column: "left", y: 370, label: "Real", value: "English" },
  { column: "left", y: 412, section: "Focus" },
  { column: "left", y: 444, label: "Building", value: "Aspire, developer tooling" },
  { column: "left", y: 468, label: "Creating", value: "Developer and user experiences" },
  { column: "right", y: 164, section: "Contact" },
  { column: "right", y: 194, label: "Website", value: "davidpine.dev" },
  { column: "right", y: 217, label: "GitHub", value: "IEvangelist" },
  { column: "right", y: 240, label: "X", value: "@davidpine7" },
  { column: "right", y: 263, label: "Bluesky", value: "@davidpine.dev" },
  { column: "right", y: 286, label: "LinkedIn", value: "in/dpine" },
  { column: "right", y: 324, section: "GitHub Stats" },
  { column: "right", y: 354, label: "Repos", value: "331" },
  { column: "right", y: 377, label: "Gists", value: "76" },
  { column: "right", y: 400, label: "Stars", value: "1,824" },
  { column: "right", y: 423, label: "Forks", value: "561" },
  { column: "right", y: 446, label: "Followers", value: "1,016" },
];

const themes = {
  dark: {
    bg: "#0F1020",
    panel: "#17142D",
    text: "#F8FAFC",
    muted: "#C7D2FE",
    key: "#FF7AD9",
    value: "#5EEAD4",
    accent: "#E879F9",
    dots: "#A78BFA",
    shadow: "#000000",
  },
  light: {
    bg: "#FFF7FE",
    panel: "#FFFFFF",
    text: "#1F2937",
    muted: "#4B5563",
    key: "#BE185D",
    value: "#0F766E",
    accent: "#7E22CE",
    dots: "#6B7280",
    shadow: "#7E22CE",
  },
};

function xml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function renderRow(row) {
  const col = columns[row.column];
  if (row.section) {
    const title = `- ${row.section} `;
    const dashes = "-".repeat(Math.max(0, col.width - title.length));
    return `<tspan x="${col.labelX}" y="${row.y}" class="accent">${xml(title)}</tspan><tspan class="cc">${dashes}</tspan>`;
  }

  const gap = col.width - row.label.length - row.value.length - 2;
  const dots = ".".repeat(Math.max(3, gap));
  return `<tspan x="${col.labelX}" y="${row.y}" class="key">${xml(row.label)}</tspan><tspan class="cc"> ${dots} </tspan><tspan class="value">${xml(row.value)}</tspan>`;
}

function renderSvg(name, theme) {
  const rowMarkup = rows.map(renderRow).join("\n  ");

  return `<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns="http://www.w3.org/2000/svg" font-family="ConsolasFallback,Consolas,monospace" width="985px" height="530px" font-size="15px" role="img" aria-labelledby="title desc">
<title id="title">David Pine GitHub profile README card (${name} mode)</title>
<desc id="desc">A terminal-inspired profile card for David Pine.</desc>
<style>
@font-face { src: local('Consolas'), local('Consolas Bold'); font-family: 'ConsolasFallback'; font-display: swap; -webkit-size-adjust: 109%; size-adjust: 109%; }
.text { fill: ${theme.text}; }
.key { fill: ${theme.key}; font-weight: 700; }
.value { fill: ${theme.value}; }
.accent { fill: ${theme.accent}; font-weight: 700; }
.muted { fill: ${theme.muted}; }
.cc { fill: ${theme.dots}; }
text, tspan { white-space: pre; }
</style>
<defs>
  <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${theme.key}"/><stop offset="48%" stop-color="${theme.accent}"/><stop offset="100%" stop-color="${theme.value}"/></linearGradient>
  <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${theme.key}" stop-opacity="0.30"/><stop offset="55%" stop-color="${theme.accent}" stop-opacity="0.22"/><stop offset="100%" stop-color="${theme.value}" stop-opacity="0.26"/></linearGradient>
  <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="14" stdDeviation="16" flood-color="${theme.shadow}" flood-opacity="0.30"/></filter>
</defs>
<rect width="985" height="530" fill="${theme.bg}" rx="18"/>
<circle cx="920" cy="68" r="94" fill="${theme.accent}" opacity="0.15"/>
<circle cx="848" cy="462" r="76" fill="${theme.value}" opacity="0.13"/>
<circle cx="100" cy="456" r="66" fill="${theme.key}" opacity="0.14"/>
<rect x="24" y="24" width="937" height="482" fill="${theme.panel}" stroke="url(#edge)" stroke-width="2" rx="18" filter="url(#soft-shadow)"/>
<rect x="56" y="50" width="873" height="56" fill="url(#bar)" rx="14"/>
<text class="text">
  <tspan x="80" y="84" class="accent" font-size="24px">${xml(profile.name)}</tspan>
  <tspan x="905" y="84" class="muted" text-anchor="end">${xml(profile.handle)}</tspan>
  ${rowMarkup}
</text>
</svg>
`;
}

writeFileSync(join(outputDir, "dark_mode.svg"), renderSvg("dark", themes.dark));
writeFileSync(join(outputDir, "light_mode.svg"), renderSvg("light", themes.light));
writeFileSync(
  join(outputDir, "README.md"),
  `<a href="${profile.links.github}">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="${profile.links.darkSvg}">
    <img alt="David Pine's GitHub Profile README" src="${profile.links.lightSvg}">
  </picture>
</a>
`,
);
