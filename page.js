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

  const items = [...data.boundaryCoverageStats].sort((left, right) => right.percent - left.percent);
  const maxPercent = Math.max(...items.map((item) => item.percent));
  const domainMax = Math.max(60, Math.ceil(maxPercent / 10) * 10);

  const explanations = {
    "是否提到功能损害": "明确提到对学业、工作、关系、生活造成实际损害",
    "是否提到早发性": "提到相关问题通常从小存在、不是成年后突然出现",
    "是否提到持续性": "提到问题长期、持续存在，而非偶发",
    "是否提到跨情境性": "提到问题在学习、工作、家庭、人际等多个场景都存在"
  };

  const labelMap = {
    "是否提到功能损害": "提到功能损害",
    "是否提到早发性": "提到早发性",
    "是否提到持续性": "提到持续性",
    "是否提到跨情境性": "提到跨情境性",
    "是否建议寻求专业评估/医院就诊": "建议专业评估 / 医院就诊",
    "是否提醒不要互联网诊断": "提醒不要互联网诊断"
  };

  const chart = document.createElement("div");
  chart.className = "boundary-coverage-chart";

  const scale = document.createElement("div");
  scale.className = "boundary-scale";

  const tickStep = domainMax <= 60 ? 20 : 25;
  for (let tick = 0; tick <= domainMax; tick += tickStep) {
    const label = document.createElement("span");
    label.textContent = `${tick}%`;
    scale.appendChild(label);
  }

  const rows = document.createElement("div");
  rows.className = "boundary-rows";

  items.forEach((item, index) => {
    const row = document.createElement("article");
    row.className = "boundary-row";
    if (index === 0) {
      row.classList.add("is-leading");
    }

    const head = document.createElement("div");
    head.className = "boundary-row-head";

    const label = document.createElement("div");
    label.className = "boundary-row-label";
    label.textContent = labelMap[item.label] || item.label;

    const meta = document.createElement("div");
    meta.className = "boundary-row-meta";
    meta.textContent = `${item.count} 条 · ${formatPercent(item.percent)}`;

    appendChildren(head, [label, meta]);

    const track = document.createElement("div");
    track.className = "boundary-row-track";

    const fill = document.createElement("div");
    fill.className = "boundary-row-fill";
    fill.style.width = `${Math.max((item.percent / domainMax) * 100, 4)}%`;

    track.appendChild(fill);
    appendChildren(row, [head, track]);
    rows.appendChild(row);
  });

  const notes = document.createElement("div");
  notes.className = "boundary-notes";

  items
    .filter((item) => explanations[item.label])
    .forEach((item) => {
    const note = document.createElement("div");
    note.className = "boundary-note";
    note.innerHTML = `<strong>${labelMap[item.label] || item.label}</strong><span>${explanations[item.label] || ""}</span>`;
    notes.appendChild(note);
    });

  appendChildren(chart, [scale, rows, notes]);
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
  const quadrantOrder = [
    ["低共鸣", "高边界"],
    ["高共鸣", "高边界"],
    ["低共鸣", "低边界"],
    ["高共鸣", "低边界"]
  ];
  const positionMap = {
    "低共鸣-高边界": {
      labelClass: "is-top-left",
      bubbleClass: "is-top-left",
      left: 27,
      top: 29
    },
    "高共鸣-高边界": {
      labelClass: "is-top-right",
      bubbleClass: "is-top-right",
      left: 73,
      top: 29
    },
    "低共鸣-低边界": {
      labelClass: "is-bottom-left",
      bubbleClass: "is-bottom-left",
      left: 27,
      top: 69
    },
    "高共鸣-低边界": {
      labelClass: "is-bottom-right",
      bubbleClass: "is-bottom-right",
      left: 73,
      top: 69
    }
  };
  const maxCount = Math.max(...data.matrixStats.map((item) => item.count));
  const scaleBubble = (count) => 70 + Math.sqrt(count / maxCount) * 78;

  const wrapper = document.createElement("div");
  wrapper.className = "matrix-chart";

  const shell = document.createElement("div");
  shell.className = "matrix-shell";

  const topRow = document.createElement("div");
  topRow.className = "matrix-top-row";

  const topSpacer = document.createElement("div");
  topSpacer.className = "matrix-top-spacer";

  const topAxis = document.createElement("div");
  topAxis.className = "matrix-axis matrix-axis--top";
  topAxis.innerHTML = "<span>低共鸣</span><span>高共鸣</span>";

  appendChildren(topRow, [topSpacer, topAxis]);

  const frame = document.createElement("div");
  frame.className = "matrix-frame";

  const sideAxis = document.createElement("div");
  sideAxis.className = "matrix-axis matrix-axis--left";
  sideAxis.innerHTML = "<span>高边界</span><span>低边界</span>";

  const plot = document.createElement("div");
  plot.className = "matrix-plot";

  const panes = document.createElement("div");
  panes.className = "matrix-panes";
  [
    "is-top-left",
    "is-top-right",
    "is-bottom-left",
    "is-bottom-right"
  ].forEach((className) => {
    const pane = document.createElement("span");
    pane.className = `matrix-pane ${className}`;
    panes.appendChild(pane);
  });

  plot.appendChild(panes);

  quadrantOrder.forEach(([resonance, boundary], quadrantIndex) => {
    const key = `${resonance}-${boundary}`;
    const item = lookup[key];
    if (!item) {
      return;
    }

    const config = positionMap[key];
    const node = document.createElement("div");
    node.className = `matrix-node ${config.labelClass}`;
    if (key === "高共鸣-低边界") {
      node.classList.add("is-emphasis");
    }
    node.style.left = `${config.left}%`;
    node.style.top = `${config.top}%`;
    node.style.setProperty("--matrix-float-duration", `${(6.6 + quadrantIndex * 0.7).toFixed(1)}s`);
    node.style.setProperty("--matrix-float-delay", `${(0.42 + quadrantIndex * 0.12).toFixed(2)}s`);

    const size = scaleBubble(item.count);
    node.style.setProperty("--bubble-size", `${size.toFixed(1)}px`);

    const bubble = document.createElement("div");
    bubble.className = `matrix-bubble ${config.bubbleClass}`;
    if (key === "高共鸣-低边界") {
      bubble.classList.add("is-emphasis");
    }
    bubble.style.setProperty("--orbit-duration", `${(9.4 + quadrantIndex * 1.15).toFixed(1)}s`);
    bubble.style.setProperty("--orbit-delay", `${(-1.4 * quadrantIndex).toFixed(2)}s`);
    bubble.style.setProperty("--orbit-start", `${48 + quadrantIndex * 74}deg`);
    bubble.style.setProperty("--orbit-size", key === "高共鸣-低边界" ? "10px" : "8px");

    const count = document.createElement("strong");
    count.className = "matrix-bubble-count";
    count.textContent = `${item.count} 条`;

    const meta = document.createElement("span");
    meta.className = "matrix-bubble-meta";
    meta.textContent = formatPercent(item.percent);

    appendChildren(bubble, [count, meta]);
    node.appendChild(bubble);
    plot.appendChild(node);
  });

  appendChildren(frame, [sideAxis, plot]);

  const caption = document.createElement("p");
  caption.className = "matrix-caption";
  caption.textContent = "每个象限用一个气泡表示，气泡大小代表该象限样本量；横向比较代入强度，纵向比较是否给出边界提醒。";

  appendChildren(shell, [topRow, frame]);
  appendChildren(wrapper, [shell, caption]);
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

