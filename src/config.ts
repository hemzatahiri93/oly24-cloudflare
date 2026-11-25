export const siteConfig = {
  name: "OLY24",
  phoneDisplay: import.meta.env.VITE_PHONE_DISPLAY || "(820) 123-4567",
  phoneHref: import.meta.env.VITE_PHONE_E164 || "+18201234567",
  siteUrl: import.meta.env.VITE_SITE_URL || "https://oly24.com",
  ga4Id: import.meta.env.VITE_GA4_ID || "",
  metaPixelId: import.meta.env.VITE_META_PIXEL_ID || "",
  tiktokPixelId: import.meta.env.VITE_TIKTOK_PIXEL_ID || ""
};

export function phoneReady(): boolean {
  return Boolean(siteConfig.phoneDisplay.trim() && siteConfig.phoneHref.trim());
}

export interface AttributionData {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  landingPage: string;
  referrer: string;
}

const STORAGE_KEY = "oly24_attribution";

export function captureAttribution(): AttributionData {
  const params = new URLSearchParams(window.location.search);
  const existing = getAttribution();
  const next: AttributionData = {
    source: params.get("utm_source") || existing.source || "",
    medium: params.get("utm_medium") || existing.medium || "",
    campaign: params.get("utm_campaign") || existing.campaign || "",
    content: params.get("utm_content") || existing.content || "",
    term: params.get("utm_term") || existing.term || "",
    landingPage: existing.landingPage || window.location.pathname + window.location.search,
    referrer: existing.referrer || document.referrer || ""
  };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage limits
  }
  return next;
}

export function getAttribution(): AttributionData {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AttributionData;
  } catch {
    // ignore
  }
  return { source: "", medium: "", campaign: "", content: "", term: "", landingPage: "", referrer: "" };
}

function loadScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

export function loadAnalytics() {
  const w = window as any;
  if (siteConfig.ga4Id) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = (...args: unknown[]) => { w.dataLayer.push(args); };
    w.gtag("js", new Date());
    w.gtag("config", siteConfig.ga4Id, { anonymize_ip: true });
    loadScript("ga4", `https://googletagmanager.com{encodeURIComponent(siteConfig.ga4Id)}`);
  }

  if (siteConfig.metaPixelId) {
    if (!w.fbq) {
      const fbq: any = (...args: unknown[]) => {
        if (fbq.callMethod) fbq.callMethod(...args);
        else fbq.queue.push(args);
      };
      fbq.queue = [];
      fbq.push = fbq;
      fbq.loaded = true;
      fbq.version = "2.0";
      w.fbq = fbq;
    }
    w.fbq("init", siteConfig.metaPixelId);
    w.fbq("track", "PageView");
    loadScript("meta", "https://facebook.net");
  }

  if (siteConfig.tiktokPixelId) {
    w.TiktokAnalyticsObject = "ttq";
    const ttq: any = (w.ttq = w.ttq || []);
    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
    ttq.setAndDefer = (t: any, e: string) => {
      t[e] = (...args: unknown[]) => { t.push([e, ...args]); };
    };
    for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.load = (id: string) => {
      loadScript("ttq", `https://tiktok.com{encodeURIComponent(id)}&lib=ttq`);
    };
    ttq.load(siteConfig.tiktokPixelId);
    ttq.page();
  }
}

export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  const w = window as any;
  if (typeof w.gtag === "function") w.gtag("event", eventName, params || {});
  if (typeof w.fbq === "function") w.fbq("trackCustom", eventName, params || {});
  if (w.ttq && typeof w.ttq.track === "function") w.ttq.track(eventName, params || {});
}
