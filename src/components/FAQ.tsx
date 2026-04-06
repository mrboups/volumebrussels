"use client";

import { useState } from "react";

const faqs = [
  {
    question: "Where can I use the Volume Pass?",
    answer:
      "The pass is valid in Brussels' eight major clubs. Brussels' nightlife offer is primarily concentrated during the weekend. Consult the calendar to find out what's on offer at these eight venues.",
  },
  {
    question: "How long is the Volume Pass valid?",
    answer:
      "The pass must be used within 12 months of purchase. In concrete terms, it is valid for 48 hours from the date of activation, with the time slots for use are from 20:00 in the evening to 05:00 in the morning.",
  },
  {
    question: "Are drinks included?",
    answer:
      "The Volume Pass gives you access to the capital's eight main clubs. In addition to entry, you get skip-the-line access. Drinks and other services are not included in the pass.",
  },
  {
    question: "Where are the clubs and parties?",
    answer:
      "All the clubs are located in or around the city centre, at a walking distance from each other. Feel free to check out where they are on our map.",
  },
  {
    question: "Can an inappropriate attitude or dress code restrict access to certain venues?",
    answer:
      "No club tolerates aggressive, harassing or discriminatory behaviour. Clubs reserve the right to exclude or refuse entry to people who do not respect the values they uphold. The majority of clubs do not require a dress code, however, where this is specified, please follow the dress code.",
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
