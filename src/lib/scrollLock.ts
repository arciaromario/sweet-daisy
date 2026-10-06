import { useEffect } from 'react';

// Several overlays can be open at once (quick view → bag), so count the locks.
let locks = 0;

/**
 * Stops the page behind an overlay from scrolling while `active` is true.
 * The lock is released on close and also when the component unmounts — e.g. when
 * going to checkout from the open bag, which renders a layout without the drawer.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    locks += 1;
    document.body.classList.add('is-locked');
    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) document.body.classList.remove('is-locked');
    };
  }, [active]);
}
