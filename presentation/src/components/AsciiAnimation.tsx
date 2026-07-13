/**
 * The animation used on Folio's split-screen sign-in page, vendored here so
 * this standalone application keeps the same login experience.
 */
import { useEffect, useRef, useState } from 'react';

interface Column {
  id: number;
  characters: string[];
  position: number;
  opacity: number[];
}

const CHARACTERS = '○●◐◑─│✦◆01/\\|-';

function makeColumn(id: number, position = Math.random() * -100): Column {
  const length = Math.floor(Math.random() * 8) + 5;
  return {
    id,
    position,
    characters: Array.from(
      { length },
      () => CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)],
    ),
    opacity: Array.from({ length }, (_, index) => 1 - index / length),
  };
}

export default function AsciiAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(query.matches);
    updatePreference();
    query.addEventListener('change', updatePreference);
    return () => query.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    setColumns(Array.from({ length: 30 }, (_, index) => makeColumn(index)));
  }, []);

  useEffect(() => {
    if (reducedMotion || columns.length === 0) return;
    const interval = window.setInterval(() => {
      setColumns((current) => current.map((column) => {
        const position = column.position + 1;
        return position > 120 ? makeColumn(column.id, -20) : { ...column, position };
      }));
    }, 50);
    return () => window.clearInterval(interval);
  }, [columns.length, reducedMotion]);

  return (
    <div ref={containerRef} className="jk-ascii" aria-hidden="true">
      {columns.map((column, columnIndex) => (
        <div
          className="jk-ascii__column"
          key={column.id}
          style={{
            left: `${(columnIndex / columns.length) * 100}%`,
            transform: `translateY(${column.position}%)`,
          }}
        >
          {column.characters.map((character, characterIndex) => (
            <span
              className={`jk-ascii__character jk-ascii__character--${Math.min(characterIndex, 4)}`}
              key={`${column.id}-${characterIndex}`}
              style={{ opacity: column.opacity[characterIndex] }}
            >
              {character}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
