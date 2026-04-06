"use client";

import { useState } from "react";

const faqs = [
  {
    question: "How does the pass work?",
    answer:
      "Your pass is valid indefinitely until first use. Show it at the club door, staff validates your entry. Night pass gives 24h access to 2 clubs, Weekend gives 48h unlimited.",
  },
  {
    question: "Do I need to print anything?",
    answer: "No, just show the pass on your phone.",
  },
  {
    question: "Are museums included?",
    answer:
      "Yes, free access to the Atomium, Design Museum, and 5 Brussels City Museums.",
  },
  {
    question: "Can I get a refund?",
    answer: "Yes, unused passes can be refunded anytime.",
  },
  {
    question: "When can I use it?",
    answer:
      "Clubs are open Friday and Saturday nights. Museums are open during regular hours.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-gray-200 border-t border-b border-gray-200">
      {faqs.map((faq, i) => (
        <div key={faq.question}>
          <button
            className="w-full flex items-center justify-between py-5 text-left cursor-pointer"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
          >
            <span className="text-base font-semibold pr-4">{faq.question}</span>
            <svg
              className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform ${
                openIndex === i ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === i && (
            <p className="pb-5 text-gray-500 text-sm leading-relaxed">{faq.answer}</p>
          )}
        </div>
      ))}
    </div>
  );
}
