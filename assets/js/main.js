/* ============================================================
   CREATEBYMOH — interactive engine
   Renders media from /assets/manifest.json (produced by the
   Drive sync), wires the TikTok-style player (tap → full video
   with sound), gallery lightbox, mobile nav, marquee and the
   brief forms (prefilled Email + WhatsApp).

   Performance model:
     · <video> is rendered WITHOUT src (data-src only) so pages
       never download 20+ clips on load — posters paint instantly.
     · A lazy observer attaches src ~400px before the video enters
       the viewport; a play observer auto-plays muted loops while
       >=30% visible and pauses them offscreen / on hidden tabs.
     · Other pages are prefetched on idle so navigation is instant.
   ============================================================ */
(function () {
  "use strict";
  const D = window.CBM;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- mobile nav ---------------- */
  const burger = $(".nav-burger");
  const mobMenu = $(".mobile-menu");
  if (mobMenu) mobMenu.setAttribute("aria-hidden", "true");
  if (burger) {
    burger.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      if (mobMenu) mobMenu.setAttribute("aria-hidden", open ? "false" : "true");
    });
    $$(".mobile-menu a").forEach((a) =>
      a.addEventListener("click", () => document.body.classList.remove("menu-open")));
  }

  /* ---------------- reveal on scroll ---------------- */
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); }
    }),
    { threshold: 0.12 }
  );
  const watchReveal = (root) => $$(".reveal:not(.on)", root || document).forEach((el) => io.observe(el));
  window.CBM_REVEAL = watchReveal;
  watchReveal();

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
    watchReveal(statsEl);
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

  /* video markup: NO src — attached lazily when near viewport */
  function lazyVideo(v, cls, label) {
    return `<video class="${cls}" data-src="${esc(v.src)}" poster="${esc(v.poster || "")}" ` +
      `muted loop playsinline preload="none" disablepictureinpicture aria-label="${esc(label || v.title)}"></video>`;
  }

  function cardHTML(v) {
    return `
    <article class="vcard reveal">
      <div class="vc-media" data-src="${esc(v.src)}" data-title="${esc(v.title)}" data-audio="${v.audio ? "1" : ""}"
           tabindex="0" role="button" aria-label="Play ${esc(v.title)} with sound">
        ${lazyVideo(v, "loopview", v.title + " preview loop")}
        <div class="vc-grad"></div>
        <span class="vc-chip">${esc(v.chip)}</span>
        <div class="vc-info">
          <h3>${esc(v.title)}</h3>
          <div class="vc-meta">${esc(v.tag)}${v.duration ? " · " + v.duration + "s" : ""}</div>
          ${v.desc ? `<p>${esc(v.desc)}</p>` : ""}
          <span class="vc-play" aria-hidden="true">
            <svg viewBox="0 0 12 14" fill="currentColor"><path d="M0 0l12 7-12 7z"/></svg>
            Play with Sound
          </span>
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

  /* ---------------- lazy attach + autoplay-in-view system ---------------- */
  const mediaIO = ("IntersectionObserver" in window) ? new IntersectionObserver((es) => es.forEach((e) => {
    const v = e.target;
    if (e.isIntersecting) {
      // attach src once, a little before it becomes visible (rootMargin below)
      if (!v.src && v.dataset.src) v.src = v.dataset.src;
      if (!reduced) { const p = v.play(); if (p) p.catch(() => {}); }
    } else if (!v.paused) {
      v.pause();
    }
  }), { threshold: 0.3, rootMargin: "350px 0px 350px 0px" }) : null;

  function watchLoops(root) {
    $$("video.loopview", root || document).forEach((v) => {
      if (mediaIO) mediaIO.observe(v);
      else if (!v.src && v.dataset.src) { v.src = v.dataset.src; if (!reduced) v.play().catch(() => {}); }
    });
  }
  /* pause everything when the tab hides (battery + data savings) */
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) $$("video.loopview").forEach((v) => !v.paused && v.pause());
    else $$("video.loopview").forEach((v) => {
      // resume only loops currently on screen
      const r = v.getBoundingClientRect();
      if (v.src && !reduced && r.bottom > 0 && r.top < innerHeight && r.width) v.play().catch(() => {});
    });
  });

  function loopingPhone(v, title) {
    return `
      <div class="ph" data-src="${esc(v.src)}" data-title="${esc(title || v.title)}" data-audio="${v.audio ? "1" : ""}"
           tabindex="0" role="button" aria-label="Play ${esc(title || v.title)} with sound">
        ${lazyVideo(v, "loopview", title || v.title)}
        <div class="ph-tag"><span>${esc(title || v.title)}</span><i>${esc(v.chip || "")}</i></div>
      </div>`;
  }
  function bindPhones(root) {
    $$(".ph", root).forEach((ph) => {
      const open = () => openModal(ph.dataset.src, ph.dataset.title, !!ph.dataset.audio);
      ph.addEventListener("click", open);
      ph.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && open());
    });
    watchLoops(root);
  }

  /* ---------------- homepage boards ---------------- */
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
          <div class="collage-frame tall"><img src="${esc(main.src)}" alt="CREATEBYMOH campaign hero frame" fetchpriority="high" decoding="async"></div>
          <div class="collage-cap">Campaign Still ✦ CreateByMoh</div>
        </div>
        <div>
          ${side ? `<div class="collage-frame short"><img src="${esc(side.src)}" alt="Campaign detail frame" fetchpriority="high" decoding="async"></div>` : ""}
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
      if (whoImg) whoEl.innerHTML = `<img src="${esc(whoImg.src)}" alt="CREATEBYMOH art direction — studio frame" loading="lazy" decoding="async">`;
      else whoEl.style.display = "none";
    }

    /* analytics board image */
    const anaImg = IMG("jewelry", 3) || IMG("perfume", 5) || IMG("streetwear", 2);
    const anaEl = $("#ana-img");
    if (anaEl) {
      if (anaImg) anaEl.innerHTML = `<img src="${esc(anaImg.src)}" alt="Campaign metrics board frame" loading="lazy" decoding="async">`;
      else anaEl.style.display = "none";
    }

    /* case study board */
    const cs = $("#case-stats");
    if (cs) cs.innerHTML = L.caseStudy.stats.map((s) => `<span>${esc(s)}</span>`).join("");
    const caseVid = VID("perfume", 2) || VID("jewelry", 0) || VID("streetwear", 0);
    const cp = $("#case-phone");
    if (cp && caseVid) {
      cp.innerHTML = lazyVideo(caseVid, "loopview", "Case study campaign loop") +
        `<button class="ph-open" data-src="${esc(caseVid.src)}" data-title="Case Study Campaign" data-audio="${caseVid.audio ? "1" : ""}" aria-label="Play case study with sound"></button>`;
      watchLoops(cp);
      $(".ph-open", cp).addEventListener("click", function () {
        openModal(this.dataset.src, this.dataset.title, !!this.dataset.audio);
      });
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
        : `<div class="media-error">Campaign videos are being prepared — they appear automatically in a few minutes.</div>`;
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
            <img src="${esc(o.im.src)}" alt="${o.slug} photography snapshot ${o.n + 1}" loading="lazy" decoding="async">
          </figure>`).join("")
        : `<div class="media-error">Photography snapshots are being prepared — they appear automatically in a few minutes.</div>`;
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
        ${im ? `<div class="tc-img"><img src="${esc(im.src)}" alt="${esc(t.name)} campaign frame" loading="lazy" decoding="async"></div>` : ""}
        <span class="tc-name">${esc(t.name)}</span>
        <p>${esc(t.quote)}</p>
      </div>`;
    }).join("");

    watchReveal($("#page-root") || document);
  }

  /* ---------------- niche pages ---------------- */
  function renderNiche(slug) {
    const grid = $("#video-grid");
    const cfg = D.niches[slug];
    if (grid) {
      const list = state[slug] || [];
      grid.innerHTML = list.length
        ? list.map(cardHTML).join("")
        : `<div class="media-error">Campaign videos are being prepared — they appear automatically in a few minutes.</div>`;
      bindCards(grid);
      watchLoops(grid);
      watchReveal(grid);
    }
    const gal = $("#gallery-grid");
    if (gal) {
      const imgs = (state.manifest && state.manifest[slug] && state.manifest[slug].images) || [];
      gal.innerHTML = imgs.length
        ? imgs.map((im, i) => `
            <figure class="shot reveal" data-full="${esc(im.src)}" tabindex="0" role="button"
                    aria-label="Open ${esc(cfg.galleryLabel)} ${i + 1} full size">
              <img src="${esc(im.src)}" alt="${esc(cfg.galleryLabel)} art direction frame ${i + 1}" loading="lazy" decoding="async">
              <figcaption>${esc(cfg.galleryLabel)} · ${String(i + 1).padStart(2, "0")}</figcaption>
            </figure>`).join("")
        : `<div class="media-error">Art direction frames are being prepared — they appear automatically in a few minutes.</div>`;
      bindGallery(gal);
      watchReveal(gal);
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

  /* ---------------- modal player (tap → full video with sound) ---------------- */
  const modal = $("#campaign-modal");
  let modalVid = null, lastFocus = null;

  function openModal(src, title, hasAudio) {
    if (!modal || !src) return;
    lastFocus = document.activeElement;
    const screen = $(".phone-screen", modal);
    screen.innerHTML = `
      <video src="${esc(src)}" loop playsinline preload="auto"
             aria-label="${esc(title)} campaign video"></video>
      ${tiktokOverlay()}
      <button class="snd-toggle" type="button" aria-label="Toggle sound">🔊 Sound on</button>
      <button class="pp-toggle" type="button" aria-label="Pause video" hidden>
        <svg viewBox="0 0 12 14" fill="currentColor"><path d="M0 0h4v14H0zM8 0h4v14H8z"/></svg>
      </button>`;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    const vid = $("video", screen);
    const snd = $(".snd-toggle", screen);
    const pp = $(".pp-toggle", screen);
    modalVid = vid;

    const setSnd = () => {
      snd.textContent = vid.muted ? "🔇 Tap for sound" : "🔊 Sound on";
      snd.classList.toggle("muted", vid.muted);
    };
    const setPp = () => { pp.hidden = !vid.paused; };
    // no audio track on file → hide the sound button entirely
    if (!hasAudio) snd.style.display = "none";

    vid.muted = false;                 // tap = user gesture → sound allowed
    vid.volume = 1;
    const p = vid.play();
    if (p) p.catch(() => {            // strict autoplay policies → begin muted
      vid.muted = true;
      vid.play().catch(() => {});
    });
    vid.addEventListener("play", setPp);
    vid.addEventListener("pause", setPp);
    snd.addEventListener("click", () => {
      vid.muted = !vid.muted;
      if (!vid.muted && vid.paused) vid.play().catch(() => {});
      setSnd();
    });
    pp.addEventListener("click", () => vid.play().catch(() => {}));
    vid.addEventListener("click", () => { if (vid.paused) vid.play().catch(() => {}); else vid.pause(); });
    setPp();
    $(".modal-close", modal).focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    const v = $("video", modal);
    if (v) { v.pause(); v.removeAttribute("src"); v.load(); }
    modalVid = null;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function bindCards(root) {
    $$(".vc-media", root).forEach((media) => {
      const open = () => openModal(media.dataset.src, media.dataset.title, !!media.dataset.audio);
      media.addEventListener("click", open);
      media.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && open());
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

  /* ---------------- brief form: prefilled Email + WhatsApp ---------------- */
  function briefFields(form) {
    const g = (n) => ($(`[name="${n}"]`, form) || {}).value || "";
    const niche = g("niche") === "Other (Specify below)" ? "Other: " + g("specify") : g("niche");
    const lines = [
      `Brand: ${g("brand")}`,
      `Email: ${g("email")}`,
      `Industry Niche: ${niche}`,
      `Targeted Ad Style: ${g("adstyle")}`,
      `Creative Format: ${g("format")}`,
      `${form.dataset.productLabel || "Product / Line"}: ${g("product")}`,
      `${form.dataset.descLabel || "Description"}: ${g("desc")}`,
    ];
    const subject = `Free 10-15s Ad Mockup Brief — ${g("brand")}`;
    return { subject: subject, lines: lines };
  }
  function showSuccess(form, channel) {
    const ok = $("#brief-success");
    if (!ok) return;
    const emailMsg = $("[data-ok-email]", ok);
    const waMsg = $("[data-ok-wa]", ok);
    if (emailMsg) emailMsg.hidden = channel !== "email";
    if (waMsg) waMsg.hidden = channel !== "wa";
    form.hidden = true;
    ok.classList.add("show");
    ok.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });
  }

  $$("form[data-brief]").forEach((form) => {
    const nicheSel = $('[name="niche"]', form);
    const specifyWrap = $("[data-specify-wrap]", form);
    if (nicheSel && specifyWrap) {
      const toggleSpecify = () => {
        const other = nicheSel.value.toLowerCase().includes("other");
        specifyWrap.style.display = other ? "" : "none";
        $('[name="specify"]', form).required = other;
      };
      nicheSel.addEventListener("change", toggleSpecify);
      toggleSpecify();
    }

    /* email route — validates, then launches prefilled mail draft */
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const b = briefFields(form);
      const body = b.lines.concat(["", "Photos/reference files will be attached to this email."]).join("\n");
      window.location.href =
        `mailto:${D.brand.email}?subject=${encodeURIComponent(b.subject)}&body=${encodeURIComponent(body)}`;
      showSuccess(form, "email");
    });

    /* whatsapp route — validates, then opens chat with the same brief */
    const waBtn = $("[data-wa-send]", form);
    if (waBtn) waBtn.addEventListener("click", () => {
      if (!form.reportValidity()) return;
      const b = briefFields(form);
      const text = "👋 " + b.subject + "\n\n" + b.lines.join("\n") +
        "\n\nI'll send my product photos here in the chat.";
      window.open(`https://wa.me/${D.brand.waNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
      showSuccess(form, "wa");
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

  /* ---------------- prefetch pages for instant navigation ---------------- */
  function prefetchPages() {
    const pg = document.body.dataset.page || "home";
    const self = pg === "home" ? "/" : `/${pg}/`;
    (D.prefetch || []).forEach((href) => {
      if (href === self) return;
      const l = document.createElement("link");
      l.rel = "prefetch"; l.href = href; l.as = "document";
      document.head.appendChild(l);
    });
  }
  if ("requestIdleCallback" in window) requestIdleCallback(prefetchPages, { timeout: 4000 });
  else window.addEventListener("load", () => setTimeout(prefetchPages, 1200));

  /* ---------------- boot: fetch manifest ---------------- */
  const page = document.body.dataset.page;
  fetch(D.manifestUrl)
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
