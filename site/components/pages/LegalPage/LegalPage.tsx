import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { LegalArticle } from "@/components/LegalArticle";
import { formatPostDate } from "@/app/blog/format-date";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getLegal } from "@/lib/legal/get-legal";
import { LEGAL_UPDATED, OWNER } from "@/lib/legal/legal.constants";

const ROW = "grid grid-cols-[120px_1fr] gap-3 max560:grid-cols-1 max560:gap-0";
const LABEL = "font-mono text-[13px] uppercase tracking-[0.04em] text-ink-4";

// The legal notice / imprint page. Renders the translated prose via
// LegalArticle, with a factual identity card (from the OWNER constants, never
// translated) slotted between the intro and the sections.
export function LegalPage({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const legal = getLegal(locale);
  const { labels } = legal.imprint;
  return (
    <>
      <Navbar dict={dict} locale={locale} />
      <LegalArticle
        doc={legal.imprint}
        updatedLabel={legal.updatedLabel}
        updated={formatPostDate(LEGAL_UPDATED, locale)}
      >
        <dl className="mt-8 flex flex-col gap-3 rounded-[14px] border border-line-2 bg-panel/60 p-6 text-[15.5px] text-ink-2 max560:p-5">
          <div className={ROW}>
            <dt className={LABEL}>{labels.responsible}</dt>
            <dd>{OWNER.name}</dd>
          </div>
          <div className={ROW}>
            <dt className={LABEL}>{labels.address}</dt>
            <dd>
              {OWNER.addressLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </dd>
          </div>
          <div className={ROW}>
            <dt className={LABEL}>{labels.email}</dt>
            <dd>
              <a className="text-accent hover:underline" href={`mailto:${OWNER.email}`}>
                {OWNER.email}
              </a>
            </dd>
          </div>
          <div className={ROW}>
            <dt className={LABEL}>{labels.siret}</dt>
            <dd className="font-mono">{OWNER.siret}</dd>
          </div>
          <div className={ROW}>
            <dt className={LABEL}>{labels.vat}</dt>
            <dd>{OWNER.vatNote}</dd>
          </div>
        </dl>
      </LegalArticle>
      <Footer dict={dict} locale={locale} path="/legal" />
    </>
  );
}
