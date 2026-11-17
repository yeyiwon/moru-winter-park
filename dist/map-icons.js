// Rounded line drawings share one optical size, without opaque icon tiles.
const drawings={
 park:'<path d="M7 30V17h7v6h12v-6h7v13H7Zm10 0v-5a3 3 0 0 1 6 0v5M16 23V13h8v10"/><path class="accent" d="m5 17 5.5-7 5.5 7m8 0 5.5-7 5.5 7M16 13l4-8 4 8"/>',
 ski:'<path d="m5 30 12-20 7 11 4-7 8 16H5Z"/><path class="accent" d="m12 18 5 2 4-3m4 3 3 2 3-2"/><path d="m8 33 24-1"/>',
 onsen:'<path d="M6 24c1 8 27 8 28 0M6 24c0-5 28-5 28 0s-28 5-28 0Z"/><path class="accent" d="M13 17c-5-4 4-6 0-10m7 10c-5-4 4-6 0-10m7 10c-5-4 4-6 0-10"/>',
 tree:'<path d="m20 10-7 9h3l-6 9h20l-6-9h3Zm-2 18v5h4v-5"/><path class="accent" d="m20 3 1.3 2.8 3.2.4-2.3 2.1.6 3-2.8-1.5-2.8 1.5.6-3-2.3-2.1 3.2-.4Z"/><circle cx="18" cy="22" r=".9"/><circle cx="23" cy="25" r=".9"/>',
 quiz:'<path d="M8 25a12 12 0 0 1 24 0v7H8Zm-3 7h30M8 25h24M20 13c-5 3-5 9-5 12m5-12c5 3 5 9 5 12"/><path class="accent" d="m28 5 1.3 3.7L33 10l-3.7 1.3L28 15l-1.3-3.7L23 10l3.7-1.3Z"/>'
};
export function mapIcon(id){return `<svg class="map-landmark-icon" viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">${drawings[id]||drawings.park}</g></svg>`;}
