import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight, ArrowUpRight, CheckCircle2, Clock3, Flame,
  House, Menu, Phone, ShieldCheck, Siren, Snowflake, Wrench, X, Droplets,
  MapPin, Zap
} from "lucide-react";
import { getAttribution, loadAnalytics, phoneReady, siteConfig, trackEvent } from "./config";

type ServiceKey = "heating" | "plumbing" | "frozen-pipes" | "water-leaks";
type ServicePage = {
  title: string;
  eyebrow: string;
  intro: string;
  description: string;
  bullets: string[];
  icon: typeof Flame;
};

const servicePages: Record<ServiceKey, ServicePage> = {
  heating: {
    title: "Heating service connections",
    eyebrow: "HEATING SUPPORT",
    intro: "Get connected for home heating help.",
    description: "Tell us where service is needed and we’ll help you explore connections with independent home service providers in your area.",
    bullets: ["Heating system concerns", "No-heat situations", "Furnace and thermostat questions", "Routine service inquiries"],
    icon: Flame
  },
  plumbing: {
    title: "Plumbing service connections",
    eyebrow: "PLUMBING SUPPORT",
    intro: "Find a path to the plumbing help you need.",
    description: "Share your ZIP code and a few details so you can explore available independent plumbing service providers in your area.",
    bullets: ["Plumbing repairs", "Drain and fixture concerns", "Water supply issues", "General plumbing service"],
    icon: Wrench
  },
  "frozen-pipes": {
    title: "Frozen pipe help",
    eyebrow: "URGENT PLUMBING",
    intro: "Concerned about frozen pipes?",
    description: "Frozen pipes can lead to water damage. If you suspect a pipe has frozen or burst, consider shutting off the water supply if it is safe to do so and seek qualified local help.",
    bullets: ["Suspected frozen pipes", "Reduced or stopped water flow", "Possible pipe damage", "Help finding local plumbing providers"],
    icon: Snowflake
  },
  "water-leaks": {
    title: "Water leak support",
    eyebrow: "URGENT PLUMBING",
    intro: "Take the next step on a water leak.",
    description: "If safe, stop the water source and keep clear of electrical hazards. Share your ZIP code to explore independent plumbing service options nearby.",
    bullets: ["Visible water leaks", "Leaking fixtures or supply lines", "Possible water damage", "Help finding local plumbing providers"],
    icon: Droplets
  }
};

function currentRoute() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (path === "/privacy") return "privacy";
  if (path === "/heating") return "heating";
  if (path === "/plumbing") return "plumbing";
  if (path === "/frozen-pipes") return "frozen-pipes";
  if (path === "/water-leaks") return "water-leaks";
  return "home";
}

