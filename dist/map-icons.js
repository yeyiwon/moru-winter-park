// Small coloured landmarks, without badge backgrounds or enclosing borders.
const drawings={
 gondola:'<path d="M4 7h32M20 7v7" fill="none"/><rect x="8" y="15" width="24" height="19" rx="7" fill="#9fc9d9"/><path d="M11 19h18v9H11z" fill="#def2f6"/><path d="M20 19v15M12 30h16" fill="none"/>',

 lift:'<path d="M4 8h32M21 8v10l-8 4v8" fill="none"/><path d="M13 23h17v9H13z" fill="#72b8df"/><path d="M17 18v6m8-7v7" fill="none"/><path d="M13 27h17" stroke="#e5f3ff"/>',
 summit:'<path d="m4 33 16-22 16 22H4Z" fill="#7fa5d5"/><path d="m14 20 6 4 6-4-6-9Z" fill="#f4f7ff"/><path d="M20 11V4l10 3-10 4" fill="#ecc278"/>',
 park:'<path d="M7 30V17h7v6h12v-6h7v13H7Z" fill="#ccd3f0"/><path d="M16 23V13h8v10" fill="#b9c8ed"/><path d="m5 17 5.5-7 5.5 7Zm19 0 5.5-7 5.5 7ZM16 13l4-8 4 8Z" fill="#cb985c"/><path d="M17 30v-5a3 3 0 0 1 6 0v5" fill="#54769b"/>',
 ski:'<path d="m5 30 12-20 7 11 4-7 8 16H5Z" fill="#8db9ca"/><path d="m12 18 5 2 4-3-4-7Zm13 2 3 2 3-2-3-6Z" fill="#eef5fa"/><path d="m8 33 24-1"/>',
 onsen:'<path d="M6 24c1 10 27 10 28 0" fill="#71b7be"/><ellipse cx="20" cy="24" rx="14" ry="4" fill="#d3f2ef"/><path d="M13 17c-5-4 4-6 0-10m7 10c-5-4 4-6 0-10m7 10c-5-4 4-6 0-10" fill="none" stroke="#b46f40"/>',
 tree:'<path d="M18 27v7h4v-7" fill="#bd945c"/><path d="m20 10-7 9h3l-6 9h20l-6-9h3Z" fill="#4c9d83"/><path d="m20 3 1.3 2.8 3.2.4-2.3 2.1.6 3-2.8-1.5-2.8 1.5.6-3-2.3-2.1 3.2-.4Z" fill="#efd180"/><circle cx="17" cy="22" r="1.3" fill="#ffe4b2" stroke="none"/><circle cx="24" cy="25" r="1.3" fill="#ffe4b2" stroke="none"/>',
 quiz:'<path d="M8 25a12 12 0 0 1 24 0v7H8Z" fill="#a7a8d9"/><path d="M8 25h24v7H8Z" fill="#e7d9b9"/><path d="M5 32h30M8 25h24M20 13c-5 3-5 9-5 12m5-12c5 3 5 9 5 12" fill="none"/><path d="m28 4 1.3 3.7L33 9l-3.7 1.3L28 14l-1.3-3.7L23 9l3.7-1.3Z" fill="#f1cd80"/>'
};
export function mapIcon(id){return `<svg class="map-landmark-icon" viewBox="0 0 40 40" aria-hidden="true"><g fill="none" stroke="#304860" stroke-width="1.35" stroke-linejoin="round" stroke-linecap="round">${drawings[id]||drawings.park}</g></svg>`;}
