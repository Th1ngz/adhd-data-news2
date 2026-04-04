function formatNumber(value) {
  const numeric = Number(value);
  if (Number.isInteger(numeric)) {
    return numeric.toLocaleString("zh-CN");
  }
  return numeric.toLocaleString("zh-CN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

function formatPercent(value) {
  return `${Number(value).toFixed(1).replace(".0", "")}%`;
}

function makeBarChart(container, items, options) {
  const { maxValue, valueKey = "count", valueFormatter, emphasizeLabel } = options;
  const chart = document.createElement("div");
  chart.className = "bar-chart";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "bar-row";

    const head = document.createElement("div");
    head.className = "bar-head";

    const label = document.createElement("span");
    label.className = "bar-label";
    label.textContent = item.label;

    const value = document.createElement("span");
    value.className = "bar-value";
    value.textContent = valueFormatter(item);

    const track = document.createElement("div");
    track.className = "bar-track";

    const fill = document.createElement("div");
    fill.className = "bar-fill";
    if (emphasizeLabel && item.label === emphasizeLabel) {
      fill.classList.add("is-emphasis");
    }
    fill.style.width = `${Math.max((item[valueKey] / maxValue) * 100, 4)}%`;

    track.appendChild(fill);
    head.append(label, value);
    row.append(head, track);
    chart.appendChild(row);
  });

  container.innerHTML = "";
  container.appendChild(chart);
}

function renderStaticBarCharts(data) {
  makeBarChart(document.getElementById("content-type-chart"), data.contentTypeStats, {
    maxValue: Math.max(...data.contentTypeStats.map((item) => item.count)),
    valueFormatter: (item) => `${item.count} · ${formatPercent(item.percent)}`
  });

  makeBarChart(document.getElementById("author-type-chart"), data.authorTypeStats, {
    maxValue: Math.max(...data.authorTypeStats.map((item) => item.count)),
    valueFormatter: (item) => `${item.count} · ${formatPercent(item.percent)}`,
    emphasizeLabel: "医生/医院/专业机构"
  });

  makeBarChart(document.getElementById("impact-chart"), data.impactStats, {
    maxValue: Math.max(...data.impactStats.map((item) => item.count)),
    valueFormatter: (item) => `${item.count} · ${formatPercent(item.percent)}`
  });

  makeBarChart(document.getElementById("boundary-chart"), data.boundaryCoverageStats, {
    maxValue: 100,
    valueKey: "percent",
    valueFormatter: (item) => `${item.count} · ${formatPercent(item.percent)}`
  });
}

function renderEngagementChart(data) {
  const host = document.getElementById("engagement-chart");
  host.innerHTML = "";

  const wrapper = document.createElement("div");
  wrapper.className = "engagement-switcher";

  const switches = document.createElement("div");
  switches.className = "switches";

  const chartHost = document.createElement("div");
  const metrics = [
    { key: "likes", label: "点赞中位数" },
    { key: "favorites", label: "收藏中位数" },
    { key: "comments", label: "评论中位数" }
  ];

  const renderMetric = (metricKey) => {
    const sortedItems = [...data.engagementMedianStats].sort((a, b) => b[metricKey] - a[metricKey]);
    makeBarChart(chartHost, sortedItems, {
      maxValue: Math.max(...sortedItems.map((item) => item[metricKey])),
      valueKey: metricKey,
      valueFormatter: (item) => formatNumber(item[metricKey])
    });

    [...switches.querySelectorAll(".metric-toggle")].forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.metric === metricKey));
    });
  };

  metrics.forEach((metric, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "metric-toggle";
    button.dataset.metric = metric.key;
    button.textContent = metric.label;
    button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
    button.addEventListener("click", () => renderMetric(metric.key));
    switches.appendChild(button);
  });

  wrapper.append(switches, chartHost);
  host.appendChild(wrapper);
  renderMetric("likes");
}

