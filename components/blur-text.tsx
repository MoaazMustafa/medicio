export interface BlurTextProps {
  text: string;
  className?: string;
  /** Delay in ms before the first word animates. */
  delay?: number;
  /** Delay in ms between each word. */
  stagger?: number;
}

/**
 * ReactBits-style "BlurText": each word blurs and slides into place with a
 * stagger. CSS-only, so it can render inside Server Components.
 */
export function BlurText({
  text,
  className = "",
  delay = 0,
  stagger = 70,
}: BlurTextProps) {
  const words = text.split(" ");

  return (
    <span className={className}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          className="blur-in-word"
          style={{ animationDelay: `${delay + index * stagger}ms` }}
        >
          {word}
          {index < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}
