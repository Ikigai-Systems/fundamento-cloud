// Icon of our own slash menu items. BlockNote renders its built-in items' icons as 18px SVGs in
// currentColor, centred by the item's flex section, so ours take the same box and inherit colour.
export function SlashMenuIcon({icon}: {icon: string}) {
  return <span aria-hidden className={`size-[18px] shrink-0 ${icon}`}></span>;
}