function PhoneAction({ compact = false }: { compact?: boolean }) {
  return phoneReady ? (
    <a className={`button button-primary ${compact ? "button-small" : ""}`} href={`tel:${siteConfig.phoneHref}`} onClick={() => trackEvent("phone_click", { page: window.location.pathname })}>
      <Phone size={17} /> {siteConfig.phoneDisplay || "Call now"}
    </a>
  ) : (
    <a className={`button button-primary ${compact ? "button-small" : ""}`} href="#service-request" onClick={() => trackEvent("call_unconfigured_click")}>
      <Phone size={17} /> Check service options
    </a>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  return <header className="site-header">
    <div className="top-strip"><span><Siren size={14} /> HOME SERVICE CONNECTIONS</span><span>Heating & Plumbing</span></div>
    <div className="nav-wrap container">
      <a href="/" className="brand" aria-label="OLY24 home"><span className="brand-mark"><Zap size={22} fill="currentColor" /></span><span>OLY<span>24</span><small>HOME SERVICE CONNECTIONS</small></span></a>
      <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      <nav className={open ? "nav-links is-open" : "nav-links"}>
        <a href="/heating/" onClick={() => setOpen(false)}>Heating</a>
        <a href="/plumbing/" onClick={() => setOpen(false)}>Plumbing</a>
        <a href="/frozen-pipes/" onClick={() => setOpen(false)}>Frozen Pipes</a>
        <a href="/water-leaks/" onClick={() => setOpen(false)}>Water Leaks</a>
      </nav>
      <div className="nav-cta"><PhoneAction compact /></div>
    </div>
  </header>;
}

function LeadForm({ defaultService = "" }: { defaultService?: string }) {
  const [zip, setZip] = useState("");
  const [service, setService] = useState(defaultService);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!/^\d{5}$/.test(zip)) { setStatus("error"); setMessage("Enter a valid 5-digit US ZIP code."); return; }
    if (!service) { setStatus("error"); setMessage("Choose a service category."); return; }
    if (!consent) { setStatus("error"); setMessage("Please confirm that we may use these details to respond to your request."); return; }
    setStatus("sending");
    trackEvent("lead_form_submit", { service, zip });
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, email, zip, service, details, consent,
          ...getAttribution()
        })
      });
      const data = await response.json() as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) throw new Error(data.message || "The request could not be submitted.");
      setStatus("success");
      setMessage("Your request has been received. We’ll use the contact details you provided to follow up.");
      trackEvent("lead_form_success", { service, zip });
      setName(""); setEmail(""); setZip(""); setDetails(""); setConsent(false);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  return <form className="lead-form" onSubmit={submit} id="service-request">
    <div className="form-heading"><span className="eyebrow">START HERE</span><h3>Check service options</h3><p>Enter your ZIP code and tell us what kind of help you’re looking for.</p></div>
    <label>US ZIP code <input inputMode="numeric" autoComplete="postal-code" maxLength={5} pattern="[0-9]{5}" placeholder="e.g. 10001" value={zip} onChange={e => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))} required /></label>
    <label>Service needed
      <select value={service} onChange={e => setService(e.target.value)} required>
        <option value="">Select a service</option>
        <option value="Heating">Heating</option>
        <option value="Plumbing">Plumbing</option>
        <option value="Frozen pipes">Frozen pipes</option>
        <option value="Water leak">Water leak</option>
        <option value="Other home service">Other home service</option>
      </select>
    </label>
    <div className="form-grid">
      <label>Name <input autoComplete="name" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Email <input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} /></label>
    </div>
    <label>What’s happening? <textarea rows={3} placeholder="Briefly describe the issue (optional)" value={details} onChange={e => setDetails(e.target.value)} /></label>
    <label className="consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} /> <span>I agree that OLY24 may use the information I submit to respond to my request and help connect me with independent service providers. See the <a href="/privacy/">Privacy Policy</a>.</span></label>
    <button className="button button-primary button-wide" type="submit" disabled={status === "sending"}>{status === "sending" ? "Submitting…" : "Submit service request"} <ArrowRight size={17} /></button>
    {message && <p className={`form-message ${status}`} role="status">{message}</p>}
    <p className="form-note"><ShieldCheck size={14} /> Your information is used to process your request. Do not submit sensitive personal or payment information.</p>
  </form>;
}

function TrustNote() {
  return <p className="trust-note"><ShieldCheck size={15} /> OLY24 helps connect visitors with independent home service providers. Provider availability, services, pricing and credentials vary by location.</p>;
}

