import type { ReactElement } from 'react';
import { useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { SvgXml, type SvgProps } from 'react-native-svg';

import type { IconSource } from '@react-native-iconify/shared';

import { resolveIconByName, setIconRegistry } from './registry';

const DEFAULT_ICON_SIZE = 24;

type SvgRestProps = Omit<SvgProps, 'color' | 'strokeWidth'>;

export type IconifyProps = SvgRestProps & {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  rotate?: number;
  flip?: 'horizontal' | 'vertical' | 'both';
  accessibilityLabel?: string;
  iconOverride?: IconSource;
};

export function Iconify({
  name,
  size,
  color,
  strokeWidth,
  rotate,
  flip,
  accessibilityLabel,
  iconOverride,
  style,
  width: widthProp,
  height: heightProp,
  ...forwardSvgProps
}: IconifyProps): ReactElement | null {
  const icon = useMemo(() => iconOverride ?? resolveIconByName(name), [iconOverride, name]);

  if (!icon) {
    throw new Error(
      `[react-native-iconify] Icon "${name}" is not available. Ensure the loader generated this icon and the registry is configured.`,
    );
  }

  const width = widthProp ?? size ?? icon.width ?? DEFAULT_ICON_SIZE;
  const height = heightProp ?? size ?? icon.height ?? icon.width ?? DEFAULT_ICON_SIZE;

  const xml = useMemo(() => buildSvgXml(icon), [icon]);

  const transformStyle = useMemo(() => {
    const transforms: ViewStyle['transform'] = [];

    if (flip === 'horizontal' || flip === 'both') {
      transforms.push({ scaleX: -1 });
    }

    if (flip === 'vertical' || flip === 'both') {
      transforms.push({ scaleY: -1 });
    }

    if (typeof rotate === 'number' && rotate !== 0) {
      transforms.push({ rotate: `${rotate}deg` });
    }

    return transforms.length ? { transform: transforms } : undefined;
  }, [flip, rotate]);

  const mergedStyle = mergeStyles(style, transformStyle);
  const accessibleLabel = accessibilityLabel ?? name;

  return (
    <SvgXml
      xml={xml}
      width={width}
      height={height}
      color={color}
      strokeWidth={strokeWidth}
      accessibilityLabel={accessibleLabel}
      accessibilityRole="image"
      {...forwardSvgProps}
      style={mergedStyle}
    />
  );
}

export { setIconRegistry };

export default Iconify;

function buildSvgXml(icon: IconSource): string {
  const viewBoxWidth =
    typeof icon.width === 'number' && Number.isFinite(icon.width) ? icon.width : DEFAULT_ICON_SIZE;
  const viewBoxHeight =
    typeof icon.height === 'number' && Number.isFinite(icon.height) ? icon.height : viewBoxWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}">${icon.body}</svg>`;
}

function mergeStyles(
  base: StyleProp<ViewStyle> | undefined,
  extra: ViewStyle | undefined,
): StyleProp<ViewStyle> | undefined {
  if (!extra) {
    return base;
  }

  if (!base) {
    return extra;
  }

  if (Array.isArray(base)) {
    return [...base, extra];
  }

  return [base, extra];
}
