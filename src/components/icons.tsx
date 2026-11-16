import type { SVGProps } from "react";

export function ChickenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18.03 13.97A5.96 5.96 0 0 0 14 11.13V8.5a2.5 2.5 0 0 0-5 0v2.63a5.96 5.96 0 0 0-4.03 2.84" />
      <path d="M4.22 15.65C2.53 17.58 4.25 21 6.84 21h10.32c2.59 0 4.31-3.42 2.62-5.35" />
      <path d="M12 11.13c-2.5 0-2.5-3.13-2.5-3.13s0-1.5 2.5-1.5 2.5 1.5 2.5 1.5S14.5 11.13 12 11.13z" />
      <path d="M7.5 7.5c0-1.5 1-2.5 2.5-2.5" />
    </svg>
  );
}

export function EggIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22c-5 0-9-4.48-9-10 0-5.52 4-10 9-10s9 4.48 9 10c0 5.52-4 10-9 10Z" />
    </svg>
  );
}
