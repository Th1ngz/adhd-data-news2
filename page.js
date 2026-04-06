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

function visibleItems(items) {
  return items.filter((item) => item.label !== "无法判断");
}

function appendChildren(parent, children) {
  children.forEach((child) => parent.appendChild(child));
  return parent;
}

function renderContentRibbonChart(data) {
  const host = document.getElementById("content-type-chart");
  if (!host) {
    return;
  }

  const items = visibleItems(data.contentTypeStats);
  const maxCount = Math.max(...items.map((item) => item.count));
  const chart = document.createElement("div");
  chart.className = "ribbon-chart";

  items.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "ribbon-row";

    const rank = document.createElement("div");
    rank.className = "ribbon-rank";
    rank.textContent = `${index + 1}`;

    const track = document.createElement("div");
    track.className = "ribbon-track";

    const fill = document.createElement("div");
    fill.className = "ribbon-fill";
    fill.style.width = `${Math.max((item.count / maxCount) * 100, 32)}%`;

    const label = document.createElement("span");
    label.className = "ribbon-label";
    label.textContent = item.label;

    const meta = document.createElement("div");
    meta.className = "ribbon-meta";
    meta.textContent = `${item.count} · ${formatPercent(item.percent)}`;

    fill.appendChild(label);
    track.appendChild(fill);
    appendChildren(row, [rank, track, meta]);
    chart.appendChild(row);
  });

  host.innerHTML = "";
  host.appendChild(chart);
}

function renderAuthorDotChart(data) {
  const host = document.getElementById("author-type-chart");
  if (!host) {
    return;
  }

  const items = visibleItems(data.authorTypeStats);
  const chart = document.createElement("div");
  chart.className = "author-dot-chart";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "author-row";
    if (item.label === "医生/医院/专业机构") {
      row.classList.add("is-doctor");
    }

    const label = document.createElement("div");
    label.className = "author-label";
    label.textContent = item.label;

    const dots = document.createElement("div");
    dots.className = "author-dots";

    for (let index = 0; index < item.count; index += 1) {
      const dot = document.createElement("span");
      dot.className = "author-dot";
      dots.appendChild(dot);
    }

    const meta = document.createElement("div");
    meta.className = "author-meta";
    meta.textContent = `${item.count} · ${formatPercent(item.percent)}`;

    appendChildren(row, [label, dots, meta]);
    chart.appendChild(row);
  });

  host.innerHTML = "";
  host.appendChild(chart);
}

function renderEngagementChart(data) {
  const host = document.getElementById("engagement-chart");
  if (!host) {
    return;
  }

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

  const animateLine = (segment, dot, position) => {
    segment.style.width = "0%";
    dot.style.left = "0%";
    requestAnimationFrame(() => {
      segment.style.width = `${position}%`;
      dot.style.left = `${position}%`;
    });
  };

  const renderMetric = (metricKey) => {
    if (host.dataset.metric === metricKey) {
      return;
    }

    host.dataset.metric = metricKey;
    const items = [...data.engagementMedianStats].sort((left, right) => right[metricKey] - left[metricKey]);
    const maxValue = Math.max(...items.map((item) => item[metricKey]));
    const chart = document.createElement("div");
    chart.className = "line-ranking";

    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "line-row";

      const label = document.createElement("div");
      label.className = "line-label";
      label.textContent = item.label;

      const track = document.createElement("div");
      track.className = "line-track";

      const segment = document.createElement("div");
      segment.className = "line-segment";

      const dot = document.createElement("div");
      dot.className = "line-dot";

      const value = document.createElement("div");
      value.className = "line-value";
      value.textContent = formatNumber(item[metricKey]);

      const position = Math.max((item[metricKey] / maxValue) * 100, 6);
      appendChildren(track, [segment, dot]);
      appendChildren(row, [label, track, value]);
      chart.appendChild(row);
      animateLine(segment, dot, position);
    });

    chartHost.innerHTML = "";
    chartHost.appendChild(chart);

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

  appendChildren(wrapper, [switches, chartHost]);
  host.appendChild(wrapper);
  host._setMetric = renderMetric;
  renderMetric("likes");
}

function renderImpactChart(data) {
  const host = document.getElementById("impact-chart");
  if (!host) {
    return;
  }

  const maxCount = Math.max(...data.impactStats.map((item) => item.count));
  const chart = document.createElement("div");
  chart.className = "pillar-chart";

  data.impactStats.forEach((item) => {
    const block = document.createElement("div");
    block.className = "pillar-item";

    const value = document.createElement("div");
    value.className = "pillar-value";
    value.textContent = `${item.count} · ${formatPercent(item.percent)}`;

    const track = document.createElement("div");
    track.className = "pillar-track";

    const fill = document.createElement("div");
    fill.className = "pillar-fill";
    fill.style.height = `${Math.max((item.count / maxCount) * 100, 24)}%`;

    const label = document.createElement("div");
    label.className = "pillar-label";
    label.textContent = item.label;

    track.appendChild(fill);
    appendChildren(block, [value, track, label]);
    chart.appendChild(block);
  });

  host.innerHTML = "";
  host.appendChild(chart);
}

