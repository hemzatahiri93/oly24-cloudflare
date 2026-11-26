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

const heatingFirstSteps = [
  {
    title: "Thermostat",
    text: "Set it to Heat and choose a temperature above the current room temperature. Check the batteries if the display is blank."
  },
  {
    title: "Air filter",
    text: "Look for visible dust buildup. Replace a clogged filter with the correct type and size, following the equipment instructions."
  },
  {
    title: "Power and access panel",
    text: "Check the accessible furnace power switch and make sure the external access panel is properly seated. If a breaker trips again, do not keep resetting it."
  }
];

const heatingFaqs = [
  {
    q: "Why is my furnace not producing heat?",
    a: "A dirty or clogged filter is a common possibility, alongside potential factors like a pilot-light or ignition issue, safety switch, fuel supply, or thermostat settings. Start with safe basic checks, and arrange a qualified HVAC technician if heating does not return."
  },
  {
    q: "What should I do if my heating system stops working?",
    a: "Check that the thermostat is set to Heat above room temperature, and inspect the accessible power switch, access panel, breaker, and air filter if safe to do so. If heat does not return—or if you notice any safety warning signs—seek qualified help immediately."
  },
  {
    q: "What happens if I keep running a furnace that is short cycling or making strange noises?",
    a: "Frequent cycling or unusual noises can add wear on components, strain airflow or heat-exchange parts, increase energy or fuel use, or lead to a bigger breakdown. Schedule a professional check rather than ignoring ongoing symptoms."
  },
  {
    q: "Why does my furnace start and then stop?",
    a: "Short cycling can be associated with airflow restrictions, overheating safety shut-offs, or a component issue. Check if the filter is visibly blocked, avoid bypassing safety controls, and have a qualified technician inspect the system if it repeats."
  },
  {
    q: "What if my heat pump runs but does not heat?",
    a: "If a heat pump runs without warming your home, basic checks like thermostat mode and airflow may help rule out simple issues, while underlying system causes require a qualified heating technician to evaluate."
  }
];

const heatingMediaSlots = {
  inspectionPhoto: {
    src: "",
    alt: "Technician inspecting a home heating system",
    label: "Heating system inspection image slot — set heatingMediaSlots.inspectionPhoto.src"
  },
  filterPhoto: {
    src: "",
    alt: "HVAC air filter check for home heating maintenance",
    label: "HVAC filter check image slot — set heatingMediaSlots.filterPhoto.src"
  }
};

function HeatingMediaFrame({
  src,
  alt,
  label
}: {
  src: string;
  alt: string;
  label: string;
}) {
  return (
    <figure className="heating-media-slot">
      {src ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      ) : (
        <div className="heating-media-placeholder" aria-label={alt}>
          <span className="heating-media-badge">IMAGE SLOT READY</span>
          <p>{label}</p>
        </div>
      )}
    </figure>
  );
}

