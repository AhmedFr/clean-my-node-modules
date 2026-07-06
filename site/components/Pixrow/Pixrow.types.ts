export interface PixrowProps {
  cells?: number;
  /** Reverse the green-to-red run so two strips can frame a centerpiece. */
  mirror?: boolean;
  className?: string;
  /** Cell sizing (width/height/radius), set per call site. */
  cellClassName?: string;
}
