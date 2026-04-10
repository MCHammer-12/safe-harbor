type QuestionTooltipProps = {
  label: string;
  text: string;
  align?: 'center' | 'left' | 'right';
};

export default function QuestionTooltip({ label, text, align = 'center' }: QuestionTooltipProps) {
  const tooltipAlignClass =
    align === 'left'
      ? 'left-0 translate-x-0'
      : align === 'right'
        ? 'right-0 translate-x-0'
        : 'left-1/2 -translate-x-1/2';

  return (
    <span className="relative inline-flex group ml-1 align-middle">
      <span
        aria-label={label}
        tabIndex={0}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] lowercase font-normal leading-none text-muted-foreground cursor-help"
      >
        ?
      </span>
      <span
        className={`pointer-events-none absolute top-full z-10 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-white px-3 py-2.5 text-left text-xs leading-5 font-sans font-normal normal-case tracking-normal text-foreground shadow-md whitespace-normal break-words opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:w-72 ${tooltipAlignClass}`}
      >
        {text}
      </span>
    </span>
  );
}