function renderMatrixChart(data) {
  const host = document.getElementById("matrix-chart");
  host.innerHTML = "";

  const lookup = Object.fromEntries(
    data.matrixStats.map((item) => [`${item.resonance}-${item.boundary}`, item])
  );

  const wrapper = document.createElement("div");
  wrapper.className = "matrix-chart";

  const topLabels = document.createElement("div");
  topLabels.className = "matrix-top";
  topLabels.innerHTML = "<span></span><span>低共鸣</span><span>高共鸣</span>";

  const gridWrap = document.createElement("div");
  gridWrap.className = "matrix-grid-wrap";

  const side = document.createElement("div");
  side.className = "matrix-side";
  side.innerHTML = "<span>低边界</span><span>高边界</span>";

  const grid = document.createElement("div");
  grid.className = "matrix-grid";

  [
    ["低共鸣", "低边界"],
    ["高共鸣", "低边界"],
    ["低共鸣", "高边界"],
    ["高共鸣", "高边界"]
  ].forEach(([resonance, boundary]) => {
    const item = lookup[`${resonance}-${boundary}`];
    const cell = document.createElement("div");
    cell.className = "matrix-cell";
    if (resonance === "高共鸣" && boundary === "低边界") {
      cell.classList.add("is-emphasis");
    }
    cell.innerHTML = `
      <div class="matrix-cell-title">${resonance} · ${boundary}</div>
      <div class="matrix-count">${item.count}</div>
      <div class="matrix-meta">${formatPercent(item.percent)}</div>
    `;
    grid.appendChild(cell);
  });

  const caption = document.createElement("p");
  caption.className = "matrix-caption";
  caption.textContent = "横向比较共鸣强度，纵向比较边界提醒。";

  gridWrap.append(side, grid);
  wrapper.append(topLabels, gridWrap, caption);
  host.appendChild(wrapper);
}

function renderRiskChart(data) {
  const host = document.getElementById("risk-chart");
  host.innerHTML = "";

  const maxPercent = Math.max(...data.riskStats.map((item) => item.percent));
  const labelMap = {
    "是否直接引导自我判断": "引导自我判断",
    "是否将普遍体验直接等同于ADHD": "把普遍体验等同于 ADHD",
    "是否存在人格化/标签化/天赋化表达": "人格化 / 标签化 / 天赋化表达",
    "是否存在商业导向": "商业导向"
  };
  const chart = document.createElement("div");
  chart.className = "vertical-chart";

  data.riskStats.forEach((item) => {
    const block = document.createElement("div");
    block.className = "vbar-item";

    const value = document.createElement("div");
    value.className = "vbar-value";
    value.textContent = formatPercent(item.percent);

    const track = document.createElement("div");
    track.className = "vbar-track";

    const fill = document.createElement("div");
    fill.className = "vbar-fill";
    if (item.label === "是否存在商业导向") {
      fill.classList.add("is-soft");
    }
    fill.style.height = `${Math.max((item.percent / maxPercent) * 100, 12)}%`;

    const label = document.createElement("div");
    label.className = "vbar-label";
    label.textContent = labelMap[item.label] || item.label;

    track.appendChild(fill);
    block.append(value, track, label);
    chart.appendChild(block);
  });

  host.appendChild(chart);
}

function renderStoryCharts() {
  const data = window.XHS_ADHD_DATA;
  if (!data) {
    return;
  }

  renderStaticBarCharts(data);
  renderEngagementChart(data);
  renderMatrixChart(data);
  renderRiskChart(data);
}

function observeFrame(frame) {
  try {
    const doc = frame.contentDocument || frame.contentWindow.document;
    const target = doc.querySelector(".cards-container") || doc.body;
    const resize = () => {
      const nextHeight = Math.max(target.scrollHeight, doc.body.scrollHeight) + 24;
      frame.style.height = `${nextHeight}px`;
    };

    resize();

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(() => resize());
      observer.observe(target);
      frame._observer = observer;
    } else {
      frame._poll = window.setInterval(resize, 500);
    }

    if (doc.fonts && doc.fonts.ready) {
      doc.fonts.ready.then(resize).catch(() => {});
    }
  } catch (error) {
    console.warn("无法同步 iframe 高度", error);
  }
}

function initFrames() {
  document.querySelectorAll("iframe.auto-iframe").forEach((frame) => {
    if (frame.dataset.observed === "1") {
      return;
    }
    frame.dataset.observed = "1";
    if (frame.contentDocument && frame.contentDocument.readyState === "complete") {
      observeFrame(frame);
    }
    frame.addEventListener("load", () => observeFrame(frame));
  });
}

function initReveal() {
  const nodes = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -10% 0px" }
  );

  nodes.forEach((node) => observer.observe(node));
}

document.addEventListener("DOMContentLoaded", () => {
  renderStoryCharts();
  initFrames();
  initReveal();
});