function HomePage() {
  return <>
    <section className="hero">
      <div className="hero-grid container">
        <div className="hero-copy">
          <div className="eyebrow eyebrow-light"><span className="pulse-dot" /> HOME SERVICE CONNECTIONS</div>
          <h1>Home service help.<br /><em>One clear next step.</em></h1>
          <p className="hero-lede">Explore connections for heating and plumbing needs with independent service providers in your area.</p>
          <div className="hero-actions"><a href="#service-request" className="button button-orange" onClick={() => trackEvent("hero_zip_cta_click")}>Check your ZIP code <ArrowRight size={18} /></a><PhoneAction /></div>
          <div className="hero-meta"><span><Clock3 size={15} /> Start with your ZIP code</span><span><MapPin size={15} /> Local availability varies</span></div>
        </div>
        <div className="hero-visual" aria-label="Illustration of home service tools">
          <div className="visual-orbit orbit-one"></div><div className="visual-orbit orbit-two"></div>
          <div className="visual-house"><House size={116} strokeWidth={1.1} /><div className="house-window"></div></div>
          <div className="visual-chip chip-top"><Flame size={18} /> HEATING</div>
          <div className="visual-chip chip-bottom"><Wrench size={18} /> PLUMBING</div>
          <div className="visual-alert"><Siren size={22} /><span>YOUR NEXT STEP<br /><b>STARTS HERE</b></span></div>
        </div>
      </div>
      <div className="hero-bottom container"><span>HEATING</span><i></i><span>PLUMBING</span><i></i><span>HOME SERVICE CONNECTIONS</span></div>
    </section>

    <section className="intro-section section-pad">
      <div className="container intro-grid">
        <div><span className="eyebrow">WHEN HOME NEEDS ATTENTION</span><h2>Find the right direction<br /><em>for your next step.</em></h2></div>
        <div className="intro-text"><p>Heating and plumbing problems can interrupt your day. OLY24 makes it easier to start exploring service options based on your location and the type of help you need.</p><TrustNote /></div>
      </div>
    </section>

    <section className="services-section section-pad">
      <div className="container">
        <div className="section-heading"><div><span className="eyebrow">WHAT DO YOU NEED HELP WITH?</span><h2>Choose a service</h2></div><p>Start with the issue you’re facing. Service availability depends on your ZIP code.</p></div>
        <div className="service-grid">
          <ServiceCard href="/heating/" icon={<Flame />} title="Heating" text="Heating system concerns, no-heat situations and service inquiries." />
          <ServiceCard href="/plumbing/" icon={<Wrench />} title="Plumbing" text="Explore options for common plumbing and water supply issues." />
          <ServiceCard href="/frozen-pipes/" icon={<Snowflake />} title="Frozen pipes" text="Learn the next steps when pipes may be frozen or damaged." urgent />
          <ServiceCard href="/water-leaks/" icon={<Droplets />} title="Water leaks" text="Explore local help for leaks and possible water damage." urgent />
        </div>
      </div>
    </section>

    <section className="process-section section-pad">
      <div className="container process-layout">
        <div><span className="eyebrow eyebrow-light">SIMPLE BY DESIGN</span><h2>A clearer way<br /><em>to get started.</em></h2><p>Share a few details so you can explore relevant service connections.</p><a href="#service-request" className="text-link light-link">Check service options <ArrowUpRight size={17} /></a></div>
        <div className="steps">
          <Step number="01" title="Tell us your ZIP code" text="Location helps determine whether service options may be available in your area." />
          <Step number="02" title="Choose the service" text="Select heating, plumbing or a specific issue so your request has context." />
          <Step number="03" title="Explore next steps" text="If options are available, you can follow up with an independent provider." />
        </div>
      </div>
    </section>

    <section className="request-section section-pad">
      <div className="container request-layout">
        <div className="request-copy"><span className="eyebrow">GET STARTED</span><h2>What’s happening<br /><em>at your home?</em></h2><p>Tell us a little about what you need. Start with your ZIP code and select the service that best matches your situation.</p><div className="request-assurance"><CheckCircle2 /> No obligation to submit a request for service.</div><TrustNote /></div>
        <LeadForm />
      </div>
    </section>
    <section className="bottom-cta"><div className="container bottom-cta-inner"><div><span className="eyebrow eyebrow-light">OLY24 HOME SERVICE CONNECTIONS</span><h2>Take the next step.</h2></div><a href="#service-request" className="button button-orange">Check service options <ArrowRight size={18} /></a></div></section>
  </>;
}

function ServiceCard({ href, icon, title, text, urgent = false }: { href: string; icon: React.ReactNode; title: string; text: string; urgent?: boolean }) {
  return <a className="service-card" href={href}><div className="service-icon">{icon}</div>{urgent && <span className="urgent-label">TIME-SENSITIVE</span>}<h3>{title}</h3><p>{text}</p><span className="card-link">Explore service <ArrowUpRight size={17} /></span></a>;
}
function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <div className="step"><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></div>;
}