function renderBoundaryChart(data) {
  const host = document.getElementById("boundary-chart");
  if (!host) {
    return;
  }

  const chart = document.createElement("div");
  chart.className = "step-chart";

  const explanations = {
    "是否提到功能损害": "有没有明确说到这些表现已经影响了生活。",
    "是否提到早发性": "有没有提醒问题通常从更早的时候就开始了。",
    "是否提到持续性": "有没有说明这不是短暂的一阵子，而是长期存在。",
    "是否提到跨情境性": "有没有指出困扰会跨学习、工作、关系等场景出现。",
    "是否建议寻求专业评估/医院就诊": "有没有把判断交还给医院或专业评估。",
    "是否提醒不要互联网诊断": "有没有明确划出网络内容不能代替诊断的边界。"
  };

  const labelMap = {
    "是否提到功能损害": "提到功能损害",
    "是否提到早发性": "提到早发性",
    "是否提到持续性": "提到持续性",
    "是否提到跨情境性": "提到跨情境性",
    "是否建议寻求专业评估/医院就诊": "建议专业评估 / 医院就诊",
    "是否提醒不要互联网诊断": "提醒不要互联网诊断"
  };

  const maxPercent = Math.max(...data.boundaryCoverageStats.map((item) => item.percent));
  const grid = document.createElement("div");
  grid.className = "step-chart-grid";

  data.boundaryCoverageStats.forEach((item) => {
    const card = document.createElement("article");
    card.className = "step-card";
    card.style.height = `${Math.max(118 + (item.percent / maxPercent) * 150, 160)}px`;

    const stat = document.createElement("div");
    stat.className = "step-stat";
    stat.textContent = `${item.count} · ${formatPercent(item.percent)}`;

    const label = document.createElement("div");
    label.className = "step-label";
    label.textContent = labelMap[item.label] || item.label;

    const note = document.createElement("p");
    note.className = "step-note";
    note.textContent = explanations[item.label] || "";

    appendChildren(card, [stat, label, note]);
    grid.appendChild(card);
  });

  chart.appendChild(grid);
  host.innerHTML = "";
  host.appendChild(chart);
}

function renderMatrixChart(data) {
  const host = document.getElementById("matrix-chart");
  if (!host) {
    return;
  }

  const lookup = Object.fromEntries(
    data.matrixStats.map((item) => [`${item.resonance}-${item.boundary}`, item])
  );

  const notes = {
    "低共鸣-低边界": "内容不太会迅速让人代入，也少提供清楚的边界。",
    "高共鸣-低边界": "最容易被迅速认领，却没有同步补足临床边界。",
    "低共鸣-高边界": "共鸣感不强，但能把判断交还给专业评估。",
    "高共鸣-高边界": "既能照见困扰，也会提醒读者不要直接自我诊断。"
  };

  const wrapper = document.createElement("div");
  wrapper.className = "matrix-chart";

  const topLabels = document.createElement("div");
  topLabels.className = "matrix-top";
  topLabels.innerHTML = "<span></span><span>低共鸣</span><span>高共鸣</span>";

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

    const title = document.createElement("div");
    title.className = "matrix-cell-title";
    title.textContent = `${resonance} · ${boundary}`;

    const count = document.createElement("div");
    count.className = "matrix-count";
    count.textContent = item.count;

    const meta = document.createElement("div");
    meta.className = "matrix-meta";
    meta.textContent = formatPercent(item.percent);

    const note = document.createElement("div");
    note.className = "matrix-note";
    note.textContent = notes[`${resonance}-${boundary}`];

    appendChildren(cell, [title, count, meta, note]);
    grid.appendChild(cell);
  });

  const gridWrap = document.createElement("div");
  gridWrap.className = "matrix-grid-wrap";
  appendChildren(gridWrap, [side, grid]);

  const caption = document.createElement("p");
  caption.className = "matrix-caption";
  caption.textContent = "横向比较代入强度，纵向比较是否给出边界提醒。";

  appendChildren(wrapper, [topLabels, gridWrap, caption]);
  host.innerHTML = "";
  host.appendChild(wrapper);
}

