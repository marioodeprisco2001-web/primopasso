type P = { size?: number };
const svg = (size: number, sw = 2) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: sw, "aria-hidden": true });

export const SearchIcon = ({ size = 18 }: P) => <svg {...svg(size)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
export const PinIcon = ({ size = 18 }: P) => <svg {...svg(size)}><path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" /></svg>;
export const HeartIcon = ({ size = 18 }: P) => <svg {...svg(size)}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" /></svg>;
export const BellIcon = ({ size = 16 }: P) => <svg {...svg(size)}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>;
export const CheckIcon = ({ size = 16 }: P) => <svg {...svg(size, 2.5)}><path d="M5 12l5 5 9-10" /></svg>;
export const WarnIcon = ({ size = 16 }: P) => <svg {...svg(size)}><path d="M12 3 2 21h20L12 3z" /><path d="M12 10v5M12 18v.5" /></svg>;
export const InfoIcon = ({ size = 16 }: P) => <svg {...svg(size)}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>;
export const ExtIcon = ({ size = 16 }: P) => <svg {...svg(size)}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></svg>;
export const ReviewIcon = ({ size = 22 }: P) => <svg {...svg(size)}><path d="M9 11l3 3 8-8" /><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9" /></svg>;

export const Logo = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
    <rect x="2" y="15" width="10" height="9" rx="2" fill="var(--accent)" />
    <rect x="14" y="5" width="10" height="19" rx="2" fill="var(--ink)" />
  </svg>
);