function ServiceLanding({ service }: { service: ServiceKey }) {
  const data = servicePages[service];
  const Icon = data.icon;
  return <>
    <section className="service-hero"><div className="container service-hero-inner"><div className="service-hero-copy"><span className="eyebrow eyebrow-light">{data.eyebrow}</span><h1>{data.intro}</h1><p>{data.description}</p><div className="hero-actions"><a className="button button-orange" href="#service-request">Check your ZIP code <ArrowRight size={18} /></a><PhoneAction /></div></div><div className="service-hero-icon"><Icon size={112} strokeWidth={1.2} /></div></div></section>
    <section className="section-pad service-detail"><div className="container service-detail-grid"><div><span className="eyebrow">HOW OLY24 CAN HELP</span><h2>{data.title}</h2><p>OLY24 is a connection platform, not a home repair contractor. We help visitors take the first step toward exploring independent service providers. Provider availability and qualifications vary by location.</p><ul className="check-list">{data.bullets.map(item => <li key={item}><CheckCircle2 size={18} /> {item}</li>)}</ul></div><LeadForm defaultService={service === "heating" ? "Heating" : service === "plumbing" ? "Plumbing" : service === "frozen-pipes" ? "Frozen pipes" : "Water leak"} /></div></section>
    <section className="safety-band"><div className="container safety-inner"><Siren size={27} /><div><b>Immediate danger?</b><p>If there is fire, a gas odor, flooding near electrical equipment or another immediate threat, move to a safe location and contact the appropriate emergency service. Do not wait for an online request.</p></div></div></section>
  </>;
}


const heatingProblems = [
  {
    title: "Furnace Not Working",
    symptom: "Cold air from the vents or a system that keeps shutting down.",
    causes: "A dirty filter, power issue, or ignition or flame-sensor problem."
  },
  {
    title: "No Heat in the House",
    symptom: "The heating unit may run, but the home stays cold.",
    causes: "A clogged filter, pilot-light outage, gas-supply issue, or a boiler problem such as trapped air or low water pressure."
  },
  {
    title: "Furnace Won't Turn On",
    symptom: "The system does not respond when the thermostat calls for heat.",
    causes: "A tripped breaker, dead thermostat batteries, an access-panel safety switch, or a control-board fuse."
  },
  {
    title: "Uneven Heating",
    symptom: "Some rooms are warm while others remain cold.",
    causes: "Blocked vents, restricted duct airflow, or air and sludge buildup in boiler radiators."
  },
  {
    title: "Strange Furnace Noises",
    symptom: "Whistling, rattling, banging, or high-pitched whining during operation.",
    causes: "Airflow restrictions, loose panels or connections, delayed burner ignition, duct pressure changes, or mineral deposits in a boiler heat exchanger."
  }
];

const heatingFaqs = [
  {
    q: "Why is my furnace blowing cold air?",
    a: "A clogged filter, pilot-light or ignition issue, interrupted fuel supply, or system shutdown may be involved. Check the thermostat setting and filter. If the problem continues, arrange a qualified HVAC inspection."
  },
  {
    q: "What should I check if my furnace won't turn on?",
    a: "Confirm the thermostat is set to Heat and above the current room temperature. Check its batteries if the display is blank. You can also check the accessible furnace power switch, the properly seated external access panel, and whether a breaker has tripped."
  },
  {
    q: "Why does my furnace start and then stop?",
    a: "Restricted airflow, overheating and safety shut-offs, or a component problem may cause repeated cycling. Check whether the air filter is visibly clogged. Do not bypass safety switches; contact a qualified technician if it continues."
  },
  {
    q: "What if my heat pump runs but does not heat?",
    a: "A heat pump that runs without warming the home needs a system-specific assessment. Explore heating service options in your area for help identifying the cause."
  }
];

