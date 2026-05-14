/**
 * LeanScan brand mark.
 *
 * Design rationale:
 *   The logo is a deliberate echo of the protein ring on the home screen —
 *   forest-green base ring + amber "progress" arc. That ring is the app's
 *   hero UI element, so the brand mark and the product are visually one and
 *   the same. Whenever the user sees the logo, they see a tiny version of
 *   their daily goal.
 *
 *   Sized via the `size` prop (default 24). The viewBox is 64×64 so it scales
 *   cleanly from app-icon (1024) to nav header (20) without losing the arc
 *   end-caps. Stroke widths scale with viewBox, not pixels.
 */
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

interface Props {
  /** Rendered pixel size. Default 24. */
  size?: number;
  /** Override the ring color (rare — usually the brand forest). */
  ringColor?: string;
  /** Override the arc color (rare — usually the brand amber). */
  arcColor?: string;
}

export function LogoMark({
  size = 24,
  ringColor = colors.forest,
  arcColor = colors.amber,
}: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      {/* Base ring — the "100% target" full circle, like an empty protein ring */}
      <Circle cx={32} cy={32} r={26} fill="none" stroke={ringColor} strokeWidth={5} />
      {/* Amber progress arc from 12 → 3 o'clock (~90°). Reads as a partially
          filled ring, signaling "you're on your way" — protein progress. */}
      <Path
        d="M 32 6 A 26 26 0 0 1 58 32"
        fill="none"
        stroke={arcColor}
        strokeWidth={5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
