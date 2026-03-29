import { useMemo } from 'react';
import { useContainerWidth } from '../../hooks/useContainerWidth';
import { usePretext } from '../../hooks/usePretext';

interface Props {
  children: React.ReactNode;
  text: string;
  font: string;
  lineHeight: number;
  shrinkwrap?: boolean;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export default function PretextBlock({
  children,
  text,
  font,
  lineHeight,
  shrinkwrap: enableShrinkwrap = true,
  className = '',
  as: Tag = 'div',
}: Props) {
  const [containerRef, containerWidth] = useContainerWidth();
  const { isReady, measureHeight, shrinkwrap } = usePretext();

  const style = useMemo(() => {
    if (!isReady || containerWidth === null || containerWidth <= 0) return undefined;

    const s: React.CSSProperties = {};

    const height = measureHeight(text, font, containerWidth, lineHeight);
    if (height !== null) {
      s.minHeight = height;
    }

    if (enableShrinkwrap) {
      const tightWidth = shrinkwrap(text, font, containerWidth, lineHeight);
      if (tightWidth !== null && tightWidth < containerWidth) {
        s.maxWidth = tightWidth;
      }
    }

    return Object.keys(s).length > 0 ? s : undefined;
  }, [isReady, containerWidth, text, font, lineHeight, enableShrinkwrap, measureHeight, shrinkwrap]);

  return (
    // @ts-expect-error - dynamic tag with ref
    <Tag ref={containerRef} className={className} style={style}>
      {children}
    </Tag>
  );
}