function renderRiskChart(data) {
  const host = document.getElementById("risk-chart");
  if (!host) {
    return;
  }

  const labelMap = {
    "是否存在人格化/标签化/天赋化表达": "人格化 / 标签化 / 天赋化表达",
    "是否直接引导自我判断": "直接引导自我判断",
    "是否将普遍体验直接等同于ADHD": "把普遍体验直接等同于 ADHD",
    "是否存在商业导向": "商业导向"
  };

  const items = [...data.riskStats].sort((left, right) => right.percent - left.percent);
  const maxPercent = Math.max(...items.map((item) => item.percent));
  const chart = document.createElement("div");
  chart.className = "risk-float-chart";

  items.forEach((item) => {
    const block = document.createElement("div");
    block.className = "risk-item";

    const value = document.createElement("div");
    value.className = "risk-value";
    value.textContent = `${item.count} · ${formatPercent(item.percent)}`;

    const stage = document.createElement("div");
    stage.className = "risk-stage";

    const bar = document.createElement("div");
    bar.className = "risk-bar";
    if (item.label === "是否存在商业导向") {
      bar.classList.add("is-soft");
    }
    bar.style.height = `${Math.max(42 + (item.percent / maxPercent) * 86, 58)}px`;

    const label = document.createElement("div");
    label.className = "risk-label";
    label.textContent = labelMap[item.label] || item.label;

    stage.appendChild(bar);
    appendChildren(block, [value, stage, label]);
    chart.appendChild(block);
  });

  host.innerHTML = "";
  host.appendChild(chart);
}

function renderStoryCharts() {
  const data = window.XHS_ADHD_DATA;
  if (!data) {
    return;
  }

  renderContentRibbonChart(data);
  renderAuthorDotChart(data);
  renderEngagementChart(data);
  renderImpactChart(data);
  renderBoundaryChart(data);
  renderMatrixChart(data);
  renderRiskChart(data);
}

function observeFrame(frame) {
  try {
    const doc = frame.contentDocument || frame.contentWindow.document;
    const resize = () => {
      const bodyHeight = doc.body ? doc.body.scrollHeight : 0;
      const rootHeight = doc.documentElement ? doc.documentElement.scrollHeight : 0;
      frame.style.height = `${Math.max(bodyHeight, rootHeight) + 28}px`;
    };

    resize();

    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(() => resize());
      observer.observe(doc.body);
      if (doc.documentElement) {
        observer.observe(doc.documentElement);
      }
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

function setActiveStoryStep(step) {
  const story = step.closest(".scrolly-story");
  if (!story || story._activeStep === step) {
    return;
  }

  story._activeStep = step;
  story.querySelectorAll(".story-step").forEach((item) => {
    item.classList.toggle("is-active", item === step);
  });

  const targetPanel = step.dataset.panel;
  if (targetPanel) {
    story.querySelectorAll(".chart-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.id === targetPanel);
    });
  }

  if (step.dataset.metric) {
    const engagementHost = story.querySelector("#engagement-chart");
    if (engagementHost && typeof engagementHost._setMetric === "function") {
      engagementHost._setMetric(step.dataset.metric);
    }
  }
}

function initScrollyStories() {
  const stories = [...document.querySelectorAll(".scrolly-story")];
  if (!stories.length) {
    return;
  }

  stories.forEach((story) => {
    const firstStep = story.querySelector(".story-step");
    if (firstStep) {
      setActiveStoryStep(firstStep);
    }
  });

  if (!("IntersectionObserver" in window) || window.matchMedia("(max-width: 980px)").matches) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

      visibleEntries.forEach((entry) => {
        setActiveStoryStep(entry.target);
      });
    },
    {
      threshold: [0, 0.18, 0.36, 0.54, 0.72],
      rootMargin: "-38% 0px -38% 0px"
    }
  );

  document.querySelectorAll(".story-step").forEach((step) => observer.observe(step));
}

function initHeroDepth() {
  const hero = document.getElementById("hero");
  if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = hero.getBoundingClientRect();
    const progress = Math.min(Math.max((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0), 1);
    const shift = Math.round((progress - 0.34) * 34);
    hero.style.setProperty("--hero-shift", `${shift}px`);
  };

  const requestUpdate = () => {
    if (ticking) {
      return;
    }
    ticking = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

function initRealityMode() {
  const bridge = document.getElementById("reality-bridge");
  if (!bridge) {
    return;
  }

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = bridge.getBoundingClientRect();
    const shouldActivate = rect.top < window.innerHeight * 0.62;
    document.body.classList.toggle("is-reality", shouldActivate);
  };

  const requestUpdate = () => {
    if (ticking) {
      return;
    }
    ticking = true;
    window.requestAnimationFrame(update);
  };

  update();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}

document.addEventListener("DOMContentLoaded", () => {
  renderStoryCharts();
  initFrames();
  initReveal();
  initScrollyStories();
  initHeroDepth();
  initRealityMode();
});
