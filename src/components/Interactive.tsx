import { useState } from 'react';
import { Platform, Pressable, type PressableProps } from 'react-native';
import { focusRing, webTransition } from '../styles/theme';

/** Shared keyboard focus and restrained hover feedback; keeps native press behavior. */
export default function Interactive({ style, onFocus, onBlur, onHoverIn, onHoverOut, disabled, ...props }: PressableProps) {
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  return <Pressable {...props} disabled={disabled} accessibilityRole={props.accessibilityRole || 'button'}
    onFocus={event => {
      const target = event.currentTarget as unknown as { matches?: (selector: string) => boolean };
      setFocus(Platform.OS !== 'web' || !!target.matches?.(':focus-visible'));
      onFocus?.(event);
    }} onBlur={event => { setFocus(false); onBlur?.(event); }}
    onHoverIn={event => { setHover(true); onHoverIn?.(event); }} onHoverOut={event => { setHover(false); onHoverOut?.(event); }}
    style={state => [typeof style === 'function' ? style(state) : style, webTransition,
      hover && !disabled && { opacity: 0.92 }, state.pressed && !disabled && { opacity: 0.8 }, focus && focusRing,
      disabled && { opacity: 0.5 }]} />;
}
