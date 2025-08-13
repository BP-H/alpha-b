export function avatar(seed: string, size = 64) {
  const initials = seed.split(/\s+/).map(s => s[0] || "").join("").slice(0,2).toUpperCase();
  const bg = "#1e2430";
  const fg = "#e6ecff";
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
    <rect width='100%' height='100%' fill='${bg}'/>
    <text x='50%' y='58%' text-anchor='middle' font-family='-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial' font-size='${size*0.46}' font-weight='700' fill='${fg}'>${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function photo(label = "PHOTO", w = 1200, h = 1500) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}' viewBox='0 0 ${w} ${h}'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#6ea8fe'/>
        <stop offset='1' stop-color='#9b86ff'/>
      </linearGradient>
    </defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <g opacity='.18'>
      <circle cx='${w*0.22}' cy='${h*0.26}' r='${Math.min(w,h)*0.18}' fill='#fff'/>
      <rect x='${w*0.55}' y='${h*0.54}' width='${w*0.36}' height='${h*0.32}' fill='#fff'/>
    </g>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
      font-family='-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial' font-size='${Math.min(w,h)*0.08}' font-weight='800' fill='rgba(255,255,255,.92)'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
