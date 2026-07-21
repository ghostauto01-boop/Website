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
        <video class="loopview" src="${esc(v.src)}" poster="${esc(v.poster || "")}" muted loop playsinline preload="metadata" aria-label="${esc(v.title)} preview loop"></video>
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

  const IMG = (slug, i) => {
    const imgs = (state.manifest && state.manifest[slug] && state.manifest[slug].images) || [];
    return imgs.length ? imgs[i % imgs.length] : null;
  };
  const VID = (slug, i) => { const l = state[slug] || []; return l.length ? l[Math.min(i, l.length - 1)] : null; };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const phoneIO = new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting && !reduced) v.play().catch(() => {});
    else v.pause();
  }), { threshold: 0.25 });

  function watchLoops(root) { $$("video.loopview", root).forEach((v) => phoneIO.observe(v)); }

  function loopingPhone(v, title) {
    return `
      <div class="ph" data-src="${esc(v.src)}" data-title="${esc(title || v.title)}" tabindex="0" role="button" aria-label="Play ${esc(title || v.title)}">
        <video class="loopview" src="${esc(v.src)}" poster="${esc(v.poster || "")}" muted loop playsinline preload="metadata"></video>
        <div class="ph-tag"><span>${esc(title || v.title)}</span><i>${esc(v.chip || "")}</i></div>
      </div>`;
  }
  function bindPhones(root) {
    $$(".ph", root).forEach((ph) => {
      const open = () => openModal(ph.dataset.src, ph.dataset.title);
      ph.addEventListener("click", open);
      ph.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && open());
    });
    watchLoops(root);
  }

  function renderHome() {
    const L = D.homeLayout;
    const hasMedia = !!state.manifest;

    /* hero collage */
    if (hasMedia) {
      const main = IMG("perfume", 1) || IMG("streetwear", 0) || IMG("jewelry", 0);
      const side = IMG("streetwear", 0) || IMG("jewelry", 2);
      const col = $("#hero-collage");
      if (col && main) col.innerHTML = `
        <div>
          <div class="collage-frame tall"><img src="${esc(main.src)}" alt="CREATEBYMOH campaign hero frame"></div>
          <div class="collage-cap">Campaign Still ✦ CreateByMoh</div>
        </div>
        <div>
          ${side ? `<div class="collage-frame short"><img src="${esc(side.src)}" alt="Campaign detail frame"></div>` : ""}
          <div class="collage-frame short ghost" style="margin-top:12px">Sensory worlds<br>in motion ✦</div>
        </div>`;
    }

    /* rates & services */
    const rates = $("#rates-grid");
    if (rates) rates.innerHTML = L.rates.map((r) => `
      <div class="rate-card reveal">
        <h3>${esc(r.title)}</h3><p>${esc(r.desc)}</p>
        <ul>${r.list.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
        <div class="rc-cta">${esc(r.cta)} ➔</div>
      </div>`).join("");

    /* how it works */
    const how = $("#how-grid");
    if (how) how.innerHTML = L.howSteps.map((s) => `
      <div class="how-step reveal">
        <span class="hs-num">${esc(s.n)}</span>
        <h3>${esc(s.t)}</h3><p>${esc(s.d)}</p>
      </div>`).join("");

    /* who we are image */
    const whoImg = IMG("streetwear", 1) || IMG("perfume", 3) || IMG("jewelry", 1);
    const whoEl = $("#who-img");
    if (whoEl) {
      if (whoImg) whoEl.innerHTML = `<img src="${esc(whoImg.src)}" alt="CREATEBYMOH art direction — studio frame">`;
      else whoEl.style.display = "none";
    }

    /* analytics board image */
    const anaImg = IMG("jewelry", 3) || IMG("perfume", 5) || IMG("streetwear", 2);
    const anaEl = $("#ana-img");
    if (anaEl) {
      if (anaImg) anaEl.innerHTML = `<img src="${esc(anaImg.src)}" alt="Campaign metrics board frame">`;
      else anaEl.style.display = "none";
    }

    /* case study board */
    const cs = $("#case-stats");
    if (cs) cs.innerHTML = L.caseStudy.stats.map((s) => `<span>${esc(s)}</span>`).join("");
    const caseVid = VID("perfume", 2) || VID("jewelry", 0) || VID("streetwear", 0);
    const cp = $("#case-phone");
    if (cp && caseVid) {
      cp.innerHTML = `<video class="loopview" src="${esc(caseVid.src)}" poster="${esc(caseVid.poster || "")}" muted loop playsinline preload="metadata" aria-label="Case study campaign loop"></video>`;
      watchLoops(cp);
    }

    /* niche pills */
    const nl = $("#niche-left");
    if (nl) nl.innerHTML = L.nicheBoard.leftPills.map((p) => `<span class="pill-x">${esc(p)}</span>`).join("");
    const nr = $("#niche-right");
    if (nr) {
      const links = ["perfume", "streetwear", "jewelry"];
      nr.innerHTML = L.nicheBoard.rightPills.map((p, i) =>
        links[i]
          ? `<a href="${D.niches[links[i]].page}">${esc(p)}</a>`
          : `<a href="#brief">${esc(p)}</a>`).join("");
    }

    /* recent videography phones */
    const strip = $("#phone-strip");
    if (strip) {
      const picks = [
        ["perfume", 0], ["streetwear_kw", 0], ["jewelry", 0], ["streetwear", 3],
      ];
      const phones = [];
      picks.forEach((p) => {
        let v;
        if (p[0].endsWith("_kw")) v = pickVideo(p[0].slice(0, -3), { type: "keyword", value: "shirt_swap" });
        else v = VID(p[0], p[1]);
        if (v && !phones.some((x) => x.src === v.src)) phones.push(v);
      });
      strip.innerHTML = phones.length
        ? phones.map((v) => loopingPhone(v)).join("")
        : `<div class="media-error">Campaign videos appear here after the first Netlify build pulls your Drive content.</div>`;
      bindPhones(strip);
    }

    /* photography snapshot — mixed interleave */
    const snap = $("#snap-grid");
    if (snap) {
      const order = ["perfume", "streetwear", "jewelry"];
      const imgs = order.map((s) => ((state.manifest && state.manifest[s] && state.manifest[s].images) || []));
      const out = [];
      for (let i = 0; out.length < 12; i++) {
        let added = 0;
        order.forEach((s, k) => { if (imgs[k] && imgs[k][i]) { out.push({ slug: s, im: imgs[k][i], n: i }); added++; } });
        if (!added) break;
      }
      snap.innerHTML = out.length
        ? out.map((o) => `
          <figure class="shot snap" data-full="${esc(o.im.src)}" tabindex="0" role="button" aria-label="Open ${o.slug} photography snapshot full size">
            <img src="${esc(o.im.src)}" alt="${o.slug} photography snapshot ${o.n + 1}" loading="lazy">
          </figure>`).join("")
        : `<div class="media-error">Photography snapshots appear here after the first Netlify build pulls your Drive content.</div>`;
      bindGallery(snap);
    }

    /* analytics pills */
    const mp = $("#metric-pills");
    if (mp) mp.innerHTML = D.brand.stats.map((s) => `<span class="mp"><b>${esc(s.label)}</b>${esc(s.n)}</span>`).join("");

    /* testimonials */
    const tg = $("#testi-grid");
    if (tg) tg.innerHTML = D.testimonials.map((t) => {
      const im = hasMedia ? IMG(t.img.niche, t.img.index) : null;
      return `
      <div class="testi-card reveal">
        ${im ? `<div class="tc-img"><img src="${esc(im.src)}" alt="${esc(t.name)} campaign frame" loading="lazy"></div>` : ""}
        <span class="tc-name">${esc(t.name)}</span>
        <p>${esc(t.quote)}</p>
      </div>`;
    }).join("");

    $$(".reveal", $("#page-root") || document).forEach((el) => io.observe(el));
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
      watchLoops(grid);
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
