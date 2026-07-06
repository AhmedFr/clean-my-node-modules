import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Wrap } from "@/components/Wrap";
import { REPO_URL } from "@/lib/links";

const FOOT_LINK =
  "mb-[11px] block text-[15px] text-ink-2 transition-colors duration-150 hover:text-ink";
const COL_HEAD =
  "mb-4 mt-1 text-[13px] font-semibold uppercase tracking-[0.05em] text-ink-3";

export function Footer() {
  return (
    <footer className="border-t border-line pb-10 pt-14">
      <Wrap>
        <div className="grid grid-cols-[1.6fr_1fr_1fr] gap-[30px] max900:grid-cols-2 max560:grid-cols-1">
          <div>
            <Link
              className="mb-[14px] flex items-center gap-[10px] font-display text-[18px] font-extrabold tracking-[-0.01em]"
              href="/#top"
            >
              <span className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-[linear-gradient(155deg,#ff8585,#d23a3a)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_3px_10px_rgba(226,61,61,0.34)] [&_svg]:h-[18px] [&_svg]:w-[18px]">
                <Icon id="logo-module" />
              </span>
              TidyDisk
            </Link>
            <p className="max-w-[30ch] text-[14.5px] text-ink-3">
              The menu bar app that keeps dev junk from eating your Mac alive.
            </p>
          </div>
          <div>
            <h5 className={COL_HEAD}>Product</h5>
            <Link className={FOOT_LINK} href="/#features">
              Features
            </Link>
            <Link className={FOOT_LINK} href="/#how">
              How it works
            </Link>
            <Link className={FOOT_LINK} href="/#download">
              Download
            </Link>
            <Link className={FOOT_LINK} href="/blog">
              Blog
            </Link>
          </div>
          <div>
            <h5 className={COL_HEAD}>Open source</h5>
            <a className={FOOT_LINK} href={REPO_URL} target="_blank" rel="noopener">
              GitHub repository
            </a>
            <a className={FOOT_LINK} href={`${REPO_URL}/issues`} target="_blank" rel="noopener">
              Issues
            </a>
            <a className={FOOT_LINK} href={`${REPO_URL}/releases`} target="_blank" rel="noopener">
              Releases
            </a>
          </div>
        </div>
        <div className="mt-[46px] flex flex-wrap items-center justify-between gap-3 border-t border-line pt-[26px] text-[13.5px] text-ink-4">
          <span className="font-mono">© 2026 TidyDisk · MIT license</span>
          <span className="font-mono">macOS 13+ · Apple Silicon &amp; Intel</span>
        </div>
      </Wrap>
    </footer>
  );
}
