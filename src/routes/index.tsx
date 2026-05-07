import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Download, Shield, Zap, Database, Target, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Aegon Hitter — One-click QA Card AutoFill" },
      {
        name: "description",
        content:
          "Save BINs once, click START, and AutoFill Luhn-valid test cards into your sandbox checkout — for QA engineers.",
      },
      { property: "og:title", content: "Aegon Hitter — QA Card AutoFill" },
      {
        property: "og:description",
        content:
          "One-click test card AutoFill from saved BINs. QA, sandbox, and demo environments only.",
      },
    ],
  }),
});

function Index() {
  const handleDownload = () => {
    fetch("/aegon-hitter.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "aegon-hitter.zip";
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Download started");
      })
      .catch((err) => toast.error(err.message));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060a] text-slate-100 font-mono">
      {/* Grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse at top, black 30%, transparent 80%)",
        }}
      />
      {/* Glow blobs */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="pointer-events-none absolute top-40 -right-20 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <main className="relative mx-auto max-w-4xl px-6 py-16">
        {/* Hero */}
        <header className="text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/5 px-3 py-1 text-[10px] tracking-[0.3em] text-fuchsia-300">
            <Shield className="h-3 w-3" />
            QA / SANDBOX ONLY · v2.0.0
          </div>
          <h1
            className="bg-gradient-to-r from-cyan-300 via-cyan-200 to-fuchsia-300 bg-clip-text text-5xl font-bold tracking-[0.18em] text-transparent md:text-7xl"
            style={{ filter: "drop-shadow(0 0 24px rgba(34,211,238,0.4))" }}
          >
            AEGON<span className="ml-2 text-fuchsia-300">HITTER</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-400">
            One-click test card autofill for QA engineers. Save your BINs,
            pick the active one, hit START — Luhn-valid cards land in your
            sandbox checkout instantly.
          </p>
          <div className="mt-8">
            <button
              onClick={handleDownload}
              className="group relative inline-flex items-center gap-3 rounded-md bg-gradient-to-r from-cyan-400 to-fuchsia-400 px-8 py-4 text-sm font-bold uppercase tracking-[0.3em] text-[#05060a] shadow-[0_0_40px_rgba(34,211,238,0.5)] transition-all hover:shadow-[0_0_60px_rgba(240,171,252,0.7)]"
            >
              <Download className="h-4 w-4" />
              Download Extension
            </button>
          </div>
        </header>

        {/* Workflow */}
        <section className="mt-24">
          <h2 className="mb-8 text-center text-xs tracking-[0.4em] text-cyan-300">
            ── WORKFLOW ──
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Database,
                step: "01",
                title: "SAVE YOUR BINS",
                body: "Add BIN patterns with labels (Visa Sandbox, Stripe Test, etc.) and card length 13–19.",
              },
              {
                icon: Target,
                step: "02",
                title: "PICK ACTIVE BIN",
                body: "Select which saved BIN to fire next. Switch instantly between sandboxes.",
              },
              {
                icon: Zap,
                step: "03",
                title: "HIT START",
                body: "One click generates a Luhn-valid card and AutoFills the active page's payment fields.",
              },
            ].map(({ icon: Icon, step, title, body }) => (
              <div
                key={step}
                className="group relative rounded-md border border-cyan-500/30 bg-cyan-500/5 p-5 transition-all hover:border-cyan-400 hover:bg-cyan-500/10 hover:shadow-[0_0_24px_rgba(34,211,238,0.3)]"
              >
                <div className="absolute right-3 top-3 text-[10px] tracking-[0.3em] text-cyan-400/60">
                  {step}
                </div>
                <Icon className="mb-3 h-6 w-6 text-cyan-300" />
                <h3 className="mb-2 text-xs font-bold tracking-[0.2em] text-cyan-200">
                  {title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Install */}
        <section className="mt-20">
          <h2 className="mb-6 text-center text-xs tracking-[0.4em] text-fuchsia-300">
            ── INSTALL ──
          </h2>
          <div className="rounded-md border border-fuchsia-500/30 bg-fuchsia-500/5 p-6">
            <ol className="space-y-4 text-sm text-slate-300">
              {[
                <>Unzip the downloaded <code className="rounded bg-black/40 px-1.5 py-0.5 text-cyan-300">aegon-hitter.zip</code> file.</>,
                <>Open <code className="rounded bg-black/40 px-1.5 py-0.5 text-cyan-300">chrome://extensions</code> in Chrome (or any Chromium browser).</>,
                <>Enable <strong className="text-fuchsia-300">Developer mode</strong> in the top-right corner.</>,
                <>Click <strong className="text-fuchsia-300">Load unpacked</strong> and select the unzipped folder.</>,
              ].map((node, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-bold text-fuchsia-400">
                    0{i + 1}
                  </span>
                  <span>{node}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mt-16">
          <div className="flex gap-3 rounded-md border border-red-500/40 bg-red-500/5 p-5">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div className="space-y-2 text-xs leading-relaxed text-slate-400">
              <p>
                <strong className="text-red-300 tracking-[0.2em]">
                  QA / SANDBOX / DEMO ONLY.
                </strong>{" "}
                Aegon Hitter generates Luhn-valid test card numbers. They are
                <em> not</em> real payment instruments and cannot be used for
                actual transactions.
              </p>
              <p>
                The extension <strong className="text-slate-200">never auto-submits</strong>{" "}
                payments or clicks pay buttons — it only fills detected form
                fields. Do not use on real payment pages or for any
                fraudulent purpose.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-12 text-center text-[10px] tracking-[0.3em] text-slate-600">
          AEGON HITTER · v2.0.0 · QA-ONLY BUILD
        </footer>
      </main>
    </div>
  );
}
