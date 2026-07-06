import type { IconProps } from "./Icon.types";

// References a <symbol> from the shared SvgSprite, mirroring the original
// `<svg viewBox="0 0 24 24"><use href="#id"></svg>` markup.
export function Icon({ id, className, style }: IconProps) {
  // Icons are decorative and always paired with a text label, so hide them
  // from assistive tech.
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <use href={`#${id}`} />
    </svg>
  );
}