function getFrameBaseMinHeight(frame) {
  const src = frame.getAttribute("src") || "";
  if (src.includes("fenshu.html")) {
    return 360;
  }
  if (src.includes("liuchengtu.html")) {
    return 640;
  }
  if (src.includes("leixing.html")) {
    return 640;
  }
  return 320;
}

function getFrameContentRoot(doc) {
  if (!doc || !doc.body) {
    return null;
  }

  return [...doc.body.children].find((node) => node.tagName !== "SCRIPT") || null;
}

function measureElementHeight(element, win) {
  if (!element) {
    return 0;
  }

  const styles = win.getComputedStyle(element);
  const marginTop = parseFloat(styles.marginTop) || 0;
  const marginBottom = parseFloat(styles.marginBottom) || 0;
  const rectHeight = element.getBoundingClientRect().height || 0;
  return Math.ceil(Math.max(element.scrollHeight || 0, element.offsetHeight || 0, rectHeight) + marginTop + marginBottom);
}

function getFrameDesiredHeight(frame, doc) {
  const root = getFrameContentRoot(doc);
  const rootHeight = measureElementHeight(root, doc.defaultView || window);
  return Math.max(rootHeight, getFrameBaseMinHeight(frame));
}

function setFrameHeight(frame, height) {
  frame.style.height = `${Math.max(height, getFrameBaseMinHeight(frame)) + 28}px`;
}

