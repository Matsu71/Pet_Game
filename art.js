/* Original vector characters and shared icons. No network or licensed assets. */
(() => {
  'use strict';
  const G = window.ForestGame;
  const icons = {
    leaf: '<path d="M5 19C3 8 9 3 21 3c0 12-5 18-16 16Z"/><path d="m3 21 12-12m-7 7-1-5m5 1h5"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
    moon: '<path d="M20 15.5A9 9 0 0 1 8.5 4 9 9 0 1 0 20 15.5Z"/>',
    bowl: '<path d="M3 12h18c0 5-4 8-9 8s-9-3-9-8Zm4 9h10M8 8c-3-2 2-3 0-5m5 5c-3-2 2-3 0-5m5 5c-3-2 2-3 0-5"/>',
    bath: '<path d="M3 13h18v3c0 3-3 4-9 4s-9-1-9-4ZM5 13V6a3 3 0 0 1 6 0M6 20v2m12-2v2"/><circle cx="16" cy="7" r="2"/><circle cx="21" cy="3" r="1"/>',
    heart: '<path d="M12 21 3.5 12.4A5.5 5.5 0 0 1 12 5.5a5.5 5.5 0 0 1 8.5 6.9Z"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/>',
    chat: '<path d="M21 11a8 8 0 0 1-8 8H8l-5 3V11a9 9 0 0 1 18 0Z"/><path d="M7 10h10M7 14h6"/>',
    send: '<path d="m21 3-7 18-4-7-7-4 18-7ZM10 14 21 3"/>',
    settings: '<path d="m10 3 4 0 .6 2.2 2.3 1.3 2.2-.6 2 3.5-1.6 1.6v2.7l1.6 1.6-2 3.5-2.2-.6-2.3 1.3L14 22h-4l-.6-2.2-2.3-1.3-2.2.6-2-3.5 1.6-1.6v-2.7L2.9 9.7l2-3.5 2.2.6 2.3-1.3Z"/><circle cx="12" cy="12.5" r="3"/>',
    gift: '<path d="M3 9h18v4H3zM5 13v8h14v-8M12 9v12"/><path d="M12 9C2 9 5 0 9 4l3 5Zm0 0c10 0 7-9 3-5l-3 5Z"/>',
    book: '<path d="M12 5C8 2 4 3 2 4v16c3-2 7-2 10 0 3-2 7-2 10 0V4c-3-1-6-2-10 1Zm0 0v15"/>',
    sprout: '<path d="M12 22V11M12 15C3 16 2 10 2 6c8-1 10 3 10 9Zm0-5c1-7 5-8 10-8 0 6-4 9-10 8Z"/>',
    home: '<path d="m2 11 10-9 10 9M5 9v12h14V9M9 21v-8h6v8"/>',
    briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12c6 4 12 4 18 0M10 14h4"/>',
    edit: '<path d="m4 16-1 5 5-1L21 7l-4-4ZM14 6l4 4"/>',
    water: '<path d="M3 8c3-3 6 3 9 0s6 3 9 0M3 14c3-3 6 3 9 0s6 3 9 0M3 20c3-3 6 3 9 0s6 3 9 0"/>',
    lock: '<rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v3"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>'
  };
  function icon(name) { return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.leaf}</svg>`; }
  let serial = 0;
  function petSVG(c, isAdult = false) {
    const shadeId = `fur-${++serial}`;
    const species = G.SPECIES[c.species] ? c.species : 'fox', p = G.SPECIES[species];
    const ears = {
      fox: `<path d="m48 85-9-59q28 4 41 35m40 0q13-31 41-35l-9 59" fill="${p.color}"/><path d="m49 64-4-25 24 24m62 0 24-24-4 25" fill="#f5d7b6"/>`,
      rabbit: `<ellipse cx="66" cy="46" rx="17" ry="43" transform="rotate(-10 66 46)" fill="${p.color}"/><ellipse cx="133" cy="43" rx="17" ry="43" transform="rotate(12 133 43)" fill="${p.color}"/><ellipse cx="66" cy="42" rx="8" ry="29" transform="rotate(-10 66 42)" fill="#eabfb1"/><ellipse cx="134" cy="40" rx="8" ry="29" transform="rotate(12 134 40)" fill="#eabfb1"/>`,
      bear: `<circle cx="51" cy="65" r="25" fill="${p.color}"/><circle cx="149" cy="65" r="25" fill="${p.color}"/><circle cx="51" cy="65" r="13" fill="${p.pale}"/><circle cx="149" cy="65" r="13" fill="${p.pale}"/>`,
      cat: `<path d="m43 89 4-60 36 32m34 0 36-32 4 60" fill="${p.color}"/><path d="m52 66 0-24 21 22m54 0 21-22v24" fill="#d7c6b5"/>`
    };
    const tail = species === 'fox' ? `<path d="M135 186c38 9 60-25 49-57-3 21-30 11-45 27" fill="${p.color}"/><path d="M182 152c5-8 5-16 2-23-2 10-10 13-19 16l4 16Z" fill="${p.pale}"/>` : species === 'cat' ? `<path d="M139 179q53 10 37-28" stroke="${p.color}" stroke-width="17" stroke-linecap="round" fill="none"/>` : `<circle cx="146" cy="177" r="15" fill="${p.pale}"/>`;
    return `<svg class="pet-art" viewBox="0 0 200 220" fill="none" aria-hidden="true"><defs><radialGradient id="${shadeId}" cx="35%" cy="25%" r="80%"><stop stop-color="#fff8dd" stop-opacity=".32"/><stop offset=".7" stop-color="${p.color}" stop-opacity="0"/><stop offset="1" stop-color="#674b39" stop-opacity=".13"/></radialGradient></defs><ellipse cx="102" cy="206" rx="58" ry="8" fill="#526d3e" opacity=".12"/>${tail}<ellipse cx="100" cy="162" rx="${isAdult ? 49 : 44}" ry="43" fill="${p.color}"/><ellipse cx="100" cy="167" rx="29" ry="32" fill="${p.pale}"/><ellipse cx="66" cy="199" rx="20" ry="11" fill="${p.color}"/><ellipse cx="134" cy="199" rx="20" ry="11" fill="${p.color}"/><ellipse cx="56" cy="165" rx="12" ry="24" transform="rotate(15 56 165)" fill="${p.color}"/><ellipse cx="144" cy="165" rx="12" ry="24" transform="rotate(-15 144 165)" fill="${p.color}"/>${ears[species]}<path d="M100 57c43 0 65 24 65 58 0 34-30 46-65 46s-65-12-65-46c0-34 22-58 65-58Z" fill="${p.color}"/>${species === 'fox' ? `<path d="M36 112q31-9 64 23 33-32 64-23c0 36-33 46-64 46s-64-10-64-46Z" fill="${p.pale}"/>` : `<ellipse cx="100" cy="132" rx="33" ry="22" fill="${p.pale}"/>`}${species === 'cat' ? '<path d="m89 59 3 12m8-13v12m11-11-3 12" stroke="#85947e" stroke-width="4" stroke-linecap="round"/>' : ''}<path d="M100 57c43 0 65 24 65 58 0 34-30 46-65 46s-65-12-65-46c0-34 22-58 65-58Z" fill="url(#${shadeId})"/><g class="pet-eyes">${c.dead ? '<path d="m68 106 10 10m-10 0 10-10m44 0 10 10m-10 0 10-10" stroke="#544b3e" stroke-width="3" stroke-linecap="round"/>' : c.sick ? '<path d="m68 114 10-3m44 0 10 3" stroke="#544b3e" stroke-width="3" stroke-linecap="round"/>' : '<ellipse cx="74" cy="111" rx="4.5" ry="6" fill="#50473b"/><ellipse cx="126" cy="111" rx="4.5" ry="6" fill="#50473b"/><circle cx="75" cy="109" r="1.4" fill="#fffbea"/><circle cx="127" cy="109" r="1.4" fill="#fffbea"/>'}</g><ellipse cx="60" cy="128" rx="10" ry="5" fill="#d3937c" opacity=".45"/><ellipse cx="140" cy="128" rx="10" ry="5" fill="#d3937c" opacity=".45"/><path d="M95 127q5-4 10 0-1 7-5 7t-5-7Z" fill="#77604a"/><path d="M100 133v4m-7 0q3 7 7 0 4 7 7 0" stroke="#8a6c50" stroke-width="1.8" stroke-linecap="round"/>${c.scarf ? '<path d="M65 149q35 15 70 0v13q-35 13-70 0Z" fill="#bb7562"/><path d="m113 160 12 31 13-7-14-27" fill="#bd7965"/><path d="m124 182 10-4" stroke="#e3b29a" stroke-width="3"/>' : isAdult ? '<path d="M89 152q10 6 22 0l-7 14-5-8-8 8Z" fill="#91a16e"/>' : ''}</svg>`;
  }
  window.ForestArt = Object.freeze({icon, petSVG});
})();
