"use client";

import { useState, useTransition } from "react";
import { submitGiveawayForm } from "../../dashboard/admin/_actions";

type Lang = "en" | "fr" | "nl";

const UI = {
  en: {
    nameLabel: "Your name",
    namePlaceholder: "Jane Doe",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    submit: "Get my free pass",
    submitting: "Sending...",
    defaultSuccess: "Thanks! Check your inbox — your free pass is on the way.",
    footer: "You will receive your pass by email within a few minutes.",
    errors: {
      not_found: "This giveaway does not exist.",
      inactive: "This giveaway is no longer active.",
      missing_name: "Please enter your name.",
      invalid_email: "Please enter a valid email address.",
      already_claimed:
        "You have already claimed a free pass from this giveaway.",
      email_failed:
        "We could not send your pass by email. Please try again in a moment.",
      generic: "Something went wrong. Please try again.",
    },
  },
  fr: {
    nameLabel: "Votre nom",
    namePlaceholder: "Jean Dupont",
    emailLabel: "Adresse email",
    emailPlaceholder: "vous@example.com",
    submit: "Recevoir mon pass gratuit",
    submitting: "Envoi...",
    defaultSuccess:
      "Merci ! Vérifiez votre boîte mail — votre pass gratuit arrive.",
    footer: "Vous recevrez votre pass par email dans quelques minutes.",
    errors: {
      not_found: "Ce cadeau n'existe pas.",
      inactive: "Ce cadeau n'est plus actif.",
      missing_name: "Veuillez entrer votre nom.",
      invalid_email: "Veuillez entrer une adresse email valide.",
      already_claimed:
        "Vous avez déjà réclamé un pass gratuit via ce formulaire.",
      email_failed:
        "Nous n'avons pas pu envoyer votre pass par email. Réessayez dans un instant.",
      generic: "Une erreur est survenue. Veuillez réessayer.",
    },
  },
  nl: {
    nameLabel: "Je naam",
    namePlaceholder: "Jan Jansen",
    emailLabel: "E-mailadres",
    emailPlaceholder: "jij@voorbeeld.be",
    submit: "Mijn gratis pas ophalen",
    submitting: "Verzenden...",
    defaultSuccess:
      "Bedankt! Check je inbox — je gratis pas is onderweg.",
    footer: "Je ontvangt je pas per e-mail binnen enkele minuten.",
    errors: {
      not_found: "Deze weggeefactie bestaat niet.",
      inactive: "Deze weggeefactie is niet meer actief.",
      missing_name: "Voer je naam in.",
      invalid_email: "Voer een geldig e-mailadres in.",
      already_claimed:
        "Je hebt al een gratis pas geclaimd via dit formulier.",
      email_failed:
        "We konden je pas niet per e-mail versturen. Probeer het zo opnieuw.",
      generic: "Er is iets misgegaan. Probeer het opnieuw.",
    },
  },
};

type ErrorCode = keyof (typeof UI)["en"]["errors"];

interface LangContent {
  title: string;
  description: string;
  successMessage: string;
}

// Matches URLs starting with http://, https:// or www.
// Split uses a capturing group with /gi; test uses a non-global twin to
// avoid lastIndex state leaking across calls.
const URL_SPLIT = /((?:https?:\/\/|www\.)[^\s]+)/gi;
const URL_TEST = /^(?:https?:\/\/|www\.)/i;
const IMAGE_LINE_PATTERN =
  /^(?:https?:\/\/|www\.)[^\s]+\.(?:jpg|jpeg|png|webp|gif|svg)(?:\?[^\s]*)?$/i;

function normalizeHref(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `https://${url}`;
}

// Render a text block with:
// - a standalone image URL line → <img>
// - inline URLs (http/https/www.) → clickable <a>
// - everything else → paragraphs preserving line breaks
function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-left">
      {text.split("\n").map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        // Full-line image URL
        if (IMAGE_LINE_PATTERN.test(trimmed)) {
          return (
            <img
              key={i}
              src={normalizeHref(trimmed)}
              alt=""
              className="w-full rounded-lg my-2"
            />
          );
        }

        // Linkify inline URLs
        const parts = trimmed.split(URL_SPLIT);
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, j) =>
              URL_TEST.test(part) ? (
                <a
                  key={j}
                  href={normalizeHref(part)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1a7fc7] hover:underline break-all"
                >
                  {part}
                </a>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        );
      })}
    </div>
  );
}

interface GiveawayData {
  slug: string;
  passType: "night" | "weekend";
  en: LangContent;
  fr: LangContent;
  nl: LangContent;
}

export default function GiveawayClient({ form }: { form: GiveawayData }) {
  const [lang, setLang] = useState<Lang>("en");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [pending, startTransition] = useTransition();

  // Pick the active content; fall back to English if the chosen language is empty.
  const content = form[lang].title ? form[lang] : form.en;
  const ui = UI[lang];

  // Only show language buttons for the languages that actually have a title.
  const availableLangs: Lang[] = (["en", "fr", "nl"] as Lang[]).filter(
    (l) => form[l].title.trim().length > 0
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorCode(null);
    startTransition(async () => {
      const res = await submitGiveawayForm(form.slug, { name, email });
      if (res?.error) {
        // Narrow to known error codes, fall back to generic.
        const code = res.error as ErrorCode;
        setErrorCode(ui.errors[code] ? code : "generic");
      } else {
        setSubmitted(true);
      }
    });
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Language switcher */}
        {availableLangs.length > 1 && (
          <div className="flex justify-center gap-1 mb-6">
            {availableLangs.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-md transition-colors ${
                  lang === l
                    ? "bg-black text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Volume Brussels
            </p>
            <h1 className="text-3xl font-extrabold text-gray-900 mt-2">
              {content.title}
            </h1>
            {content.description && (
              <div className="text-gray-600 mt-3 text-sm">
                <RichText text={content.description} />
              </div>
            )}
          </div>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
              <svg
                className="w-12 h-12 text-green-500 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div className="text-green-700 font-medium text-left">
                <RichText
                  text={content.successMessage || ui.defaultSuccess}
                />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ui.nameLabel}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={ui.namePlaceholder}
                  disabled={pending}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-black focus:border-black disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {ui.emailLabel}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={ui.emailPlaceholder}
                  disabled={pending}
                  className="w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:ring-2 focus:ring-black focus:border-black disabled:bg-gray-50"
                />
              </div>

              {errorCode && (
                <div className="bg-red-50 text-red-700 border border-red-200 rounded-md px-3 py-2 text-sm">
                  {ui.errors[errorCode]}
                </div>
              )}

              <button
                type="submit"
                disabled={pending || !name || !email}
                className="w-full bg-black text-white text-sm font-semibold uppercase tracking-wide py-3 rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {pending ? ui.submitting : ui.submit}
              </button>

              <p className="text-xs text-gray-400 text-center mt-2">
                {ui.footer}
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
