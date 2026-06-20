"use client";

import { useState, useEffect } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LEGAL_DOCUMENTS, getLegalDocument } from "@/lib/legal-content";
import {
  ArrowLeft,
  FileText,
  ShieldCheck,
  AlertTriangle,
  LifeBuoy,
  Calendar,
  ChevronRight,
} from "lucide-react";

const DOC_ICONS: Record<string, typeof FileText> = {
  conditions: FileText,
  confidentialite: ShieldCheck,
  avertissement: AlertTriangle,
  support: LifeBuoy,
};

const DOC_TONES: Record<string, string> = {
  conditions: "from-violet-500 to-fuchsia-500",
  confidentialite: "from-teal-500 to-emerald-500",
  avertissement: "from-amber-500 to-rose-500",
  support: "from-fuchsia-500 to-violet-500",
};

export function LegalView() {
  const setView = useApp((s) => s.setView);
  const [docSlug, setDocSlug] = useState<string | null>(null);

  // Hydrate from URL ?doc=
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const d = url.searchParams.get("doc");
      if (d && LEGAL_DOCUMENTS.some((doc) => doc.slug === d)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time URL hydration
        setDocSlug(d);
      }
    }
  }, []);

  const setDoc = (slug: string | null) => {
    setDocSlug(slug);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (slug) url.searchParams.set("doc", slug);
      else url.searchParams.delete("doc");
      window.history.replaceState({}, "", url.toString());
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const doc = docSlug ? getLegalDocument(docSlug) : null;

  if (doc) {
    const Icon = DOC_ICONS[doc.slug] || FileText;
    const tone = DOC_TONES[doc.slug] || "from-violet-500 to-fuchsia-500";
    return (
      <article className="container mx-auto max-w-3xl px-4 sm:px-6 py-8 sm:py-12">
        <button
          onClick={() => setDoc(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Tous les documents
        </button>

        <div className="animate-rise">
          <div className={`inline-grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br ${tone} text-white mb-4 shadow-lg`}>
            <Icon className="w-7 h-7" />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold mb-2">{doc.title}</h1>
          <p className="text-lg text-muted-foreground mb-3">{doc.description}</p>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-8 pb-6 border-b border-white/10">
            <Calendar className="w-4 h-4" /> Dernière mise à jour : {doc.lastUpdated}
          </p>

          <div className="space-y-8">
            {doc.sections.map((section, i) => (
              <section key={i}>
                <h2 className="font-display text-xl font-bold mb-3">{section.h2}</h2>
                <div className="space-y-3">
                  {section.paragraphs.map((p, j) => (
                    <p key={j} className="text-foreground/85 leading-relaxed">{p}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-2xl glass p-5 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">Une question sur ce document ?</p>
            <Button size="sm" variant="outline" onClick={() => setDoc("support")}>
              Contacter le support <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </article>
    );
  }

  // Index of legal documents
  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
      <button
        onClick={() => setView("landing")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
      </button>

      <header className="mb-10 max-w-2xl">
        <Badge className="mb-4 bg-violet-500/15 text-violet-200 border border-violet-500/30">
          <FileText className="w-3 h-3 mr-1" /> Légal & Aide
        </Badge>
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold mb-4">
          Documents <span className="text-aurora">légaux & support</span>
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Transparence totale. Tout ce que vous devez savoir sur vos droits, nos responsabilités, et comment
          obtenir de l'aide.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {LEGAL_DOCUMENTS.map((d, i) => {
          const Icon = DOC_ICONS[d.slug] || FileText;
          const tone = DOC_TONES[d.slug] || "from-violet-500 to-fuchsia-500";
          return (
            <button
              key={d.slug}
              onClick={() => setDoc(d.slug)}
              className="text-left glass rounded-2xl p-6 hover:glass-strong hover:-translate-y-1 transition-all group animate-rise"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className={`inline-grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br ${tone} text-white mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h2 className="font-display text-lg font-bold mb-1.5 group-hover:text-aurora transition-colors">{d.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">{d.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {d.lastUpdated}</span>
                <span className="flex items-center gap-1">
                  Lire <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
