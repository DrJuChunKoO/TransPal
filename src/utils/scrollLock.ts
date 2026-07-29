/**
 * Locks page scrolling while a full-screen overlay is open.
 *
 * Freezing `<body>` alone would let the page jump by the scrollbar width on desktop, so the
 * reclaimed gutter is padded back in. Returns the restore function, which is shaped to be used
 * directly as a `useEffect` cleanup.
 */
export function applyDialogScrollLock(doc: Document): () => void {
  const { body, documentElement } = doc;

  const previousOverflow = body.style.overflow;
  const previousPaddingInlineEnd = body.style.paddingInlineEnd;
  const scrollbarWidth = Math.max(
    0,
    (doc.defaultView?.innerWidth ?? documentElement.clientWidth) -
      documentElement.clientWidth,
  );

  body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    body.style.paddingInlineEnd = `${scrollbarWidth}px`;
  }

  return () => {
    body.style.overflow = previousOverflow;
    body.style.paddingInlineEnd = previousPaddingInlineEnd;
  };
}
