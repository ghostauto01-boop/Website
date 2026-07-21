/* ============================================================
   CREATEBYMOH — interactive engine
   Renders media from /assets/manifest.json (produced by the
   Drive sync at build time), wires the TikTok-style player,
   gallery lightbox, mobile nav, marquee and the brief forms.
   ============================================================ */
(function () {
  "use strict";
  const D = window.CBM;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------------- mobile nav ---------------- */
  const burger = $(".nav-burger");
  if (burger) {
    burger.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".mobile-menu a").forEach((a) =>
      a.addEventListener("click", () => document.body.classList.remove("menu-open")));
  }

  /* ---------------- reveal on scroll ---------------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("on")),
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------------- marquee ---------------- */
  const mq = $("[data-marquee]");
  if (mq) {
    const seq = '<span class="mq-item">Innovate <b>✦</b> Inspire <b>✦</b> Create <b>✦</b></span>';
    const chunk = seq.repeat(4);
    mq.innerHTML = '<div class="marquee-track">' + chunk + chunk + "</div>";
  }

  /* ---------------- stats ---------------- */
  const statsEl = $("[data-stats]");
  if (statsEl) {
    statsEl.innerHTML = D.brand.stats
      .map((s) => `<div class="stat reveal"><b>${s.n}</b><span>${s.label}</span></div>`)
      .join("");
    $$(".reveal", statsEl).forEach((el) => io.observe(el));
  }

  /* ---------------- manifest + card helpers ---------------- */
  const state = { manifest: null };

  function enrichNiche(slug, vids) {
    const cfg = D.niches[slug];
    const used = new Set();
    return vids.map((v) => {
      const n = norm(v.original);
      let meta = cfg.keywordTitles.find((k) => n.includes(k.kw));
      if (meta && used.has(meta.title)) meta = null;
      if (!meta) {
        for (const p of cfg.pool) if (!used.has(p.title)) { meta = p; break; }
        if (!meta) for (const p of cfg.overflow) if (!used.has(p.title)) { meta = p; break; }
      }
      if (meta) used.add(meta.title);
      const m = meta || { title: `${cfg.chip} Campaign ${used.size + 1}`, tag: "Campaign Film", desc: "" };
      const dur = v.duration ? `${v.duration}s` : "";
      return Object.assign({}, v, {
        title: m.title, tag: m.tag, desc: m.desc,
        meta: `${cfg.chip} · ${m.tag}${dur ? " · " + dur : ""}`,
        niche: slug, chip: cfg.chip,
      });
    });
  }

  function cardHTML(v) {
    return `
    <article class="vcard reveal" data-src="${esc(v.src)}" data-title="${esc(v.title)}" data-meta="${esc(v.meta)}">
      <div class="vc-media">
        ${v.poster ? `<img src="${esc(v.poster)}" alt="${esc(v.title)} — ${esc(v.chip)} campaign still" loading="lazy">` : ""}
        <div class="vc-grad"></div>
        <span class="vc-chip">${esc(v.chip)}</span>
        <div class="vc-info">
          <h3>${esc(v.title)}</h3>
          <div class="vc-meta">${esc(v.tag)}${v.duration ? " · " + v.duration + "s" : ""}</div>
          ${v.desc ? `<p>${esc(v.desc)}</p>` : ""}
          <button class="vc-play" type="button" aria-label="Play ${esc(v.title)} campaign">
            <svg viewBox="0 0 12 14" fill="currentColor"><path d="M0 0l12 7-12 7z"/></svg>
            Play Campaign
          </button>
        </div>
      </div>
    </article>`;
  }

  function pickVideo(slug, pick) {
    const list = (state[slug] || []);
    if (!list.length) return null;
    if (pick.type === "keyword") {
      const hit = list.find((v) => norm(v.original).includes(pick.value));
      if (hit) return hit;
    }
    const i = Math.min(pick.value ?? 0, list.length - 1);
    return list[i] || null;
  }

  function renderHome() {
    const grid = $("#home-grid");
    if (!grid) return;
    const usedSrcs = new Set();
    const cards = [];
    D.homeShowcase.forEach((c) => {
      const v = pickVideo(c.niche, c.pick);
      if (!v || usedSrcs.has(v.src)) return;
      usedSrcs.add(v.src);
      cards.push(cardHTML(Object.assign({}, v, { title: c.title, meta: c.meta, desc: c.desc })));
    });
    grid.innerHTML = cards.length
      ? cards.join("")
      : `<div class="media-error">Campaign media is being prepared — it appears automatically once the site is built on Netlify.</div>`;

    /* hero phone showcase = first curated video */
    const pv = pickVideo("perfume", { type: "index", value: 0 });
    const screen = $("#hero-phone-screen");
    if (screen && pv) {
      screen.innerHTML = `
        <video src="${esc(pv.src)}" poster="${esc(pv.poster || "")}" muted loop playsinline
               autoplay preload="metadata" aria-label="CREATEBYMOH perfume campaign loop"></video>
        ${tiktokOverlay()}`;
    }
    bindCards(grid);
    $$(".reveal", grid).forEach((el) => io.observe(el));
  }

  function renderNiche(slug) {
    const grid = $("#video-grid");
    const cfg = D.niches[slug];
    if (grid) {
      const list = state[slug] || [];
      grid.innerHTML = list.length
        ? list.map(cardHTML).join("")
        : `<div class="media-error">Campaign videos are being prepared — they appear automatically once the site is built on Netlify.</div>`;
      bindCards(grid);
      $$(".reveal", grid).forEach((el) => io.observe(el));
    }
    const gal = $("#gallery-grid");
    if (gal) {
      const imgs = (state.manifest && state.manifest[slug] && state.manifest[slug].images) || [];
      gal.innerHTML = imgs.length
        ? imgs.map((im, i) => `
            <figure class="shot reveal" data-full="${esc(im.src)}" tabindex="0" role="button"
                    aria-label="Open ${esc(cfg.galleryLabel)} ${i + 1} full size">
              <img src="${esc(im.src)}" alt="${esc(cfg.galleryLabel)} art direction frame ${i + 1}" loading="lazy">
              <figcaption>${esc(cfg.galleryLabel)} · ${String(i + 1).padStart(2, "0")}</figcaption>
            </figure>`).join("")
        : `<div class="media-error">Art direction frames are being prepared — they appear automatically once the site is built on Netlify.</div>`;
      bindGallery(gal);
      $$(".reveal", gal).forEach((el) => io.observe(el));
    }
  }

  /* ---------------- tiktok-style overlay ---------------- */
  function tiktokOverlay() {
    return `
    <div class="tiktok-overlay">
      <div class="tt-top">9:41</div>
      <div class="tt-rail">
        <div><span>❤️</span>${D.brand.likes}</div>
        <div><span>💬</span>${D.brand.comments}</div>
        <div><span>🔗</span>${D.brand.shares}</div>
        <div><span>💿</span></div>
      </div>
      <div class="tt-caption">
        <strong>${D.brand.handle}</strong>
        <p>${D.brand.taglineVoice}</p>
        <div class="tt-audio">🎵 ${D.brand.audioLine}</div>
      </div>
    </div>`;
  }

  /* ---------------- modal player ---------------- */
  const modal = $("#campaign-modal");
  function openModal(src, title) {
    if (!modal) return;
    const screen = $(".phone-screen", modal);
    screen.innerHTML = `
      <video src="${esc(src)}" muted loop playsinline autoplay controls preload="metadata"
             aria-label="${esc(title)} campaign video"></video>
      ${tiktokOverlay()}`;
    modal.classList.add("open");
    document.body.classList.add("modal-open");
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    document.body.classList.remove("modal-open");
    const v = $("video", modal);
    if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
  }
  function bindCards(root) {
    $$(".vcard", root).forEach((card) => {
      $(".vc-play", card).addEventListener("click", () =>
        openModal(card.dataset.src, card.dataset.title));
    });
  }
  if (modal) {
    $(".modal-backdrop", modal).addEventListener("click", closeModal);
    $(".modal-close", modal).addEventListener("click", closeModal);
    document.addEventListener("keydown", (e) => e.key === "Escape" && closeModal());
  }

  /* ---------------- gallery lightbox ---------------- */
  const lb = $("#lightbox");
  function bindGallery(root) {
    $$(".shot", root).forEach((f) => {
      const open = () => {
        if (!lb) return;
        $("img", lb).src = f.dataset.full;
        lb.classList.add("open");
        document.body.classList.add("modal-open");
      };
      f.addEventListener("click", open);
      f.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && open());
    });
  }
  if (lb) lb.addEventListener("click", () => {
    lb.classList.remove("open");
    document.body.classList.remove("modal-open");
  });

  /* ---------------- brief form ---------------- */
  $$("form[data-brief]").forEach((form) => {
    const nicheSel = $('[name="niche"]', form);
    const specifyWrap = $("[data-specify-wrap]", form);
    const toggleSpecify = () => {
      const other = nicheSel.value.toLowerCase().includes("other");
      specifyWrap.style.display = other ? "" : "none";
      $('[name="specify"]', form).required = other;
    };
    nicheSel.addEventListener("change", toggleSpecify);
    toggleSpecify();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const g = (n) => ($(`[name="${n}"]`, form) || {}).value || "";
      const lines = [
        `Brand: ${g("brand")}`,
        `Email: ${g("email")}`,
        `Industry Niche: ${g("niche") === "Other (Specify below)" ? "Other: " + g("specify") : g("niche")}`,
        `Targeted Ad Style: ${g("adstyle")}`,
        `Creative Format: ${g("format")}`,
        `${form.dataset.productLabel || "Product / Line"}: ${g("product")}`,
        `${form.dataset.descLabel || "Description"}: ${g("desc")}`,
        "",
        "Photos/reference files will be attached to this email.",
      ];
      const subject = `Free 10-15s Ad Mockup Brief — ${g("brand")}`;
      window.location.href =
        `mailto:${D.brand.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n"))}`;
      const ok = $(`#brief-success`);
      if (ok) {
        form.hidden = true;
        ok.classList.add("show");
        ok.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  });

  /* ---------------- shared select filler ---------------- */
  window.CBM_FILL_SELECTS = function () {
    const fill = (sel, opts, pre) => {
      $$(sel).forEach((s) => {
        s.innerHTML = opts
          .map((o) => `<option value="${esc(o)}"${o === pre ? " selected" : ""}>${esc(o)}</option>`)
          .join("");
      });
    };
    fill('select[name="niche"]', D.nicheOptions, document.body.dataset.nichePreset);
    fill('select[name="adstyle"]', D.adStyleOptions);
    fill('select[name="format"]', D.creativeFormatOptions);
    $$("form[data-brief]").forEach((f) => {
      const ev = new Event("change");
      const sel = $('select[name="niche"]', f);
      if (sel) sel.dispatchEvent(ev);
    });
  };

  /* ---------------- boot: fetch manifest ---------------- */
  const page = document.body.dataset.page;
  fetch(D.manifestUrl, { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("manifest " + r.status))))
    .then((m) => {
      state.manifest = m;
      Object.keys(D.niches).forEach((slug) => {
        state[slug] = enrichNiche(slug, (m[slug] && m[slug].videos) || []);
      });
    })
    .catch(() => { state.manifest = null; })
    .finally(() => {
      if (page === "home") renderHome();
      else if (D.niches[page]) renderNiche(page);
    });
})();