function HeatingLanding() {
  return <>
    <section className="service-hero heating-hero">
      <div className="container service-hero-inner">
        <div className="service-hero-copy">
          <span className="eyebrow eyebrow-light">HOME HEATING • HVAC SUPPORT</span>
          <h1>Furnace not working or blowing cold air?</h1>
          <p>Find information about common heating problems and safe first checks, then explore connections with independent heating service providers in your area.</p>
          <div className="hero-actions">
            <a className="button button-orange" href="#service-request" onClick={() => trackEvent("heating_zip_cta_click")}>Check your ZIP code <ArrowRight size={18} /></a>
            <PhoneAction />
          </div>
          <div className="heating-hero-tags"><span>Furnace won't turn on</span><span>No heat in the house</span><span>Furnace starts then stops</span></div>
        </div>
        <div className="service-hero-icon"><Flame size={112} strokeWidth={1.2} /></div>
      </div>
    </section>

    <section className="heating-quick section-pad">
      <div className="container">
        <div className="section-heading"><div><span className="eyebrow">FIND YOUR ISSUE</span><h2>What is your heating system doing?</h2></div><p>Select the description closest to what you are experiencing. Causes can vary by system and home.</p></div>
        <div className="heating-problem-grid">
          {heatingProblems.map((problem, index) => <article className="heating-problem-card" key={problem.title}>
            <span className="problem-number">{String(index + 1).padStart(2, "0")}</span>
            <h3>{problem.title}</h3>
            <p>{problem.symptom}</p>
            <div className="possible-causes"><b>Possible causes</b><p>{problem.causes}</p></div>
          </article>)}
        </div>
      </div>
    </section>

    <section className="section-pad heating-first-steps">
      <div className="container">
        <div className="section-heading"><div><span className="eyebrow">SAFE FIRST CHECKS</span><h2>Before you request heating help</h2></div><p>Only perform simple checks that you can do safely. Do not open sealed equipment compartments or attempt gas or electrical repairs.</p></div>
        <div className="first-step-grid">
          <article><span>01</span><h3>Thermostat</h3><p>Set it to <b>Heat</b> and choose a temperature above the current room temperature. Check the batteries if the display is blank.</p></article>
          <article><span>02</span><h3>Air filter</h3><p>Look for visible dust buildup. Replace a clogged filter with the correct type and size, following the equipment instructions.</p></article>
          <article><span>03</span><h3>Power and access panel</h3><p>Check the accessible furnace power switch and make sure the external access panel is properly seated. If a breaker trips again, do not keep resetting it.</p></article>
        </div>
        <div className="heating-safety-alert">
          <Siren size={26}/>
          <div><b>Smell gas, suspect carbon monoxide, or see smoke?</b><p>Do not operate electrical switches or use flames. Leave immediately. From a safe location, call emergency services or your gas provider. Do not re-enter until authorities say it is safe.</p></div>
        </div>
      </div>
    </section>

    <section className="heating-faq-section section-pad">
      <div className="container heating-faq-layout">
        <div><span className="eyebrow">QUICK ANSWERS</span><h2>Heating questions</h2><p>Still unsure what may be happening? Review these common questions or explore local service connections.</p><a href="#service-request" className="text-link">Find heating options in your area <ArrowUpRight size={17}/></a></div>
        <div className="heating-faq-list">
          {heatingFaqs.map((faq) => <details key={faq.q}><summary>{faq.q}</summary><p>{faq.a}</p></details>)}
        </div>
      </div>
    </section>

    <section className="request-section section-pad">
      <div className="container request-layout">
        <div className="request-copy"><span className="eyebrow">FIND LOCAL OPTIONS</span><h2>Need heating help<br/><em>in your area?</em></h2><p>Enter your US ZIP code and describe the heating issue. OLY24 helps visitors explore connections with independent service providers. Availability varies by location.</p><div className="request-assurance"><CheckCircle2 /> Start with your ZIP code and issue.</div><TrustNote /></div>
        <LeadForm defaultService="Heating"/>
      </div>
    </section>
    <section className="bottom-cta"><div className="container bottom-cta-inner"><div><span className="eyebrow eyebrow-light">OLY24 • HEATING CONNECTIONS</span><h2>Take the next step toward heat.</h2></div><a href="#service-request" className="button button-orange">Check your ZIP code <ArrowRight size={18}/></a></div></section>
  </>;
}


function PrivacyPage() {
  return <main className="legal-page container section-pad"><span className="eyebrow">OLY24</span><h1>Privacy Policy</h1><p className="legal-updated">Last updated: November 24, 2026</p><h2>Information you provide</h2><p>When you submit a service request, OLY24 may collect your name, email address, ZIP code, selected service and the description you choose to provide.</p><h2>How information is used</h2><p>Information is used to receive and respond to your request, evaluate service availability and, where applicable, help connect you with independent home service providers. Information may be shared with a provider when needed to respond to the request and as permitted by applicable law.</p><h2>Analytics and advertising</h2><p>OLY24 may use analytics or advertising measurement technologies if configured. These technologies may collect device, browser, page-view and campaign information. Applicable consent and opt-out requirements should be honored before enabling non-essential tracking.</p><h2>Data security and retention</h2><p>Reasonable safeguards should be used to protect submitted information. Information should be retained only as long as needed for the purposes described or as required by law.</p><h2>Your choices</h2><p>To ask a question about a request or privacy practice, contact the site operator using the contact details published on this website. Do not submit sensitive personal, financial or medical information through the service request form.</p><h2>Independent providers</h2><p>Service providers are independent third parties and are not employees or agents of OLY24 unless expressly stated in a separate written agreement. Their services, pricing, availability, credentials and privacy practices may differ.</p><p className="legal-note">This starter policy is a drafting baseline and must be reviewed and completed for the actual business, data flows, jurisdictions and vendors before launch.</p></main>;
}

