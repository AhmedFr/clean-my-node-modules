import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Btn } from "@/components/Btn";
import { REPO_URL, DOWNLOAD_URL } from "@/lib/links";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";

export interface NavbarProps {
  dict: Dictionary;
  locale: Locale;
}

// `lp-nav` is a behavior hook: RevealClient toggles `.scrolled` on it
// (backdrop styles live in globals.css).
export function Navbar({ dict, locale }: NavbarProps) {
  const nav = dict.nav;
  return (
    <header className="lp-nav sticky top-0 z-[100] flex h-16 items-center justify-between border-b border-transparent px-7 [transition:background_.25s,border-color_.25s,backdrop-filter_.25s] max560:px-[18px]">
      <Link
        className="flex items-center gap-[10px] font-display text-[18px] font-extrabold tracking-[-0.01em] max560:gap-2 max560:whitespace-nowrap max560:text-[14px]"
        href={localePath(locale, "/#top")}
      >
        <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-[linear-gradient(155deg,#ff8585,#d23a3a)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_10px_rgba(226,61,61,0.34)] max560:h-[26px] max560:w-[26px] [&_svg]:h-[18px] [&_svg]:w-[18px]">
          <Icon id="logo-module" />
        </span>
        TidyDisk
      </Link>
      <nav className="flex gap-[30px] text-[15px] font-medium text-ink-2 max900:hidden [&_a]:transition-colors [&_a]:duration-150 [&_a:hover]:text-ink">
        <Link href={localePath(locale, "/#features")}>{nav.features}</Link>
        <Link href={localePath(locale, "/#packages")}>{nav.packages}</Link>
        <Link href={localePath(locale, "/#why")}>{nav.why}</Link>
        <Link href={localePath(locale, "/#how")}>{nav.how}</Link>
        <Link href={localePath(locale, "/#download")}>{nav.download}</Link>
        <Link href={localePath(locale, "/blog")}>{nav.blog}</Link>
      </nav>
      <div className="flex items-center gap-[14px]">
        <Btn
          variant="ghost"
          size="sm"
          className="max560:hidden"
          href={REPO_URL}
          target="_blank"
          rel="noopener"
        >
          <Icon id="i-github" />
          {nav.github}
        </Btn>
        <Btn variant="primary" size="sm" href={DOWNLOAD_URL} target="_blank" rel="noopener">
          <Icon id="i-download" />
          {nav.getApp}
        </Btn>
      </div>
    </header>
  );
}
