import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outputDir = dirname(fileURLToPath(import.meta.url));

const profile = {
  login: "IEvangelist",
  name: "David Pine",
  handle: "@IEvangelist",
  links: {
    github: "https://github.com/IEvangelist",
    darkSvg: "https://raw.githubusercontent.com/IEvangelist/IEvangelist/main/dark_mode.svg",
    lightSvg: "https://raw.githubusercontent.com/IEvangelist/IEvangelist/main/light_mode.svg",
  },
};

const svg = {
  width: 985,
  height: 610,
  panel: { x: 24, y: 24, width: 937, height: 562 },
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
  { column: "right", y: 377, label: "Stars", value: "1,824" },
  { column: "right", y: 400, label: "Commits", value: "0" },
  { column: "right", y: 423, label: "LoC", value: "0" },
  { column: "right", y: 446, label: "Added", value: "0++" },
  { column: "right", y: 469, label: "Deleted", value: "0--" },
  { column: "right", y: 492, label: "Followers", value: "1,016" },
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

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

async function githubGraphql(query, variables = {}) {
  const headers = {
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "IEvangelist-profile-readme",
  };
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify({ query, variables }),
    });
    if (response.ok) {
      const payload = await response.json();
      if (payload.errors?.length) {
        throw new Error(`GitHub GraphQL returned errors: ${JSON.stringify(payload.errors)}`);
      }

      return payload.data;
    }

    const body = await response.text();
    if (![502, 503, 504].includes(response.status) || attempt === 4) {
      throw new Error(`GitHub GraphQL request failed: ${response.status} ${body}`);
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }
}

async function githubJson(path) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "IEvangelist-profile-readme",
  };
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${path} ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function getPublicRepos(login) {
  const repos = [];
  for (let page = 1; ; page += 1) {
    const batch = await githubJson(`/users/${login}/repos?per_page=100&page=${page}&type=owner`);
    repos.push(...batch);
    if (batch.length < 100) {
      return repos;
    }
  }
}

async function getGithubStats(login) {
  const [user, repos] = await Promise.all([
    githubJson(`/users/${login}`),
    getPublicRepos(login),
  ]);
  const [commitContributions, loc] = await Promise.all([
    getCommitContributions(login, user.created_at),
    getLineOfCodeStats(login, repos),
  ]);

  return {
    repos: user.public_repos,
    gists: user.public_gists,
    followers: user.followers,
    stars: repos.reduce((total, repo) => total + repo.stargazers_count, 0),
    forks: repos.reduce((total, repo) => total + repo.forks_count, 0),
    commitContributions,
    loc,
  };
}

async function getCommitContributions(login, createdAt) {
  const query = `
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
        }
      }
    }`;

  let total = 0;
  const startYear = new Date(createdAt).getUTCFullYear();
  const currentYear = new Date().getUTCFullYear();
  for (let year = startYear; year <= currentYear; year += 1) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = year === currentYear ? new Date().toISOString() : `${year}-12-31T23:59:59Z`;
    const data = await githubGraphql(query, { login, from, to });
    total += data.user.contributionsCollection.totalCommitContributions;
  }

  return total;
}

async function getLineOfCodeStats(login, repos) {
  const query = `
    query($owner: String!, $name: String!, $cursor: String) {
      repository(owner: $owner, name: $name) {
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 100, after: $cursor) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                edges {
                  node {
                    additions
                    deletions
                    author {
                      user {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;

  let additions = 0;
  let deletions = 0;
  const sourceRepos = repos.filter((repo) => !repo.archived && !repo.fork);

  for (const repo of sourceRepos) {
    let cursor = null;
    try {
      for (;;) {
        const data = await githubGraphql(query, {
          owner: repo.owner.login,
          name: repo.name,
          cursor,
        });
        const history = data.repository?.defaultBranchRef?.target?.history;
        if (!history) {
          break;
        }

        for (const edge of history.edges) {
          if (edge.node.author?.user?.login === login) {
            additions += edge.node.additions;
            deletions += edge.node.deletions;
          }
        }

        if (!history.pageInfo.hasNextPage) {
          break;
        }
        cursor = history.pageInfo.endCursor;
      }
    } catch (error) {
      console.warn(`Skipping LoC for ${repo.full_name}: ${error.message}`);
    }
  }

  return {
    additions,
    deletions,
    total: additions - deletions,
  };
}

function setRowValue(label, value) {
  const row = rows.find((candidate) => candidate.label === label);
  if (!row) {
    throw new Error(`Unable to find row labeled ${label}`);
  }

  row.value = value;
}

async function updateDynamicRows() {
  const stats = await getGithubStats(profile.login);
  setRowValue("Repos", formatNumber(stats.repos));
  setRowValue("Stars", formatNumber(stats.stars));
  setRowValue("Commits", formatNumber(stats.commitContributions));
  setRowValue("LoC", formatNumber(stats.loc.total));
  setRowValue("Added", `${formatNumber(stats.loc.additions)}++`);
  setRowValue("Deleted", `${formatNumber(stats.loc.deletions)}--`);
  setRowValue("Followers", formatNumber(stats.followers));
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
<svg xmlns="http://www.w3.org/2000/svg" font-family="ConsolasFallback,Consolas,monospace" width="${svg.width}px" height="${svg.height}px" font-size="15px" role="img" aria-labelledby="title desc">
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
<rect width="${svg.width}" height="${svg.height}" fill="${theme.bg}" rx="18"/>
<circle cx="920" cy="68" r="94" fill="${theme.accent}" opacity="0.15"/>
<circle cx="848" cy="542" r="76" fill="${theme.value}" opacity="0.13"/>
<circle cx="100" cy="536" r="66" fill="${theme.key}" opacity="0.14"/>
<rect x="${svg.panel.x}" y="${svg.panel.y}" width="${svg.panel.width}" height="${svg.panel.height}" fill="${theme.panel}" stroke="url(#edge)" stroke-width="2" rx="18" filter="url(#soft-shadow)"/>
<rect x="56" y="50" width="873" height="56" fill="url(#bar)" rx="14"/>
<text class="text">
  <tspan x="80" y="84" class="accent" font-size="24px">${xml(profile.name)}</tspan>
  <tspan x="905" y="84" class="muted" text-anchor="end">${xml(profile.handle)}</tspan>
  ${rowMarkup}
</text>
</svg>
`;
}

await updateDynamicRows();

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