function observeFrame(frame) {
  try {
    const doc = frame.contentDocument || frame.contentWindow.document;
    const resize = () => {
      setFrameHeight(frame, getFrameDesiredHeight(frame, doc));
    };

    resize();

    if ("ResizeObserver" in window && doc.body) {
      const observer = new ResizeObserver(() => resize());
      observer.observe(doc.body);
      if (doc.documentElement) {
        observer.observe(doc.documentElement);
      }
      frame._observer = observer;
    }

    if ("MutationObserver" in window && doc.body) {
      const mutationObserver = new MutationObserver(() => resize());
      mutationObserver.observe(doc.body, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      });
      frame._mutationObserver = mutationObserver;
    }

    if (doc.fonts && doc.fonts.ready) {
      doc.fonts.ready.then(resize).catch(() => {});
    }

    window.setTimeout(resize, 120);
    window.setTimeout(resize, 420);
    window.setTimeout(resize, 920);

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

function initFrameMessages() {
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.type !== "iframe-height" || typeof data.height !== "number") {
      return;
    }

    const target = [...document.querySelectorAll("iframe.auto-iframe")].find((frame) => {
      const src = frame.getAttribute("src") || "";
      return frame.contentWindow === event.source || (data.source && src.includes(data.source));
    });

    if (!target) {
      return;
    }

    setFrameHeight(target, data.height);
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
    story._steps = [...story.querySelectorAll(".story-step:not(.story-step--spacer)")];
    const firstStep = story._steps[0];
    if (firstStep) {
      setActiveStoryStep(firstStep);
    }
  });

  if (window.matchMedia("(max-width: 980px)").matches) {
    return;
  }

  let ticking = false;

  const update = () => {
    ticking = false;
    const viewportCenter = window.innerHeight * 0.5;

    stories.forEach((story) => {
      const storyRect = story.getBoundingClientRect();
      if (storyRect.bottom < window.innerHeight * 0.08 || storyRect.top > window.innerHeight * 0.92) {
        return;
      }

      let activeStep = story._steps[0];
      let minDistance = Number.POSITIVE_INFINITY;

      story._steps.forEach((step) => {
        const rect = step.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = Math.abs(center - viewportCenter);
        if (distance < minDistance) {
          minDistance = distance;
          activeStep = step;
        }
      });

      if (activeStep) {
        setActiveStoryStep(activeStep);
      }
    });
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

function splitHeroTitle() {
  const title = document.querySelector("#hero .hero-title");
  if (!title) {
    return [];
  }

  if (title.dataset.split === "true") {
    return [...title.querySelectorAll(".hero-title__char")];
  }

  const chars = [];
  title.querySelectorAll(".hero-title__line").forEach((line) => {
    const text = line.textContent || "";
    line.setAttribute("aria-hidden", "true");
    line.textContent = "";

    [...text].forEach((char) => {
      const span = document.createElement("span");
      span.className = "hero-title__char";
      if (char === " ") {
        span.classList.add("is-space");
        span.innerHTML = "&nbsp;";
      } else {
        span.textContent = char;
      }
      line.appendChild(span);
      chars.push(span);
    });
  });

  title.dataset.split = "true";
  return chars;
}

function initHeroMotion() {
  const hero = document.getElementById("hero");
  if (!hero) {
    return;
  }

  const titleLines = [...hero.querySelectorAll(".hero-title__line")];
  const paper = hero.querySelector(".hero-paper");
  const paperFrame = hero.querySelector(".hero-paper__frame");
  const ornaments = [...hero.querySelectorAll(".hero-paper__oval, .hero-paper__underline")];
  const subtitle = hero.querySelector(".hero-subtitle");
  const introParagraphs = [...hero.querySelectorAll(".hero-intro p")];
  const figure = hero.querySelector(".hero-figure__image");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof window.gsap !== "undefined";

  if (!hasGsap || prefersReducedMotion || !paper || !figure || !subtitle || !titleLines.length || !introParagraphs.length) {
    hero.classList.add("is-static");
    return;
  }

  const gsap = window.gsap;
  const titleChars = splitHeroTitle();
  const titleTargets = titleChars.length ? titleChars : titleLines;
  if (window.ScrollTrigger && typeof gsap.registerPlugin === "function") {
    gsap.registerPlugin(window.ScrollTrigger);
  }

  gsap.set(paper, { opacity: 0.9, y: 22, rotate: -1.4, scale: 0.986 });
  gsap.set(titleLines, { opacity: 1 });
  gsap.set(titleTargets, { opacity: 0, y: 18, rotate: 1.2, transformOrigin: "50% 100%" });
  gsap.set(subtitle, { opacity: 0, y: 14 });
  gsap.set(introParagraphs, { opacity: 0, y: 18 });
  gsap.set(figure, { opacity: 0.58, x: 28, scale: 1.04, filter: "blur(4px)" });
  gsap.set(ornaments, { opacity: 0, scale: 0.92, transformOrigin: "50% 50%" });

  if (paperFrame) {
    gsap.set(paperFrame, { opacity: 0.02 });
  }

  const timeline = gsap.timeline({
    defaults: {
      ease: "power2.out"
    }
  });

  timeline
    .to(figure, { opacity: 0.94, x: 0, scale: 1, filter: "blur(0px)", duration: 1.06 }, 0.02)
    .to(paper, { opacity: 1, y: 0, rotate: 0, scale: 1, duration: 0.86 }, 0.12);

  if (paperFrame) {
    timeline.to(paperFrame, { opacity: 0.1, duration: 0.7 }, 0.3);
  }

  timeline
    .to(titleTargets, { opacity: 1, y: 0, rotate: 0, duration: 0.46, stagger: 0.035, ease: "power3.out" }, 0.34)
    .to(subtitle, { opacity: 1, y: 0, duration: 0.56 }, 0.82)
    .to(ornaments, {
      opacity: (index) => (index === 0 ? 0.12 : 0.24),
      scale: 1,
      duration: 0.7,
      stagger: 0.1
    }, 0.9)
    .to(introParagraphs, { opacity: 1, y: 0, duration: 0.62, stagger: 0.12 }, 0.98)
    .to(ornaments, {
      opacity: (index) => (index === 0 ? 0.12 : 0.24),
      duration: 0.01
    }, 1.02);

  gsap.to(paper, { y: -5, rotate: -0.35, duration: 5.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.to(figure, { y: -10, x: -4, duration: 7.8, repeat: -1, yoyo: true, ease: "sine.inOut" });

  if (!window.ScrollTrigger) {
    return;
  }

  const scrollSettings = {
    trigger: hero,
    start: "top top",
    end: "bottom top",
    scrub: 0.8
  };

  gsap.to(hero.querySelector(".hero-stage"), {
    yPercent: -4,
    ease: "none",
    scrollTrigger: scrollSettings
  });

  gsap.to(paper, {
    yPercent: -5,
    rotate: -0.8,
    ease: "none",
    scrollTrigger: { ...scrollSettings }
  });

  gsap.to(figure, {
    yPercent: -10,
    opacity: 0.84,
    scale: 1.03,
    ease: "none",
    scrollTrigger: { ...scrollSettings }
  });
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

function restoreHashTarget() {
  const hash = window.location.hash;
  if (!hash) {
    return;
  }

  let target = null;
  try {
    target = document.querySelector(hash);
  } catch (error) {
    return;
  }

  if (!target) {
    return;
  }

  const scrollToTarget = () => {
    target.scrollIntoView({ block: "start", behavior: "auto" });
  };

  window.setTimeout(scrollToTarget, 300);
  window.setTimeout(scrollToTarget, 1200);
  window.setTimeout(scrollToTarget, 2600);
}

const scaleQuestionsA = [
  "1. 当必须进行一件枯燥或困难的计划时，你会多常粗心犯错？",
  "2. 当正在做枯燥或重复性的工作时，你多常有持续专注的困难？",
  "3. 即使有人直接对你说话，你会多常有困难专注于别人跟你讲话的内容？",
  "4. 一旦完成任何计划中最具挑战的部分之后，你多常有完成计划最后细节的困难？",
  "5. 当必须从事需要有组织规划性的任务时，你会多常有困难井然有序地去做？",
  "6. 当有一件需要多费心思考的工作时，你会多常逃避或是延后开始去做？",
  "7. 在家里或是在工作时，你会多常没有把东西放对地方或是找不到东西？",
  "8. 你会多常因身旁的活动或声音而分心？",
  "9. 你会多常有问题去记得约会或是必须要做的事？"
];

const scaleQuestionsB = [
  "10. 当你必须长时间坐着时，你会多常坐不安稳或扭动手脚？",
  "11. 你会多常在开会时或在其他被期待坐好的场合中离开座位？",
  "12. 你会多常觉得静不下来或烦躁不安？",
  "13. 当有自己独处的时间时，你会多常觉得有困难使自己平静和放松？",
  "14. 你会多常像被马达所驱动一样，觉得自己过度地活跃，不得不做事情？",
  "15. 在社交场合中，你会多常发现自己话讲得太多？",
  "16. 当与他人交谈时，你会多常在别人还没把话讲完前就插嘴或接话替对方把话讲完？",
  "17. 在需要轮流排队的场合时，你会多常有困难轮流等待？",
  "18. 你会多常在别人忙碌时打断别人？"
];

const scaleOptions = [
  { label: "从不", value: 0 },
  { label: "很少", value: 1 },
  { label: "有时", value: 2 },
  { label: "常常", value: 3 },
  { label: "非常频繁", value: 4 }
];

function renderScaleQuestions(container, questions, prefix) {
  if (!container) {
    return;
  }

  const fragment = document.createDocumentFragment();

  questions.forEach((question, index) => {
    const name = `${prefix}${index + 1}`;
    const block = document.createElement("div");
    block.className = "scale-question";

    const title = document.createElement("div");
    title.className = "scale-question-title";
    title.textContent = question;

    const options = document.createElement("div");
    options.className = "scale-options";

    scaleOptions.forEach((option) => {
      const label = document.createElement("label");
      label.className = "scale-option";

      const input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.value = String(option.value);

      const text = document.createElement("span");
      text.textContent = option.label;

      appendChildren(label, [input, text]);
      options.appendChild(label);
    });

    appendChildren(block, [title, options]);
    fragment.appendChild(block);
  });

  container.innerHTML = "";
  container.appendChild(fragment);
}

function scrollToScaleContent(target) {
  if (!target) {
    return;
  }

  const top = target.getBoundingClientRect().top + window.scrollY - 28;
  window.scrollTo({
    top: Math.max(top, 0),
    behavior: "smooth"
  });
}

function getScaleLevel(score) {
  if (score <= 16) {
    return "不太可能";
  }
  if (score <= 23) {
    return "很可能";
  }
  return "非常可能";
}

function initScaleModule() {
  const form = document.getElementById("scaleForm");
  const startButton = document.getElementById("scaleStartBtn");
  const submitButton = document.getElementById("scaleSubmitBtn");
  const resultBox = document.getElementById("scaleResult");

  if (!form || !startButton || !submitButton || !resultBox) {
    return;
  }

  renderScaleQuestions(document.getElementById("scaleQuestionsA"), scaleQuestionsA, "A");
  renderScaleQuestions(document.getElementById("scaleQuestionsB"), scaleQuestionsB, "B");

  startButton.addEventListener("click", () => {
    startButton.style.display = "none";
    form.classList.remove("is-hidden");

    window.requestAnimationFrame(() => {
      form.classList.add("is-visible");
      const firstQuestion = form.querySelector(".scale-question");
      if (firstQuestion) {
        scrollToScaleContent(firstQuestion);
      }
    });
  });

  submitButton.addEventListener("click", () => {
    let aScore = 0;
    let bScore = 0;

    for (let index = 1; index <= 9; index += 1) {
      const input = document.querySelector(`input[name="A${index}"]:checked`);
      if (!input) {
        window.alert("请完成所有题目再提交！");
        return;
      }
      aScore += Number(input.value);
    }

    for (let index = 1; index <= 9; index += 1) {
      const input = document.querySelector(`input[name="B${index}"]:checked`);
      if (!input) {
        window.alert("请完成所有题目再提交！");
        return;
      }
      bScore += Number(input.value);
    }

    const total = aScore + bScore;
    const levelA = getScaleLevel(aScore);
    const levelB = getScaleLevel(bScore);
    const levelT = getScaleLevel(total);
    const levels = [levelA, levelB, levelT];

    let finalLevel = "不太可能";
    if (levels.includes("非常可能")) {
      finalLevel = "非常可能";
    } else if (levels.includes("很可能")) {
      finalLevel = "很可能";
    }

    let message = `<div><strong>您的评分结果：</strong><br>A 部分：${aScore} / 36 （${levelA}）<br>B 部分：${bScore} / 36 （${levelB}）<br>总分：${total} / 72 （${levelT}）</div><br>`;

    if (finalLevel === "不太可能") {
      message += "<div>综合来看，目前量表得分处于较低区间，ADHD 特征不明显。若在日常生活或工作中偶有注意力波动、组织困难等感受，可继续关注自身体验，尝试调整生活方式或行为策略；若长期感到困扰，也可根据需要与专业人士沟通交流。</div>";
    } else if (finalLevel === "很可能") {
      message += "<div>综合来看，量表得分处于中等区间，存在一定与 ADHD 特征相关的表现。您可以在日常中留意这些特征对生活、学习或工作带来的影响，并酌情考虑与专业人士沟通，获取更详细评估或建议；同时，通过合理的自我管理策略、环境调整等方式进行尝试，也有助于改善体验。</div>";
    } else {
      message += "<div>综合来看，量表得分处于较高区间，可能存在明显的 ADHD 特征。建议您考虑积极寻求专业评估与支持，与医生或心理专家沟通，以了解更全面的状况并获得个性化建议或干预方案。同时，也可尝试结合生活习惯、工作/学习环境调整等方式，帮助提升注意力和执行功能。</div>";
    }

    message += "<br><div style='font-style:italic;color:#6a7890;'>* 该量表仅供自我参考，不作最终诊断；若您或他人对结果有疑虑，请以专业评估为准。</div>";

    resultBox.innerHTML = message;
    resultBox.style.display = "block";
    scrollToScaleContent(resultBox);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderStoryCharts();
  initFrameMessages();
  initFrames();
  initReveal();
  initScrollyStories();
  initHeroMotion();
  initRealityMode();
  initScaleModule();
  restoreHashTarget();
});