function CookieConsent() {
  const [choice, setChoice] = useState<"accepted" | "rejected" | "">(() => {
    try { return localStorage.getItem("oly24-analytics-consent") as "accepted" | "rejected" || ""; }
    catch { return ""; }
  });
  function saveChoice(next: "accepted" | "rejected") {
    try { localStorage.setItem("oly24-analytics-consent", next); } catch { /* Storage may be unavailable. */ }
    setChoice(next);
    if (next === "accepted") {
      trackEvent("analytics_consent_granted");
      window.location.reload();
    }
  }
  if (choice) return null;
  return <aside className="cookie-banner" aria-label="Analytics preferences">
    <div><b>Privacy choices</b><p>Optional analytics help us understand site traffic and campaign performance. You can accept or decline non-essential analytics.</p></div>
    <div className="cookie-actions"><button className="cookie-reject" onClick={() => saveChoice("rejected")}>Decline</button><button className="button button-orange" onClick={() => saveChoice("accepted")}>Accept analytics</button></div>
  </aside>;
}

function Footer() {
  return <footer className="site-footer"><div className="container footer-main"><div><a href="/" className="brand brand-footer"><span className="brand-mark"><Zap size={22} fill="currentColor" /></span><span>OLY<span>24</span><small>HOME SERVICE CONNECTIONS</small></span></a><p>Helping you explore independent home service options for heating and plumbing needs.</p></div><div><b>Services</b><a href="/heating/">Heating</a><a href="/plumbing/">Plumbing</a><a href="/frozen-pipes/">Frozen Pipes</a><a href="/water-leaks/">Water Leaks</a></div><div><b>Information</b><a href="/privacy/">Privacy Policy</a><a href="#service-request">Check service options</a></div><div><b>Contact</b>{phoneReady ? <a href={`tel:${siteConfig.phoneHref}`}>{siteConfig.phoneDisplay || "Call OLY24"}</a> : <span>Contact details to be configured</span>}<span>United States service area varies</span></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} OLY24. All rights reserved.</span><span>OLY24 is a connection platform, not a repair contractor.</span></div></footer>;
}

export default function App() {
  const route = currentRoute();
  useEffect(() => {
    try {
      if (localStorage.getItem("oly24-analytics-consent") === "accepted") loadAnalytics();
    } catch { /* Analytics remain disabled when storage is unavailable. */ }
    const titles: Record<string, string> = {
      home: "OLY24 | Heating & Plumbing Service Connections",
      privacy: "Privacy Policy | OLY24",
      heating: "Furnace Not Working? Heating Help & Service Connections | OLY24",
      plumbing: "Plumbing Service Connections | OLY24",
      "frozen-pipes": "Frozen Pipe Help | OLY24",
      "water-leaks": "Water Leak Support | OLY24"
    };
    document.title = titles[route] || titles.home;
    const descriptions: Record<string, string> = {
      home: "Explore heating and plumbing service connections with independent providers. Check options by US ZIP code.",
      heating: "Furnace not working, blowing cold air, or not turning on? Learn common symptoms and safe first checks, then explore local heating service connections.",
      plumbing: "Explore connections with independent plumbing service providers for common plumbing concerns in your area.",
      "frozen-pipes": "Learn what to do about suspected frozen pipes and explore connections with independent plumbing providers in your area.",
      "water-leaks": "Learn practical first steps for a water leak and explore connections with independent plumbing providers in your area.",
      privacy: "Read how OLY24 handles information submitted through its home service connection website."
    };
    let description = document.querySelector('meta[name="description"]');
    if (!description) {
      description = document.createElement("meta");
      description.setAttribute("name", "description");
      document.head.appendChild(description);
    }
    description.setAttribute("content", descriptions[route] || descriptions.home);
    trackEvent("page_view", { page: route });
  }, [route]);

  return <><Header />{route === "home" ? <HomePage /> : route === "privacy" ? <PrivacyPage /> : route === "heating" ? <HeatingLanding /> : <ServiceLanding service={route as ServiceKey} />}<Footer /><CookieConsent /></>;
}