(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
    try { tg.setHeaderColor("#10120f"); tg.setBackgroundColor("#10120f"); } catch (_) {}
  }
  const initData = tg?.initData || "";
  const headers = {"Content-Type":"application/json", "X-Telegram-Init-Data":initData};
  const $ = (id) => document.getElementById(id);
  const toast = (msg) => { $("toast").textContent = msg; };

  async function api(url, options = {}) {
    const res = await fetch(url, {...options, headers:{...headers, ...(options.headers || {})}});
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }
  async function load() {
    try {
      const [me, stats, config] = await Promise.all([api("/api/me"), api("/api/stats"), api("/api/config")]);
      $("referrals").textContent = me.referrals ?? "0";
      $("clicks").textContent = stats.clicks ?? "0";
      $("ref-link").textContent = me.referral_link;
      if (config.partner_approved) {
        $("partner-text").textContent = `Approved offers from ${config.partner_name} may be available.`;
        $("partner-btn").textContent = "Explore offers";
        $("partner-btn").disabled = false;
        $("partner-btn").classList.remove("button-secondary");
        $("partner-btn").onclick = async () => {
          try {
            const result = await api("/api/click", {method:"POST", body:"{}"});
            if (result.url) {
              if (tg?.openLink) tg.openLink(result.url);
              else window.open(result.url, "_blank", "noopener");
            } else toast(result.message || "Partner link not available.");
          } catch (e) { toast(e.message); }
        };
      }
    } catch (e) {
      $("referrals").textContent = "—";
      $("clicks").textContent = "—";
      $("ref-link").textContent = "Open this app from its Telegram bot to load your link.";
      if (!tg?.initData) toast("Preview mode: open from Telegram after deployment.");
      else toast(e.message);
    }
  }
  $("copy-btn").addEventListener("click", async () => {
    const value = $("ref-link").textContent;
    if (!value.startsWith("https://")) return toast("Your referral link is not ready yet.");
    try {
      await navigator.clipboard.writeText(value);
      toast("Referral link copied.");
    } catch (_) {
      toast("Copy is unavailable in this client. Press and hold the link to copy it.");
    }
  });
  load();
})();
