"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Gift, Copy, Check, Share2, MessageCircle, Send, Twitter, Sparkles, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { SHARE_TEXTS } from "@/lib/share-texts";

export function FloatingShare() {
  const shareOpen = useApp((s) => s.shareOpen);
  const setShareOpen = useApp((s) => s.setShareOpen);
  const user = useApp((s) => s.user);
  const setView = useApp((s) => s.setView);
  const setAuthMode = useApp((s) => s.setAuthMode);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareText, setShareText] = useState(SHARE_TEXTS[0].text);
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe mount flag
  useEffect(() => setMounted(true), []);

  // Le lien de parrainage : si pas connecté, on renvoie vers l'accueil avec un placeholder
  const referralCode = user?.referralCode || "DECOUVRIR";
  const referralLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/?ref=${referralCode}`
      : `https://arbitech.app/?ref=${referralCode}`;

  const rotateText = () => {
    const next = SHARE_TEXTS[Math.floor(Math.random() * SHARE_TEXTS.length)];
    setShareText(next.text);
  };

  const copyAll = async () => {
    const fullText = `${shareText}\n\n${referralLink}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success("Message copié ! Collez-le où vous voulez.");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier. Copiez le texte manuellement.");
    }
  };

  const shareVia = (channel: "whatsapp" | "telegram" | "twitter") => {
    const fullText = `${shareText}\n\n${referralLink}`;
    const encoded = encodeURIComponent(fullText);
    let url = "";
    if (channel === "whatsapp") url = `https://wa.me/?text=${encoded}`;
    if (channel === "telegram") url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
    if (channel === "twitter") url = `https://twitter.com/intent/tweet?text=${encoded}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Merci de partager ArbiTech ! 💜");
  };

  if (!mounted) return null;

  return (
    <>
      {/* Floating button (bottom-right, non intrusif) */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {expanded && (
          <div className="flex flex-col gap-2 animate-scale-in origin-bottom-right">
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full glass-strong shadow-lg text-sm font-medium hover:scale-105 transition-transform"
            >
              <Gift className="w-4 h-4 text-violet-400" /> Partager & gagner
            </button>
            <button
              onClick={() => {
                copyAll();
              }}
              className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full glass-strong shadow-lg text-sm font-medium hover:scale-105 transition-transform"
            >
              <Copy className="w-4 h-4 text-teal-400" /> Copier mon lien
            </button>
          </div>
        )}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="grid place-items-center w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-teal-400 text-white shadow-xl shadow-violet-500/40 hover:scale-110 transition-transform animate-float"
          aria-label="Partager ArbiTech"
        >
          {expanded ? <ChevronUp className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Share dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              Partagez ArbiTech, gagnez de l'argent
            </DialogTitle>
            <DialogDescription>
              Même sans abonnement, vous pouvez devenir ambassadeur. Partagez votre lien, et gagnez une commission à
              chaque ami qui s'abonne. Simple comme bonjour.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Referral link */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Votre lien unique
              </label>
              <div className="flex items-center gap-2 rounded-xl bg-muted/50 border border-border p-2 pl-3">
                <code className="flex-1 text-sm truncate font-mono">{referralLink}</code>
                <Button size="sm" variant="secondary" onClick={copyAll} className="flex-shrink-0">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span className="ml-1">{copied ? "Copié" : "Copier"}</span>
                </Button>
              </div>
            </div>

            {/* Emotional share text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Message d'accroche (prêt à envoyer)
                </label>
                <Button size="sm" variant="ghost" onClick={rotateText} className="h-7 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" /> Autre texte
                </Button>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-teal-500/10 border border-white/10 p-4">
                <p className="text-sm leading-relaxed italic">"{shareText}"</p>
              </div>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => shareVia("whatsapp")}
                className="bg-emerald-500 hover:bg-emerald-600 text-white border-0"
              >
                <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
              </Button>
              <Button
                onClick={() => shareVia("telegram")}
                className="bg-sky-500 hover:bg-sky-600 text-white border-0"
              >
                <Send className="w-4 h-4 mr-2" /> Telegram
              </Button>
              <Button
                onClick={() => shareVia("twitter")}
                className="bg-foreground/90 hover:bg-foreground text-background border-0"
              >
                <Twitter className="w-4 h-4 mr-2" /> Twitter
              </Button>
            </div>

            {/* CTA: become ambassador */}
            {!user && (
              <div className="rounded-xl bg-muted/40 border border-border p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Créez un compte gratuit pour suivre vos parrainages et vos gains.
                </p>
                <Button
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0"
                  onClick={() => {
                    setShareOpen(false);
                    setAuthMode("register");
                    setView("auth");
                  }}
                >
                  Devenir ambassadeur gratuitement
                </Button>
              </div>
            )}
            {user && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShareOpen(false);
                  setView("ambassador");
                }}
              >
                Voir mes gains et mon tableau ambassadeur
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
