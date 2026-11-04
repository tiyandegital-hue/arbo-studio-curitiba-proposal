/* ARBO Studio — site logic. ONE swappable constant for the business name. */
(function () {
  "use strict";

  /* ============ constants ============ */
  const BUSINESS_NAME = "ARBO Studio";              // ← único ponto de troca do nome do negócio
  const WHATSAPP_NUMBER = "5541991461096";          // número publicado em matéria (CuritibaCult)
  const WHATSAPP_LABEL = "(41) 99146-1096";
  const RANGE_NOTE = "R$ 60 a R$ 1.280";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const money = (v) => "R$ " + v.toLocaleString("pt-BR");

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ business name injection ============ */
  $$("[data-business]").forEach((el) => { el.textContent = BUSINESS_NAME; });

  /* ============ nav state + mobile menu ============ */
  const page = document.body.getAttribute("data-page");
  $$(".nav a[data-nav]").forEach((a) => {
    if (a.getAttribute("data-nav") === page) a.setAttribute("aria-current", "page");
  });
  const navToggle = $("#navToggle"), nav = $("#siteNav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* ============ seamless marquee/ticker ============ */
  $$(".js-loop").forEach((track) => {
    if (track.children.length && track.children.length < 3) {
      const html = track.innerHTML;
      track.innerHTML = html + html;
      track.setAttribute("aria-hidden", "true");
    }
  });

  /* ============ reveal on scroll ============ */
  const io = ("IntersectionObserver" in window && !reduced)
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" })
    : null;
  $$(".rv").forEach((el) => { if (io) io.observe(el); else el.classList.add("is-in"); });

  /* ============ WhatsApp deep links ============ */
  const waLink = (msg) => "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(msg);
  $$("[data-wa]").forEach((a) => {
    const msg = a.getAttribute("data-wa-msg") || ("Olá! Vi a proposta conceitual da " + BUSINESS_NAME + " e quero agendar um horário.");
    a.href = waLink(msg);
  });
  $$("[data-wa-label]").forEach((el) => { el.textContent = WHATSAPP_LABEL; });

  /* ==================================================
     SERVIÇOS — filters, counts, add-to-ritual, sticky bar
     ================================================== */
  const filterBar = $("#svcFilters");
  if (filterBar) {
    const cards = $$(".svc");
    const selCount = $("#selCount");
    const bar = $("#bookingBar"), barTotal = $("#barTotal"), barCount = $("#barCount");
    let ritual = [];
    try { ritual = JSON.parse(localStorage.getItem("arbo-ritual") || "[]"); } catch (e) { ritual = []; }

    const refreshSel = () => {
      if (selCount) selCount.textContent = ritual.length;
      if (barCount) barCount.textContent = ritual.length;
      if (barTotal) {
        const total = ritual.reduce((s, r) => s + (r.min || 0), 0);
        barTotal.textContent = ritual.length ? ("a partir de " + money(total)) : money(0);
      }
      const on = ritual.length > 0;
      if (bar) bar.classList.toggle("is-on", on);
      document.body.classList.toggle("has-booking-bar", on);
      $$(".add-btn", filterBar.parentElement).forEach((btn) => {
        const inRitual = ritual.some((r) => r.code === btn.getAttribute("data-code"));
        btn.setAttribute("aria-pressed", inRitual ? "true" : "false");
        btn.querySelector("span").textContent = inRitual ? "No Ritual ✓" : "Adicionar ao Ritual";
      });
    };

    $$(".filter-chip", filterBar).forEach((chip) => {
      chip.addEventListener("click", () => {
        $$(".filter-chip", filterBar).forEach((c) => c.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
        const f = chip.getAttribute("data-filter");
        cards.forEach((c) => c.classList.toggle("is-hidden", f !== "all" && c.getAttribute("data-cat") !== f));
      });
    });

    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".add-btn");
      if (!btn) return;
      const code = btn.getAttribute("data-code");
      const idx = ritual.findIndex((r) => r.code === code);
      if (idx >= 0) { ritual.splice(idx, 1); }
      else {
        const card = btn.closest(".svc");
        ritual.push({
          code,
          name: card.getAttribute("data-name"),
          min: parseInt(card.getAttribute("data-min"), 10) || 0,
          max: parseInt(card.getAttribute("data-max"), 10) || 0,
          dur: card.getAttribute("data-dur") || ""
        });
      }
      try { localStorage.setItem("arbo-ritual", JSON.stringify(ritual)); } catch (err) {}
      refreshSel();
    });

    const clearBtn = $("#barClear");
    if (clearBtn) clearBtn.addEventListener("click", () => {
      ritual = [];
      try { localStorage.removeItem("arbo-ritual"); } catch (err) {}
      refreshSel();
    });

    refreshSel();
  }

  /* ==================================================
     GALERIA — filter chips + count
     ================================================== */
  const gBar = $("#galFilters");
  if (gBar) {
    const cards = $$(".g-card");
    const countEl = $("#galCount");
    const update = (f) => {
      let n = 0;
      cards.forEach((c) => {
        const show = f === "all" || c.getAttribute("data-cat") === f;
        c.classList.toggle("is-hidden", !show);
        if (show) n++;
      });
      if (countEl) countEl.textContent = "EXIBINDO " + n + " DE " + cards.length + " CRIAÇÕES";
    };
    $$(".filter-chip", gBar).forEach((chip) => {
      chip.addEventListener("click", () => {
        $$(".filter-chip", gBar).forEach((c) => c.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
        update(chip.getAttribute("data-filter"));
      });
    });
    update("all");
  }

  /* ==================================================
     AGENDAMENTO — 3-step wizard
     ================================================== */
  const wizard = $("#bookWizard");
  if (wizard) {
    const BOOK_SERVICES = [
      { id: "essencial",  tag: "ASSINATURA ESSENCIAL", name: "Manicure Botânica Minimal",    dur: "45 MIN",  price: 95  },
      { id: "pes",        tag: "TERAPIA DE PÉS",       name: "Spa Imersivo Pedicure",        dur: "60 MIN",  price: 145 },
      { id: "fibra",      tag: "ARQUITETURA DE UNHAS", name: "Alongamento Fibra Acetinada",  dur: "110 MIN", price: 260 },
      { id: "autoral",    tag: "CRIAÇÃO AUTORAL",      name: "Editorial Nail Art",          dur: "45 MIN",  price: 120 }
    ];
    const state = { service: null, date: null, time: null, look: null, name: "", phone: "" };

    const params = new URLSearchParams(window.location.search);
    if (params.get("look")) state.look = params.get("look");

    const steps = $$(".book-step", wizard);
    const stepTabs = $$(".step", wizard);
    let cur = 0;
    const go = (i) => {
      cur = Math.max(0, Math.min(2, i));
      steps.forEach((s, k) => s.classList.toggle("is-on", k === cur));
      stepTabs.forEach((t, k) => {
        t.classList.toggle("is-active", k === cur);
        t.classList.toggle("is-done", k < cur);
      });
      if (!reduced && wizard.scrollIntoView) wizard.scrollIntoView({ behavior: "smooth", block: "start" });
      renderResumo();
    };

    /* --- step 1: service cards --- */
    const optGrid = $("#optGrid");
    BOOK_SERVICES.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "opt"; b.setAttribute("aria-pressed", "false");
      b.dataset.id = s.id;
      b.innerHTML = '<span class="label">' + s.tag + "</span><h3>" + s.name + "</h3>" +
        '<p>' + s.dur.toLowerCase().replace("min", " min") + " · valores de exemplo</p>" +
        '<span class="opt__price">' + money(s.price) + "<small>(EXEMPLO)</small></span>";
      b.addEventListener("click", () => {
        state.service = s;
        $$(".opt", optGrid).forEach((o) => o.setAttribute("aria-pressed", o === b ? "true" : "false"));
        $("#toStep2").disabled = false;
        renderResumo();
      });
      optGrid.appendChild(b);
    });
    // preselect from serviços ritual (first item, matched by name loosely)
    try {
      const ritual = JSON.parse(localStorage.getItem("arbo-ritual") || "[]");
      if (ritual.length) {
        const first = ritual[0];
        const match = BOOK_SERVICES.find((s) => s.name.toLowerCase().includes(first.name.split(" ")[0].toLowerCase())) || BOOK_SERVICES[0];
        const btn = optGrid.querySelector('[data-id="' + match.id + '"]');
        if (btn) btn.click();
      }
    } catch (e) {}

    /* --- step 2: dates + slots --- */
    const dateGrid = $("#dateGrid"), slotGrid = $("#slotGrid");
    const SLOTS = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];
    const days = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
    const today = new Date();
    const dlist = [];
    for (let i = 1; i <= 21; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      dlist.push(d);
    }
    dlist.forEach((d) => {
      const closed = d.getDay() === 0 || d.getDay() === 1; // Dom/Seg fechado
      const b = document.createElement("button");
      b.type = "button"; b.className = "day"; b.disabled = closed;
      b.setAttribute("aria-pressed", "false");
      b.innerHTML = '<span class="dw">' + days[d.getDay()] + '</span><span class="dn">' + d.getDate() + "</span>";
      if (closed) b.title = "Fechado (domingo e segunda)";
      b.addEventListener("click", () => {
        state.date = d; state.time = null;
        $$(".day", dateGrid).forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
        renderSlots(); renderResumo();
      });
      b._date = d;
      dateGrid.appendChild(b);
    });
    function renderSlots() {
      slotGrid.innerHTML = "";
      if (!state.date) { slotGrid.innerHTML = '<p class="label">Escolha uma data acima</p>'; return; }
      SLOTS.forEach((t, i) => {
        const taken = (state.date.getDate() + i) % 3 === 0; // exemplo: alguns horários ocupados
        const b = document.createElement("button");
        b.type = "button"; b.className = "slot"; b.textContent = t; b.disabled = taken;
        b.setAttribute("aria-pressed", "false");
        if (taken) b.title = "Horário ocupado (exemplo)";
        b.addEventListener("click", () => {
          state.time = t;
          $$(".slot", slotGrid).forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false"));
          $("#toStep3").disabled = false;
          renderResumo();
        });
        slotGrid.appendChild(b);
      });
    }
    renderSlots();

    /* --- step 3: summary + concierge form --- */
    const fmtDate = (d) => d ? d.getDate().toString().padStart(2, "0") + "/" + (d.getMonth() + 1).toString().padStart(2, "0") + "/" + d.getFullYear() : "—";
    const rSvc = $("#rSvc"), rDate = $("#rDate"), rTime = $("#rTime"), rTotal = $("#rTotal"), rLook = $("#rLook"), rLookRow = $("#rLookRow");
    function renderResumo() {
      if (rSvc) rSvc.textContent = state.service ? (state.service.tag.charAt(0) + state.service.tag.slice(1).toLowerCase() + " · " + state.service.name) : "—";
      if (rDate) rDate.textContent = state.date ? (fmtDate(state.date) + " (" + days[state.date.getDay()].toLowerCase() + ")") : "—";
      if (rTime) rTime.textContent = state.time || "—";
      if (rTotal) rTotal.textContent = state.service ? money(state.service.price) : money(0);
      if (rLookRow) { const show = !!state.look; rLookRow.style.display = show ? "" : "none"; if (rLook) { rLook.style.display = show ? "" : "none"; rLook.textContent = state.look || "—"; } }
    }
    const concierge = $("#conciergeForm");
    if (concierge) {
      concierge.addEventListener("submit", (e) => {
        e.preventDefault();
        let ok = true;
        const nameF = $("#cName"), phoneF = $("#cPhone");
        const check = (input, test) => {
          const f = input.closest(".field");
          const valid = test(input.value.trim());
          f.classList.toggle("is-invalid", !valid);
          input.setAttribute("aria-invalid", valid ? "false" : "true");
          if (!valid) ok = false;
        };
        check(nameF, (v) => v.length >= 2);
        check(phoneF, (v) => v.replace(/\D/g, "").length >= 8);
        if (!ok) return;
        state.name = nameF.value.trim(); state.phone = phoneF.value.trim();
        let msg = "Olá! Vi a proposta conceitual da " + BUSINESS_NAME + " e quero agendar:\n" +
          "• Serviço: " + (state.service ? state.service.name : "a combinar") + "\n" +
          "• Data: " + fmtDate(state.date) + " às " + (state.time || "a combinar") + "\n" +
          "• Nome: " + state.name;
        if (state.look) msg += "\n• Referência de look: " + state.look;
        msg += "\n(Agendamento via proposta conceitual — valores e horários a confirmar)";
        const a = $("#waConfirm");
        a.href = waLink(msg);
        a.textContent = "Confirmar no WhatsApp · " + WHATSAPP_LABEL;
        $("#conciergeOk").classList.add("is-on");
        if (!reduced && $("#conciergeOk").scrollIntoView) $("#conciergeOk").scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }

    /* nav buttons */
    $("#toStep2").addEventListener("click", () => go(1));
    $("#toStep3").addEventListener("click", () => go(2));
    $("#backTo1").addEventListener("click", () => go(0));
    $("#backTo2").addEventListener("click", () => go(1));
    go(0);
  }

  /* ==================================================
     CONTATO — form validation (demo)
     ================================================== */
  const cForm = $("#contactForm");
  if (cForm) {
    cForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      const rules = [
        ["#fName", (v) => v.length >= 2],
        ["#fPhone", (v) => v.replace(/\D/g, "").length >= 8],
        ["#fMsg", (v) => v.length >= 10]
      ];
      rules.forEach(([sel, test]) => {
        const input = $(sel);
        const f = input.closest(".field");
        const valid = test(input.value.trim());
        f.classList.toggle("is-invalid", !valid);
        input.setAttribute("aria-invalid", valid ? "false" : "true");
        if (!valid) ok = false;
      });
      if (!ok) return;
      cForm.style.display = "none";
      $("#contactOk").classList.add("is-on");
    });
  }
})();