function HeatingLanding() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  function toggleFaq(idx: number) {
    setOpenFaqIndex(current => (current === idx ? null : idx));
  }

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
        <div className="section-heading">
          <div><span className="eyebrow">FIND YOUR ISSUE</span><h2>What is your heating system doing?</h2></div>
          <p>Review common heating issues and possible causes. Left unchecked, airflow limits, component wear, and unaddressed faults can raise fuel or energy bills and increase breakdown risk.</p>
        </div>
        <div className="heating-problem-grid">
          {heatingProblems.map(problem => (
            <article className="heating-problem-card" key={problem.title}>
              <h3>{problem.title}</h3>
              <p>{problem.symptom}</p>
              <div className="possible-causes"><b>Possible causes</b><p>{problem.causes}</p></div>
            </article>
          ))}
        </div>
        <HeatingMediaFrame
          src={heatingMediaSlots.inspectionPhoto.src}
          alt={heatingMediaSlots.inspectionPhoto.alt}
          label={heatingMediaSlots.inspectionPhoto.label}
        />
      </div>
    </section>

    <section className="section-pad heating-first-steps">
      <div className="container">
        <div className="section-heading">
          <div><span className="eyebrow">SAFE FIRST CHECKS</span><h2>Before you request heating help</h2></div>
          <p>Only perform simple checks that you can do safely. Do not open sealed equipment compartments or attempt gas or electrical repairs.</p>
        </div>
        <div className="first-step-grid">
          {heatingFirstSteps.map(step => (
            <article key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
        <HeatingMediaFrame
          src={heatingMediaSlots.filterPhoto.src}
          alt={heatingMediaSlots.filterPhoto.alt}
          label={heatingMediaSlots.filterPhoto.label}
        />
        <div className="heating-safety-alert">
          <Siren size={26}/>
          <div><b>Smell gas, suspect carbon monoxide, or see smoke?</b><p>Do not operate electrical switches or use flames. Leave immediately. From a safe location, call emergency services or your gas provider. Do not re-enter until authorities say it is safe.</p></div>
        </div>
      </div>
    </section>

    <section className="heating-faq-section section-pad">
      <div className="container heating-faq-layout">
        <div>
          <span className="eyebrow">QUICK ANSWERS</span>
          <h2>Heating questions</h2>
          <p>Still unsure what may be happening? Select a question to view a general answer, or explore independent heating service options in your area.</p>
          <a href="#service-request" className="text-link">Find heating options in your area <ArrowUpRight size={17}/></a>
        </div>
        <div className="heating-faq-list" role="region" aria-label="Heating frequently asked questions">
          {heatingFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div className={`heating-faq-item ${isOpen ? "is-open" : ""}`} key={faq.q}>
                <button
                  type="button"
                  className="heating-faq-trigger"
                  aria-expanded={isOpen}
                  onClick={() => toggleFaq(idx)}
                >
                  <span>{faq.q}</span>
                  <span className="heating-faq-sign" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="heating-faq-panel">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
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

const plumbingProblems = [
  {
    title: "Clogged or Slow Drains",
    symptom: "Standing water in sinks, tubs, or showers, slow drainage, or gurgling sounds from pipes.",
    causes: "Gradual buildup of hair, soap scum, kitchen grease, coffee grounds, or tree roots in main sewer lines."
  },
  {
    title: "Running or Leaking Toilet",
    symptom: "Toilet runs continuously after flushing or cycles on and off on its own, wasting water.",
    causes: "Worn flapper valve failing to seal, misadjusted float level, or a defective fill valve."
  },
  {
    title: "Dripping Faucets & Fixtures",
    symptom: "Constant drip or steady trickle of water from a faucet spout or showerhead.",
    causes: "Worn rubber washer, damaged cartridge, deteriorated O-ring, or corroded valve seat."
  },
  {
    title: "Low Water Pressure",
    symptom: "Weak water flow from one fixture, showerhead, or across the whole home.",
    causes: "Mineral sediment in aerators or showerheads, partially closed shut-off valve, hidden leaks, or a faulty pressure regulator."
  },
  {
    title: "Water Heater Not Producing Hot Water",
    symptom: "Cold or barely warm tap water, hot water running out fast, or water not reaching full temperature.",
    causes: "Unlit gas pilot light, tripped breaker or red reset button, burned-out elements, heavy tank sediment, or a broken dip tube."
  },
  {
    title: "Hidden Pipe Leaks",
    symptom: "Unexplained higher water bills, damp spots on walls or ceilings, mold growth, or musty odors.",
    causes: "Line corrosion, overtightened fittings developing hairline fractures, failing connections, or water hammer pressure shocks."
  }
];

const plumbingFirstSteps = [
  {
    title: "Shut-off valves",
    text: "Close the local fixture valve or main home water shut-off valve right away if a leak or burst pipe threatens water damage."
  },
  {
    title: "Single fixture vs. whole home",
    text: "Test multiple taps and drains to see if slow flow or low pressure affects one spot or the entire house."
  },
  {
    title: "Aerators & water heater controls",
    text: "Rinse mineral buildup from aerators using simple mechanical tools, and check gas/breaker/reset status and a safe 120°F dial setting on the water heater."
  }
];

const plumbingFaqs = [
  {
    q: "Why is my water pressure suddenly low?",
    a: "Sudden low pressure can stem from a partially closed shut-off valve, mineral buildup in aerators or showerheads, a failing pressure regulator, hidden pipe leaks, or municipal supply issues. Check whether it affects one fixture or the whole house, and contact a licensed plumber if basic checks do not restore flow."
  },
  {
    q: "What should I do if a pipe or water heater starts leaking?",
    a: "Shut off the water at the fixture or main valve immediately, and turn off power or gas to a leaking water heater. Open nearby taps to relieve line pressure, wipe up standing water promptly to help limit mold and structural damage, and call a licensed plumber for assessment and repair."
  },
  {
    q: "Why do plumbers advise against using chemical drain cleaners for clogs?",
    a: "Caustic drain cleaners can generate intense heat that warps PVC pipes, weakens glued joints, or corrodes metal lines from within, while leaving hazardous chemicals trapped if a clog persists. Safer options include a plunger, barbed plastic drain tool, enzyme cleaner, or baking soda and vinegar."
  }
];

const plumbingMediaSlots = {
  inspectionPhoto: {
    src: "",
    alt: "Plumber checking home plumbing lines and fixtures",
    label: "Plumbing inspection image slot — set plumbingMediaSlots.inspectionPhoto.src"
  },
  fixturePhoto: {
    src: "",
    alt: "Home water shut-off valve and sink plumbing check",
    label: "Plumbing shut-off and fixture image slot — set plumbingMediaSlots.fixturePhoto.src"
  }
};

function PlumbingLanding() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  function toggleFaq(idx: number) {
    setOpenFaqIndex(current => (current === idx ? null : idx));
  }

  return <>
    <section className="service-hero heating-hero">
      <div className="container service-hero-inner">
        <div className="service-hero-copy">
          <span className="eyebrow eyebrow-light">HOME PLUMBING • SERVICE CONNECTIONS</span>
          <h1>Toilet won't stop running, low water pressure, or slow drains?</h1>
          <p>Review common plumbing problems, safe first checks, and general answers, then explore connections with independent plumbing service providers in your area.</p>
          <div className="hero-actions">
            <a className="button button-orange" href="#service-request" onClick={() => trackEvent("plumbing_zip_cta_click")}>Check your ZIP code <ArrowRight size={18} /></a>
            <PhoneAction />
          </div>
          <div className="heating-hero-tags"><span>Toilet won't stop running</span><span>Low water pressure in house</span><span>Sink draining slowly</span></div>
        </div>
        <div className="service-hero-icon"><Wrench size={112} strokeWidth={1.2} /></div>
      </div>
    </section>

    <section className="heating-quick section-pad">
      <div className="container">
        <div className="section-heading">
          <div><span className="eyebrow">COMMON PLUMBING PROBLEMS</span><h2>What plumbing issue are you seeing?</h2></div>
          <p>Delaying repairs or using harsh chemical cleaners can worsen leaks, structural moisture damage, pipe wear, or tank and line failures.</p>
        </div>
        <div className="heating-problem-grid">
          {plumbingProblems.map(problem => (
            <article className="heating-problem-card" key={problem.title}>
              <h3>{problem.title}</h3>
              <p>{problem.symptom}</p>
              <div className="possible-causes"><b>Possible causes</b><p>{problem.causes}</p></div>
            </article>
          ))}
        </div>
        <HeatingMediaFrame
          src={plumbingMediaSlots.inspectionPhoto.src}
          alt={plumbingMediaSlots.inspectionPhoto.alt}
          label={plumbingMediaSlots.inspectionPhoto.label}
        />
      </div>
    </section>

    <section className="section-pad heating-first-steps">
      <div className="container">
        <div className="section-heading">
          <div><span className="eyebrow">SAFE FIRST STEPS FOR HOMEOWNERS</span><h2>Before you request plumbing help</h2></div>
          <p>Take simple, safe steps first and avoid overtightening fittings, harsh drain chemicals, or risky DIY repairs on pressurized or gas-connected equipment.</p>
        </div>
        <div className="first-step-grid">
          {plumbingFirstSteps.map(step => (
            <article key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
        <HeatingMediaFrame
          src={plumbingMediaSlots.fixturePhoto.src}
          alt={plumbingMediaSlots.fixturePhoto.alt}
          label={plumbingMediaSlots.fixturePhoto.label}
        />
        <div className="heating-safety-alert">
          <Siren size={26}/>
          <div><b>Severe leak, flooding near electricity, or gas/water hazard?</b><p>Shut off the water supply or power if safe to do so, move away from hazards, and contact emergency services or qualified help immediately.</p></div>
        </div>
      </div>
    </section>

    <section className="heating-faq-section section-pad">
      <div className="container heating-faq-layout">
        <div>
          <span className="eyebrow">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Plumbing questions</h2>
          <p>Find general answers to common plumbing questions or check independent service options by ZIP code.</p>
          <a href="#service-request" className="text-link">Find plumbing options in your area <ArrowUpRight size={17}/></a>
        </div>
        <div className="heating-faq-list" role="region" aria-label="Plumbing frequently asked questions">
          {plumbingFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div className={`heating-faq-item ${isOpen ? "is-open" : ""}`} key={faq.q}>
                <button
                  type="button"
                  className="heating-faq-trigger"
                  aria-expanded={isOpen}
                  onClick={() => toggleFaq(idx)}
                >
                  <span>{faq.q}</span>
                  <span className="heating-faq-sign" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="heating-faq-panel">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>

    <section className="request-section section-pad">
      <div className="container request-layout">
        <div className="request-copy"><span className="eyebrow">FIND LOCAL OPTIONS</span><h2>Need plumbing help<br/><em>in your area?</em></h2><p>Enter your US ZIP code and describe the plumbing issue. OLY24 helps visitors explore connections with independent service providers. Availability varies by location.</p><div className="request-assurance"><CheckCircle2 /> Start with your ZIP code and issue.</div><TrustNote /></div>
        <LeadForm defaultService="Plumbing"/>
      </div>
    </section>
    <section className="bottom-cta"><div className="container bottom-cta-inner"><div><span className="eyebrow eyebrow-light">OLY24 • PLUMBING CONNECTIONS</span><h2>Take the next step on plumbing.</h2></div><a href="#service-request" className="button button-orange">Check your ZIP code <ArrowRight size={18}/></a></div></section>
  </>;
}

const frozenPipesProblems = [
  {
    title: "No Water or Only a Trickle in Cold Weather",
    symptom: "Turning on a sink, shower, or faucet in subfreezing weather produces no water or a slow trickle.",
    causes: "Standing water inside exposed or poorly insulated supply lines freezes into a solid ice plug blocking flow."
  },
  {
    title: "Frozen Pipe in an Exterior Wall or Crawl Space",
    symptom: "Loss of water pressure at specific fixtures, frost on visible pipes, or damp spots on nearby walls or ceilings.",
    causes: "Cold outdoor air entering through unsealed drafts, unheated crawl spaces, or exterior wall cavities freezes stagnant water."
  },
  {
    title: "Frozen Outdoor Faucet (Hose Bib / Spigot)",
    symptom: "Jammed exterior spigot handle or inability to draw water from an outdoor tap during winter.",
    causes: "A connected garden hose traps water inside the spigot shaft or supply line, freezing and expanding behind the wall."
  },
  {
    title: "Burst Pipe Emergency",
    symptom: "Loud noises or water spraying inside wall cavities, rapid room flooding, standing water, or ceiling damage.",
    causes: "Freezing water expands by about 9% and builds intense hydraulic pressure between the ice blockage and closed faucets until the pipe splits."
  },
  {
    title: "Pipe Leak Appearing After Thawing",
    symptom: "Fresh dripping, damp patches, or active leaks near plumbing lines once indoor or outdoor temperatures rise.",
    causes: "An ice plug temporarily sealed hidden cracks in the pipe until thawing allowed pressurized water to escape."
  }
];

const frozenPipesFirstSteps = [
  {
    title: "Open affected faucets & shut-off valve",
    text: "Keep hot and cold taps on the frozen line open to relieve pressure. If a burst is suspected or water leaks, shut off the main water supply valve immediately."
  },
  {
    title: "Circulate warm air",
    text: "Open sink cabinet and interior doors so warm household air reaches vulnerable pipes, keeping your thermostat at 55°F or higher day and night."
  },
  {
    title: "Apply safe, gentle heat",
    text: "Use a handheld hair dryer on low, heating pad, or warm towels on accessible pipe starting near the faucet—never open flames. Stop and call a plumber if pipes are hidden, cracked, or leaking."
  }
];

const frozenPipesFaqs = [
  {
    q: "How do I know if my pipes are frozen?",
    a: "Little to no water coming out of a faucet during subfreezing weather is the main sign. You may also see frost on exposed pipes, hear gurgling or clunking sounds, notice a toilet tank failing to refill, or see misshapen spots on pipes in unheated basements, garages, or crawl spaces."
  },
  {
    q: "What should I do immediately if a frozen pipe bursts?",
    a: "Turn off your home's main water shut-off valve right away to stop incoming water. Shut off electricity at the main breaker if water is near outlets or wiring, turn off your boiler or water heater, open lower-level taps to drain residual pressure, and contact a licensed emergency plumber."
  },
  {
    q: "Does letting a faucet drip really help prevent frozen pipes?",
    a: "Yes. Running a small, continuous trickle from a faucet on an exterior wall keeps water moving and relieves hydraulic pressure between minor ice blockages and closed taps. Maintain a slight drip across both hot and cold lines until subfreezing weather passes."
  }
];

const frozenPipesMediaSlots = {
  inspectionPhoto: {
    src: "",
    alt: "Inspecting exposed home water pipes during freezing temperatures",
    label: "Frozen pipe inspection image slot — set frozenPipesMediaSlots.inspectionPhoto.src"
  },
  shutoffPhoto: {
    src: "",
    alt: "Main home water shut-off valve and indoor pipe protection",
    label: "Main shut-off valve image slot — set frozenPipesMediaSlots.shutoffPhoto.src"
  }
};

function FrozenPipesLanding() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  function toggleFaq(idx: number) {
    setOpenFaqIndex(current => (current === idx ? null : idx));
  }

  return <>
    <section className="service-hero heating-hero">
      <div className="container service-hero-inner">
        <div className="service-hero-copy">
          <span className="eyebrow eyebrow-light">FROZEN PIPES • URGENT PLUMBING</span>
          <h1>No water in freezing weather or worried about a burst pipe?</h1>
          <p>Review common frozen and burst pipe signs, safe first checks, and general answers, then explore connections with independent plumbing service providers in your area.</p>
          <div className="hero-actions">
            <a className="button button-orange" href="#service-request" onClick={() => trackEvent("frozen_pipes_zip_cta_click")}>Check your ZIP code <ArrowRight size={18} /></a>
            <PhoneAction />
          </div>
          <div className="heating-hero-tags"><span>No water in freezing weather</span><span>Safe way to thaw pipes</span><span>Leak after pipe thaws</span></div>
        </div>
        <div className="service-hero-icon"><Snowflake size={112} strokeWidth={1.2} /></div>
      </div>
    </section>

    <section className="heating-quick section-pad">
      <div className="container">
        <div className="section-heading">
          <div><span className="eyebrow">FROZEN & BURST PIPE PROBLEMS</span><h2>What are you noticing in your plumbing?</h2></div>
          <p>Delaying action or using open flames to thaw pipes risks sudden pipe rupture, flooding, structural mold, fire hazards, and electrical shock.</p>
        </div>
        <div className="heating-problem-grid">
          {frozenPipesProblems.map(problem => (
            <article className="heating-problem-card" key={problem.title}>
              <h3>{problem.title}</h3>
              <p>{problem.symptom}</p>
              <div className="possible-causes"><b>Possible causes</b><p>{problem.causes}</p></div>
            </article>
          ))}
        </div>
        <HeatingMediaFrame
          src={frozenPipesMediaSlots.inspectionPhoto.src}
          alt={frozenPipesMediaSlots.inspectionPhoto.alt}
          label={frozenPipesMediaSlots.inspectionPhoto.label}
        />
      </div>
    </section>

    <section className="section-pad heating-first-steps">
      <div className="container">
        <div className="section-heading">
          <div><span className="eyebrow">SAFE FIRST STEPS FOR HOMEOWNERS</span><h2>Before you request frozen pipe help</h2></div>
          <p>Take safe steps to relieve pressure and warm accessible lines gently. Never use blowtorches, propane torches, or open flames on pipes.</p>
        </div>
        <div className="first-step-grid">
          {frozenPipesFirstSteps.map(step => (
            <article key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
        <HeatingMediaFrame
          src={frozenPipesMediaSlots.shutoffPhoto.src}
          alt={frozenPipesMediaSlots.shutoffPhoto.alt}
          label={frozenPipesMediaSlots.shutoffPhoto.label}
        />
        <div className="heating-safety-alert">
          <Siren size={26}/>
          <div><b>Pipe burst, active flooding, or water near electrical wiring?</b><p>Shut off the main water valve immediately, turn off power at the main breaker if water is near electrical fixtures or outlets, and contact emergency services or qualified help right away.</p></div>
        </div>
      </div>
    </section>

    <section className="heating-faq-section section-pad">
      <div className="container heating-faq-layout">
        <div>
          <span className="eyebrow">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Frozen pipe questions</h2>
          <p>Find general answers about frozen or burst pipes, or explore independent local plumbing providers by ZIP code.</p>
          <a href="#service-request" className="text-link">Find plumbing options in your area <ArrowUpRight size={17}/></a>
        </div>
        <div className="heating-faq-list" role="region" aria-label="Frozen pipes frequently asked questions">
          {frozenPipesFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div className={`heating-faq-item ${isOpen ? "is-open" : ""}`} key={faq.q}>
                <button
                  type="button"
                  className="heating-faq-trigger"
                  aria-expanded={isOpen}
                  onClick={() => toggleFaq(idx)}
                >
                  <span>{faq.q}</span>
                  <span className="heating-faq-sign" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="heating-faq-panel">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>

    <section className="request-section section-pad">
      <div className="container request-layout">
        <div className="request-copy"><span className="eyebrow">FIND LOCAL OPTIONS</span><h2>Need frozen pipe help<br/><em>in your area?</em></h2><p>Enter your US ZIP code and describe the issue. OLY24 helps visitors explore connections with independent service providers. Availability varies by location.</p><div className="request-assurance"><CheckCircle2 /> Start with your ZIP code and issue.</div><TrustNote /></div>
        <LeadForm defaultService="Frozen pipes"/>
      </div>
    </section>
    <section className="bottom-cta"><div className="container bottom-cta-inner"><div><span className="eyebrow eyebrow-light">OLY24 • FROZEN PIPE CONNECTIONS</span><h2>Take the next step on frozen pipes.</h2></div><a href="#service-request" className="button button-orange">Check your ZIP code <ArrowRight size={18}/></a></div></section>
  </>;
}

const waterLeaksProblems = [
  {
    title: "Unexplained High Water Bill (Silent Leak)",
    symptom: "A sudden spike or steady climb in your monthly water bill despite normal daily water usage.",
    causes: "Continuous trickling from toilet flappers, leaking underground service lines, pinhole leaks behind walls, or unseen slab leaks."
  },
  {
    title: "Water Leak Behind a Wall or Ceiling",
    symptom: "Dark moisture patches, yellowing ceiling stains, bubbling paint, soft drywall, or faint dripping and hissing inside walls.",
    causes: "Aging pressurized supply pipe joint cracks, pinhole leaks in wall plumbing, or failed tub overflow gaskets and toilet wax rings above."
  },
  {
    title: "Under-Sink or Fixture Leak",
    symptom: "Dampness inside vanity cabinets, dark water spots, swollen wood bases, or dripping around faucet stems and drain assemblies.",
    causes: "Loose or corroded shutoff valve nuts, degraded rubber seals, or flexible supply lines past their 10-year service life."
  },
  {
    title: "Slab Leak Under Concrete Foundation",
    symptom: "Unusually warm spots on floor tiles, damp carpets, low house water pressure, or rushing water sounds with all taps closed.",
    causes: "Corrosion of buried galvanized steel or copper piping, high municipal water pressure stress, and soil movement beneath the slab."
  },
  {
    title: "Running or Silently Leaking Toilet",
    symptom: "Toilet tank refilling on its own or ongoing water loss on your bill while the floor around the toilet stays dry.",
    causes: "Dirty, mineral-encrusted, or deformed rubber flapper valve letting water trickle silently from the tank into the bowl."
  }
];

const waterLeaksFirstSteps = [
  {
    title: "Water meter & toilet dye tests",
    text: "Turn off all taps and water-using appliances to see if the water meter's low-flow indicator moves, or add 7–10 drops of food coloring to the toilet tank for 15–20 minutes without flushing."
  },
  {
    title: "Under-sink dry paper towel check",
    text: "Wipe a dry paper towel along flexible supply hoses, shutoff valves, drain traps, and cabinet floors to spot subtle moisture or slow drips."
  },
  {
    title: "Isolate fixture or main shutoff valve",
    text: "Close the local fixture shutoff valve clockwise—or shut off the main house valve—if active dripping or leaking occurs while contacting a licensed plumber."
  }
];

const waterLeaksFaqs = [
  {
    q: "How can I tell if I have a hidden water leak using my water meter?",
    a: "Turn off every faucet, shower, appliance, and irrigation line on your property. Check your water meter's low-flow indicator (a small triangle, star, or digital leak icon) and note the odometer reading; if the dial spins or numbers advance after 10 to 60 minutes with no water running, water is escaping in your system."
  },
  {
    q: "What are the early warning signs of a slab leak under my floor?",
    a: "Early warning signs include unexplained warm spots on floor tiles, damp carpets, dark moisture along floor edges, musty odors, small foundation cracks, the sound of running or hissing water when fixtures are closed, or a sudden jump in your monthly water bill."
  },
  {
    q: "How do I check if my toilet is silently leaking water?",
    a: "Remove the tank lid and add 7 to 10 drops of food coloring or a dye tablet into the tank water. Leave the toilet unflushed for 15 to 20 minutes; if colored water appears in the bowl, the rubber flapper valve is worn and needs replacement."
  }
];

const waterLeaksMediaSlots = {
  inspectionPhoto: {
    src: "",
    alt: "Inspecting household plumbing and water meter for hidden water leaks",
    label: "Water leak inspection image slot — set waterLeaksMediaSlots.inspectionPhoto.src"
  },
  shutoffPhoto: {
    src: "",
    alt: "Under-sink supply lines and water shut-off valve inspection",
    label: "Under-sink shutoff valve image slot — set waterLeaksMediaSlots.shutoffPhoto.src"
  }
};

function WaterLeaksLanding() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  function toggleFaq(idx: number) {
    setOpenFaqIndex(current => (current === idx ? null : idx));
  }

  return <>
    <section className="service-hero heating-hero">
      <div className="container service-hero-inner">
        <div className="service-hero-copy">
          <span className="eyebrow eyebrow-light">WATER LEAKS • URGENT PLUMBING</span>
          <h1>Unexplained high water bill, ceiling stain, or hidden leak?</h1>
          <p>Review common water leak signs, safe non-invasive checks, and general answers, then explore connections with independent plumbing service providers in your area.</p>
          <div className="hero-actions">
            <a className="button button-orange" href="#service-request" onClick={() => trackEvent("water_leaks_zip_cta_click")}>Check your ZIP code <ArrowRight size={18} /></a>
            <PhoneAction />
          </div>
          <div className="heating-hero-tags"><span>Unexplained high water bill</span><span>Warm spots on tile floor</span><span>Water stain on ceiling</span></div>
        </div>
        <div className="service-hero-icon"><Droplets size={112} strokeWidth={1.2} /></div>
      </div>
    </section>

    <section className="heating-quick section-pad">
      <div className="container">
        <div className="section-heading">
          <div><span className="eyebrow">COMMON WATER LEAK PROBLEMS</span><h2>What leak signs are you noticing?</h2></div>
          <p>Delaying leak repairs risks mold growth within 24 to 48 hours, structural wood rot, electrical hazards, and escalating restoration and water costs.</p>
        </div>
        <div className="heating-problem-grid">
          {waterLeaksProblems.map(problem => (
            <article className="heating-problem-card" key={problem.title}>
              <h3>{problem.title}</h3>
              <p>{problem.symptom}</p>
              <div className="possible-causes"><b>Possible causes</b><p>{problem.causes}</p></div>
            </article>
          ))}
        </div>
        <HeatingMediaFrame
          src={waterLeaksMediaSlots.inspectionPhoto.src}
          alt={waterLeaksMediaSlots.inspectionPhoto.alt}
          label={waterLeaksMediaSlots.inspectionPhoto.label}
        />
      </div>
    </section>

    <section className="section-pad heating-first-steps">
      <div className="container">
        <div className="section-heading">
          <div><span className="eyebrow">SAFE FIRST STEPS FOR HOMEOWNERS</span><h2>Before you request water leak help</h2></div>
          <p>Stick to safe, non-invasive checks. Avoid tearing open drywall, breaking concrete slabs, soldering copper lines, or checking plumbing near wet electrical panels.</p>
        </div>
        <div className="first-step-grid">
          {waterLeaksFirstSteps.map(step => (
            <article key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
        <HeatingMediaFrame
          src={waterLeaksMediaSlots.shutoffPhoto.src}
          alt={waterLeaksMediaSlots.shutoffPhoto.alt}
          label={waterLeaksMediaSlots.shutoffPhoto.label}
        />
        <div className="heating-safety-alert">
          <Siren size={26}/>
          <div><b>Active leak near outlets, switches, or an electrical panel?</b><p>Shut off the local or main water valve if safe, stay clear of wet electrical equipment, and contact emergency services or qualified help immediately.</p></div>
        </div>
      </div>
    </section>

    <section className="heating-faq-section section-pad">
      <div className="container heating-faq-layout">
        <div>
          <span className="eyebrow">FREQUENTLY ASKED QUESTIONS</span>
          <h2>Water leak questions</h2>
          <p>Find general answers about hidden leaks, slab leaks, and silent toilet leaks, or check independent plumbing providers by ZIP code.</p>
          <a href="#service-request" className="text-link">Find plumbing options in your area <ArrowUpRight size={17}/></a>
        </div>
        <div className="heating-faq-list" role="region" aria-label="Water leaks frequently asked questions">
          {waterLeaksFaqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div className={`heating-faq-item ${isOpen ? "is-open" : ""}`} key={faq.q}>
                <button
                  type="button"
                  className="heating-faq-trigger"
                  aria-expanded={isOpen}
                  onClick={() => toggleFaq(idx)}
                >
                  <span>{faq.q}</span>
                  <span className="heating-faq-sign" aria-hidden="true">{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <div className="heating-faq-panel">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>

    <section className="request-section section-pad">
      <div className="container request-layout">
        <div className="request-copy"><span className="eyebrow">FIND LOCAL OPTIONS</span><h2>Need water leak help<br/><em>in your area?</em></h2><p>Enter your US ZIP code and describe the leak issue. OLY24 helps visitors explore connections with independent service providers. Availability varies by location.</p><div className="request-assurance"><CheckCircle2 /> Start with your ZIP code and issue.</div><TrustNote /></div>
        <LeadForm defaultService="Water leak"/>
      </div>
    </section>
    <section className="bottom-cta"><div className="container bottom-cta-inner"><div><span className="eyebrow eyebrow-light">OLY24 • WATER LEAK CONNECTIONS</span><h2>Take the next step on a water leak.</h2></div><a href="#service-request" className="button button-orange">Check your ZIP code <ArrowRight size={18}/></a></div></section>
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

  return <><Header />{route === "home" ? <HomePage /> : route === "privacy" ? <PrivacyPage /> : route === "heating" ? <HeatingLanding /> : route === "plumbing" ? <PlumbingLanding /> : route === "frozen-pipes" ? <FrozenPipesLanding /> : route === "water-leaks" ? <WaterLeaksLanding /> : <ServiceLanding service={route as ServiceKey} />}<Footer /><CookieConsent /></>;
}