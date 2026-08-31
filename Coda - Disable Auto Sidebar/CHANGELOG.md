# Changelog

## [1.0]
- Initial release
- Blocks sidebar hover-expand by intercepting `mousemove` events near the left edge (within 20px) in the capturing phase, before Coda's document-level listener fires
- MutationObserver backup reverts any expand triggered outside of mouse movement
- `Ctrl+\` keyboard shortcut to manually toggle sidebar on/off
- Polls for sidebar element on load to handle Coda's async React render
- Re-initializes on SPA navigation if the sidebar element is remounted
