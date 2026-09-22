import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Container } from "@/components/ui/Container";
import { PageTransition } from "@/components/ui/PageTransition";
import { siteConfig } from "@/config/site";

export type LegalSection = {
  title: string;
  /** Paragraphs, in order. */
  body?: string[];
  /** Optional bulleted list rendered after the paragraphs. */
  list?: string[];
};

/**
 * Shell for the two long-form legal documents.
 *
 * Content arrives as data rather than JSX so the documents stay readable and
 * editable, and so a future move into `siteConfig` would be mechanical.
 *
 * Both pages carry a visible "have this reviewed" note. That is not padding:
 * these documents describe what this particular website does — which is
 * unusually little, because it sets no cookies and stores nothing — and that
 * description is accurate, but it is still not a substitute for advice from
 * the client's own lawyer.
 */
export function LegalDocument({
  eyebrow,
  title,
  intro,
  sections,
  footer,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
  footer?: ReactNode;
}) {
  return (
    <PageTransition>
      <section className="border-b border-ink-800 bg-ink-950 py-14 sm:py-16 lg:py-20">
        <Container size="narrow">
          <div className="flex flex-col gap-5">
            <p className="text-eyebrow text-accent-300">{eyebrow}</p>
            <h1 className="text-3xl text-bone-50 sm:text-4xl">{title}</h1>
            <p className="text-base leading-relaxed text-muted-dark">{intro}</p>
            <p className="text-[0.8125rem] text-ink-400">
              Applies to {siteConfig.name} and this website.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-bone-50 py-14 sm:py-16 lg:py-20">
        <Container size="narrow">
          <p className="flex items-start gap-3 rounded-xl border border-bone-300 bg-white p-4 text-[0.8125rem] leading-relaxed text-muted-light">
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-ink-400"
            />
            <span>
              <span className="font-semibold text-ink-900">
                Starting point, not legal advice.
              </span>{" "}
              This document describes how this website actually behaves, but it
              has not been reviewed by a lawyer. Have it checked before relying
              on it.
            </span>
          </p>

          <div className="mt-10 flex flex-col gap-9">
            {sections.map((section) => (
              <div key={section.title} className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-ink-950">
                  {section.title}
                </h2>

                {section.body?.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 32)}
                    className="text-[0.9375rem] leading-relaxed text-muted-light"
                  >
                    {paragraph}
                  </p>
                ))}

                {section.list ? (
                  <ul className="flex flex-col gap-2">
                    {section.list.map((item) => (
                      <li
                        key={item.slice(0, 32)}
                        className="flex gap-3 text-[0.9375rem] leading-relaxed text-muted-light"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink-400"
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>

          {footer ? (
            <div className="mt-10 border-t border-bone-200 pt-6">{footer}</div>
          ) : null}
        </Container>
      </section>
    </PageTransition>
  );
}
