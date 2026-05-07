import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, CreditCard, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Luhn Card Generator — Chrome Extension" },
      {
        name: "description",
        content:
          "Free Chrome extension to generate Luhn-valid test card numbers from a BIN. For QA and testing only.",
      },
    ],
  }),
});

function Index() {
  const handleDownload = () => {
    fetch("/luhn-cards.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "luhn-cards.zip";
        a.click();
        URL.revokeObjectURL(a.href);
        toast.success("Download started");
      })
      .catch((err) => toast.error(err.message));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <header className="text-center">
          <div className="mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <CreditCard className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Luhn Card Generator
          </h1>
          <p className="mt-3 text-muted-foreground">
            A Chrome extension that generates Luhn-valid test card numbers from
            a BIN, with matching expiry and CVV.
          </p>
          <div className="mt-6">
            <Button size="lg" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Extension
            </Button>
          </div>
        </header>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">How to install</h2>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>
              <span className="font-medium text-foreground">1.</span> Unzip the
              downloaded <code className="rounded bg-muted px-1.5 py-0.5">luhn-cards.zip</code> file.
            </li>
            <li>
              <span className="font-medium text-foreground">2.</span> Open{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">chrome://extensions</code>{" "}
              in Chrome (or any Chromium browser).
            </li>
            <li>
              <span className="font-medium text-foreground">3.</span> Enable{" "}
              <strong className="text-foreground">Developer mode</strong> in the
              top-right corner.
            </li>
            <li>
              <span className="font-medium text-foreground">4.</span> Click{" "}
              <strong className="text-foreground">Load unpacked</strong> and
              select the unzipped folder.
            </li>
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">How to use</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Click the extension icon, type your starting digits (BIN), pick a
            card length and how many to generate, and hit Generate. Click any
            field to copy it, or export the batch as CSV or TXT.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">AutoFill</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Open a sandbox checkout page, generate a card in the popup, then
            click <strong className="text-foreground">AutoFill</strong> on any
            row (or the top AutoFill button for the first card). The extension
            detects standard payment fields — card number, expiry, CVV, and
            cardholder name — and fills them, dispatching real input and
            change events so React, Vue, and Angular forms register the
            values. If nothing matches, you'll see{" "}
            <em>"No payment form detected."</em>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Cross-origin hosted fields (e.g. Stripe Elements iframes) are
            intentionally not supported.
          </p>
        </section>

        <Card className="mt-10 border-destructive/40">
          <CardContent className="flex gap-3 pt-6">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">For testing and QA only.</strong>{" "}
              These numbers pass the Luhn checksum but are not real cards and
              cannot be used for actual payments. Do not attempt fraudulent use.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
