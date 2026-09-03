/**
 * Official NCAA Mascot Character Headshot Registry
 * Provides authentic, high-resolution mascot character illustrations and paws
 * for every college football team.
 */

// Mascot character definitions with authentic colors, names, and customized SVG headshots
export const MASCOT_REGISTRY = {
  // SEC
  'georgia': {
    name: 'Uga the Bulldog',
    pawColor: '#ffffff',
    pawBorder: '#ba0c2f',
    // Uga: White English bulldog with jowls, spiked black collar, and red jersey
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Ears -->
        <path d="M18 32 C12 20 8 38 15 48 Z" fill="#E5E7EB" stroke="#111827" stroke-width="2"/>
        <path d="M82 32 C88 20 92 38 85 48 Z" fill="#E5E7EB" stroke="#111827" stroke-width="2"/>
        <!-- Head -->
        <ellipse cx="50" cy="52" rx="36" ry="32" fill="#F3F4F6" stroke="#111827" stroke-width="2.5"/>
        <!-- Forehead wrinkles -->
        <path d="M38 32 Q50 36 62 32" stroke="#9CA3AF" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <path d="M42 38 Q50 42 58 38" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" fill="none"/>
        <!-- Eye Patches (Uga patch) -->
        <circle cx="34" cy="48" r="8" fill="#111827"/>
        <circle cx="66" cy="48" r="8" fill="#111827"/>
        <circle cx="35" cy="46" r="2.5" fill="#FFFFFF"/>
        <circle cx="67" cy="46" r="2.5" fill="#FFFFFF"/>
        <!-- Snout / Jowls -->
        <ellipse cx="50" cy="66" rx="20" ry="15" fill="#FFFFFF" stroke="#111827" stroke-width="2"/>
        <path d="M30 68 C30 78 40 82 50 82 C60 82 70 78 70 68" fill="#FFFFFF" stroke="#111827" stroke-width="2"/>
        <!-- Black Nose -->
        <path d="M44 58 Q50 54 56 58 Q50 66 44 58 Z" fill="#111827"/>
        <!-- Mouth / Tongue -->
        <path d="M46 72 Q50 78 54 72" stroke="#111827" stroke-width="2" fill="none"/>
        <path d="M46 72 Q50 84 54 72" fill="#EF4444" stroke="#991B1B" stroke-width="1.5"/>
        <!-- Underbite Teeth -->
        <polygon points="38,68 41,62 44,68" fill="#FFFFFF" stroke="#111827" stroke-width="1"/>
        <polygon points="56,68 59,62 62,68" fill="#FFFFFF" stroke="#111827" stroke-width="1"/>
        <!-- Spiked Collar -->
        <rect x="22" y="80" width="56" height="12" rx="4" fill="#BA0C2F" stroke="#111827" stroke-width="2"/>
        <polygon points="28,80 30,75 32,80" fill="#E5E7EB"/>
        <polygon points="40,80 42,75 44,80" fill="#E5E7EB"/>
        <polygon points="50,80 52,75 54,80" fill="#E5E7EB"/>
        <polygon points="60,80 62,75 64,80" fill="#E5E7EB"/>
        <polygon points="70,80 72,75 74,80" fill="#E5E7EB"/>
      </svg>
    `
  },

  'ohio-state': {
    name: 'Brutus Buckeye',
    pawColor: '#bb0000',
    pawBorder: '#666666',
    // Brutus Buckeye: Nut head with red/white striped beanie cap, smiling eyes and big grin
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Buckeye Nut Head -->
        <circle cx="50" cy="54" r="34" fill="#854D0E" stroke="#111827" stroke-width="2.5"/>
        <ellipse cx="50" cy="58" rx="24" ry="22" fill="#FEF08A" stroke="#854D0E" stroke-width="2"/>
        <!-- Eyes -->
        <circle cx="38" cy="54" r="6" fill="#111827"/>
        <circle cx="62" cy="54" r="6" fill="#111827"/>
        <circle cx="39" cy="52" r="2" fill="#FFFFFF"/>
        <circle cx="63" cy="52" r="2" fill="#FFFFFF"/>
        <!-- Nose -->
        <ellipse cx="50" cy="62" rx="3.5" ry="2.5" fill="#854D0E"/>
        <!-- Big Brutus Smile -->
        <path d="M34 68 Q50 82 66 68" fill="#FFFFFF" stroke="#111827" stroke-width="2.5"/>
        <path d="M38 70 Q50 78 62 70" fill="#BB0000"/>
        <!-- Striped Beanie Cap -->
        <path d="M22 42 C22 18 78 18 78 42 Z" fill="#BB0000" stroke="#111827" stroke-width="2.5"/>
        <path d="M34 42 C34 22 44 20 44 42 Z" fill="#FFFFFF"/>
        <path d="M56 42 C56 20 66 22 66 42 Z" fill="#FFFFFF"/>
        <!-- Cap Brim -->
        <rect x="20" y="38" width="60" height="8" rx="3" fill="#666666" stroke="#111827" stroke-width="2"/>
        <!-- Cap Pom Pom -->
        <circle cx="50" cy="18" r="7" fill="#FFFFFF" stroke="#111827" stroke-width="2"/>
      </svg>
    `
  },

  'oregon': {
    name: 'The Oregon Duck (Puddles)',
    pawColor: '#154733',
    pawBorder: '#fee123',
    // The Oregon Duck: Green beanie, white feathers, yellow bill
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Head feathers -->
        <circle cx="50" cy="50" r="32" fill="#FFFFFF" stroke="#111827" stroke-width="2.5"/>
        <!-- Green Beanie Cap -->
        <path d="M24 38 C24 16 76 16 76 38 Z" fill="#154733" stroke="#111827" stroke-width="2.5"/>
        <rect x="22" y="34" width="56" height="8" rx="3" fill="#FEE123" stroke="#111827" stroke-width="2"/>
        <!-- Eyes -->
        <ellipse cx="38" cy="46" rx="5" ry="7" fill="#111827"/>
        <ellipse cx="62" cy="46" rx="5" ry="7" fill="#111827"/>
        <circle cx="39" cy="44" r="2" fill="#FFFFFF"/>
        <circle cx="63" cy="44" r="2" fill="#FFFFFF"/>
        <!-- Big Yellow Duck Bill -->
        <path d="M22 58 C22 48 78 48 78 58 C78 72 65 76 50 76 C35 76 22 72 22 58 Z" fill="#FEE123" stroke="#111827" stroke-width="2.5"/>
        <!-- Nostrils -->
        <ellipse cx="44" cy="58" rx="1.5" ry="2.5" fill="#D97706"/>
        <ellipse cx="56" cy="58" rx="1.5" ry="2.5" fill="#D97706"/>
        <!-- Smile line -->
        <path d="M28 60 Q50 68 72 60" stroke="#B45309" stroke-width="2" fill="none"/>
      </svg>
    `
  },

  'alabama': {
    name: 'Big Al the Elephant',
    pawColor: '#828a8f',
    pawBorder: '#9e1b32',
    // Big Al: Grey elephant, big ears, trunk, crimson A cap
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Big Ears -->
        <path d="M18 48 C2 28 6 68 20 72 Z" fill="#9CA3AF" stroke="#111827" stroke-width="2"/>
        <path d="M82 48 C98 28 94 68 80 72 Z" fill="#9CA3AF" stroke="#111827" stroke-width="2"/>
        <!-- Head -->
        <circle cx="50" cy="52" r="32" fill="#D1D5DB" stroke="#111827" stroke-width="2.5"/>
        <!-- Cap -->
        <path d="M30 32 C30 18 70 18 70 32 Z" fill="#9E1B32" stroke="#111827" stroke-width="2"/>
        <path d="M26 30 Q50 28 74 30 Q50 36 26 30 Z" fill="#FFFFFF" stroke="#111827" stroke-width="1.5"/>
        <text x="50" y="27" font-size="10" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="sans-serif">A</text>
        <!-- Friendly Eyes -->
        <circle cx="38" cy="46" r="5" fill="#111827"/>
        <circle cx="62" cy="46" r="5" fill="#111827"/>
        <circle cx="39" cy="44" r="1.5" fill="#FFFFFF"/>
        <circle cx="63" cy="44" r="1.5" fill="#FFFFFF"/>
        <!-- Trunk -->
        <path d="M44 54 C44 74 40 82 50 82 C60 82 56 68 56 54 Z" fill="#D1D5DB" stroke="#111827" stroke-width="2"/>
        <path d="M44 64 Q50 66 56 64" stroke="#9CA3AF" stroke-width="2"/>
        <path d="M45 72 Q50 74 55 72" stroke="#9CA3AF" stroke-width="2"/>
        <!-- Tusks -->
        <path d="M36 62 C32 68 34 76 38 78 C38 72 42 66 42 62 Z" fill="#FFFFFF" stroke="#111827" stroke-width="1.5"/>
        <path d="M64 62 C68 68 66 76 62 78 C62 72 58 66 58 62 Z" fill="#FFFFFF" stroke="#111827" stroke-width="1.5"/>
      </svg>
    `
  },

  'texas': {
    name: 'Bevo the Longhorn',
    pawColor: '#bf5700',
    pawBorder: '#ffffff',
    // Bevo: Giant Burnt Orange Longhorns with steer head and white snout
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Giant Longhorns -->
        <path d="M50 42 C30 38 6 18 2 24 C14 36 34 46 44 48 Z" fill="#BF5700" stroke="#111827" stroke-width="2"/>
        <path d="M50 42 C70 38 94 18 98 24 C86 36 66 46 56 48 Z" fill="#BF5700" stroke="#111827" stroke-width="2"/>
        <!-- Ears -->
        <path d="M28 48 C16 44 18 56 26 56 Z" fill="#BF5700" stroke="#111827" stroke-width="1.5"/>
        <path d="M72 48 C84 44 82 56 74 56 Z" fill="#BF5700" stroke="#111827" stroke-width="1.5"/>
        <!-- Head -->
        <path d="M32 44 L68 44 L64 74 L36 74 Z" fill="#BF5700" stroke="#111827" stroke-width="2.5"/>
        <!-- Eyes -->
        <circle cx="40" cy="52" r="5" fill="#111827"/>
        <circle cx="60" cy="52" r="5" fill="#111827"/>
        <circle cx="41" cy="50" r="1.5" fill="#FFFFFF"/>
        <circle cx="61" cy="50" r="1.5" fill="#FFFFFF"/>
        <!-- Snout -->
        <ellipse cx="50" cy="68" rx="14" ry="9" fill="#FDF9D8" stroke="#111827" stroke-width="2"/>
        <!-- Nostrils -->
        <circle cx="45" cy="68" r="2.5" fill="#111827"/>
        <circle cx="55" cy="68" r="2.5" fill="#111827"/>
      </svg>
    `
  },

  'florida': {
    name: 'Albert the Alligator',
    pawColor: '#0021a5',
    pawBorder: '#fa4616',
    // Albert: Green Gator snout with sharp white teeth and blue cap
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Gator Head -->
        <ellipse cx="50" cy="54" rx="34" ry="28" fill="#16A34A" stroke="#111827" stroke-width="2.5"/>
        <!-- Snout -->
        <path d="M24 58 C24 48 76 48 76 58 C76 74 66 82 50 82 C34 82 24 74 24 58 Z" fill="#15803D" stroke="#111827" stroke-width="2"/>
        <!-- Big Eyes on top -->
        <circle cx="38" cy="38" r="9" fill="#16A34A" stroke="#111827" stroke-width="2"/>
        <circle cx="62" cy="38" r="9" fill="#16A34A" stroke="#111827" stroke-width="2"/>
        <circle cx="38" cy="38" r="5" fill="#FEF08A" stroke="#111827" stroke-width="1.5"/>
        <circle cx="62" cy="38" r="5" fill="#FEF08A" stroke="#111827" stroke-width="1.5"/>
        <circle cx="38" cy="38" r="2.5" fill="#111827"/>
        <circle cx="62" cy="38" r="2.5" fill="#111827"/>
        <!-- Blue Gator Cap -->
        <path d="M34 26 C34 16 66 16 66 26 Z" fill="#0021A5" stroke="#111827" stroke-width="1.5"/>
        <rect x="28" y="24" width="44" height="6" rx="2" fill="#FA4616"/>
        <!-- Nostrils -->
        <circle cx="44" cy="56" r="2" fill="#111827"/>
        <circle cx="56" cy="56" r="2" fill="#111827"/>
        <!-- Gator Teeth -->
        <polygon points="32,68 35,62 38,68" fill="#FFFFFF"/>
        <polygon points="42,68 45,62 48,68" fill="#FFFFFF"/>
        <polygon points="52,68 55,62 58,68" fill="#FFFFFF"/>
        <polygon points="62,68 65,62 68,68" fill="#FFFFFF"/>
      </svg>
    `
  },

  'lsu': {
    name: 'Mike the Tiger',
    pawColor: '#461d7c',
    pawBorder: '#fdd023',
    // Mike the Tiger: Purple/Gold tiger with stripes and whisker snout
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Ears -->
        <circle cx="24" cy="34" r="12" fill="#F59E0B" stroke="#111827" stroke-width="2"/>
        <circle cx="76" cy="34" r="12" fill="#F59E0B" stroke="#111827" stroke-width="2"/>
        <circle cx="24" cy="34" r="6" fill="#461D7C"/>
        <circle cx="76" cy="34" r="6" fill="#461D7C"/>
        <!-- Head -->
        <circle cx="50" cy="54" r="32" fill="#F59E0B" stroke="#111827" stroke-width="2.5"/>
        <!-- Tiger Stripes -->
        <path d="M50 26 L50 36 M42 28 L46 38 M58 28 L54 38" stroke="#111827" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M22 50 L32 52 M22 58 L30 58" stroke="#111827" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M78 50 L68 52 M78 58 L70 58" stroke="#111827" stroke-width="2.5" stroke-linecap="round"/>
        <!-- Eyes -->
        <ellipse cx="38" cy="48" rx="5" ry="4" fill="#FDD023" stroke="#111827" stroke-width="1.5"/>
        <ellipse cx="62" cy="48" rx="5" ry="4" fill="#FDD023" stroke="#111827" stroke-width="1.5"/>
        <circle cx="38" cy="48" r="2.5" fill="#111827"/>
        <circle cx="62" cy="48" r="2.5" fill="#111827"/>
        <!-- Snout -->
        <ellipse cx="50" cy="66" rx="16" ry="12" fill="#FFFFFF" stroke="#111827" stroke-width="2"/>
        <path d="M45 58 Q50 54 55 58 Q50 64 45 58 Z" fill="#461D7C"/>
        <!-- Smile -->
        <path d="M42 68 Q50 74 58 68" stroke="#111827" stroke-width="2" fill="none"/>
      </svg>
    `
  },

  'michigan': {
    name: 'The Wolverine',
    pawColor: '#00274c',
    pawBorder: '#ffcb05',
    // Wolverine: Maize & Blue fierce wolverine head
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Ears -->
        <path d="M24 24 L34 40 L18 40 Z" fill="#00274C" stroke="#111827" stroke-width="2"/>
        <path d="M76 24 L82 40 L66 40 Z" fill="#00274C" stroke="#111827" stroke-width="2"/>
        <!-- Head -->
        <ellipse cx="50" cy="54" rx="34" ry="28" fill="#00274C" stroke="#111827" stroke-width="2.5"/>
        <!-- Maize Face Mask -->
        <path d="M30 42 C40 38 60 38 70 42 C76 56 64 68 50 68 C36 68 24 56 30 42 Z" fill="#FFCB05" stroke="#111827" stroke-width="2"/>
        <!-- Eyes -->
        <ellipse cx="38" cy="48" rx="4.5" ry="3.5" fill="#111827"/>
        <ellipse cx="62" cy="48" rx="4.5" ry="3.5" fill="#111827"/>
        <circle cx="39" cy="47" r="1" fill="#FFFFFF"/>
        <circle cx="63" cy="47" r="1" fill="#FFFFFF"/>
        <!-- Snout -->
        <ellipse cx="50" cy="62" rx="10" ry="7" fill="#00274C" stroke="#111827" stroke-width="1.5"/>
        <circle cx="50" cy="59" r="3" fill="#111827"/>
        <!-- Fangs -->
        <polygon points="44,66 46,72 48,66" fill="#FFFFFF"/>
        <polygon points="52,66 54,72 56,66" fill="#FFFFFF"/>
      </svg>
    `
  },

  'notre-dame': {
    name: 'The Leprechaun',
    pawColor: '#0c2340',
    pawBorder: '#c99700',
    // Leprechaun: Green derby hat with shamrock, red beard, and determined eyes
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Green Derby Hat -->
        <path d="M30 36 C30 14 70 14 70 36 Z" fill="#00843D" stroke="#111827" stroke-width="2.5"/>
        <rect x="20" y="34" width="60" height="8" rx="3" fill="#00843D" stroke="#111827" stroke-width="2"/>
        <rect x="30" y="30" width="40" height="5" fill="#C99700"/>
        <!-- Shamrock on hat -->
        <circle cx="38" cy="24" r="3" fill="#FFFFFF"/>
        <circle cx="44" cy="24" r="3" fill="#FFFFFF"/>
        <circle cx="41" cy="20" r="3" fill="#FFFFFF"/>
        <!-- Head -->
        <circle cx="50" cy="54" r="24" fill="#FED7AA" stroke="#111827" stroke-width="2"/>
        <!-- Irish Red Beard -->
        <path d="M30 56 C26 78 74 78 70 56 C64 72 36 72 30 56 Z" fill="#EA580C" stroke="#111827" stroke-width="2"/>
        <!-- Eyes -->
        <ellipse cx="42" cy="50" rx="3.5" ry="4.5" fill="#111827"/>
        <ellipse cx="58" cy="50" rx="3.5" ry="4.5" fill="#111827"/>
        <circle cx="43" cy="49" r="1.5" fill="#FFFFFF"/>
        <circle cx="59" cy="49" r="1.5" fill="#FFFFFF"/>
        <!-- Nose -->
        <circle cx="50" cy="56" r="3" fill="#FDBA74" stroke="#111827" stroke-width="1"/>
        <!-- Smirk -->
        <path d="M44 62 Q50 66 56 62" stroke="#111827" stroke-width="2" fill="none"/>
      </svg>
    `
  },

  'tennessee': {
    name: 'Smokey the Bluetick Coonhound',
    pawColor: '#ff8200',
    pawBorder: '#ffffff',
    // Smokey: Floppy hound ears, orange/white checker collar, hound eyes
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Floppy Hound Ears -->
        <path d="M22 34 C8 34 10 74 24 78 C28 72 26 50 26 38 Z" fill="#1E293B" stroke="#111827" stroke-width="2"/>
        <path d="M78 34 C92 34 90 74 76 78 C72 72 74 50 74 38 Z" fill="#1E293B" stroke="#111827" stroke-width="2"/>
        <!-- Head -->
        <ellipse cx="50" cy="52" rx="30" ry="28" fill="#F3F4F6" stroke="#111827" stroke-width="2.5"/>
        <!-- Bluetick spots -->
        <circle cx="34" cy="40" r="4" fill="#334155"/>
        <circle cx="64" cy="38" r="5" fill="#334155"/>
        <!-- Eyes -->
        <circle cx="38" cy="48" r="5.5" fill="#78350F" stroke="#111827" stroke-width="1.5"/>
        <circle cx="62" cy="48" r="5.5" fill="#78350F" stroke="#111827" stroke-width="1.5"/>
        <circle cx="38" cy="48" r="3" fill="#111827"/>
        <circle cx="62" cy="48" r="3" fill="#111827"/>
        <circle cx="39" cy="46" r="1" fill="#FFFFFF"/>
        <circle cx="63" cy="46" r="1" fill="#FFFFFF"/>
        <!-- Snout -->
        <ellipse cx="50" cy="64" rx="14" ry="11" fill="#FFFFFF" stroke="#111827" stroke-width="2"/>
        <path d="M44 58 Q50 54 56 58 Q50 65 44 58 Z" fill="#111827"/>
        <path d="M46 68 Q50 76 54 68" fill="#EF4444"/>
        <!-- Tennessee Orange Collar -->
        <rect x="28" y="76" width="44" height="10" rx="3" fill="#FF8200" stroke="#111827" stroke-width="2"/>
      </svg>
    `
  },

  'clemson': {
    name: 'The Tiger',
    pawColor: '#f56600',
    pawBorder: '#522d80',
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="34" r="12" fill="#F56600" stroke="#111827" stroke-width="2"/>
        <circle cx="76" cy="34" r="12" fill="#F56600" stroke="#111827" stroke-width="2"/>
        <circle cx="50" cy="54" r="32" fill="#F56600" stroke="#111827" stroke-width="2.5"/>
        <path d="M50 26 L50 36 M42 28 L46 38 M58 28 L54 38" stroke="#111827" stroke-width="2.5" stroke-linecap="round"/>
        <ellipse cx="38" cy="48" rx="5" ry="4" fill="#FFFFFF" stroke="#111827" stroke-width="1.5"/>
        <ellipse cx="62" cy="48" rx="5" ry="4" fill="#FFFFFF" stroke="#111827" stroke-width="1.5"/>
        <circle cx="38" cy="48" r="3" fill="#111827"/>
        <circle cx="62" cy="48" r="3" fill="#111827"/>
        <ellipse cx="50" cy="66" rx="16" ry="12" fill="#FFFFFF" stroke="#111827" stroke-width="2"/>
        <polygon points="44,58 56,58 50,65" fill="#522D80"/>
      </svg>
    `
  },

  'penn-state': {
    name: 'The Nittany Lion',
    pawColor: '#041e42',
    pawBorder: '#ffffff',
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 36 C14 26 18 48 26 48 Z" fill="#D97706" stroke="#111827" stroke-width="2"/>
        <path d="M78 36 C86 26 82 48 74 48 Z" fill="#D97706" stroke="#111827" stroke-width="2"/>
        <circle cx="50" cy="52" r="30" fill="#FBBF24" stroke="#111827" stroke-width="2.5"/>
        <!-- Blue Penn State Scarf -->
        <rect x="26" y="74" width="48" height="12" rx="4" fill="#041E42" stroke="#111827" stroke-width="2"/>
        <!-- Eyes -->
        <ellipse cx="38" cy="46" rx="5" ry="4" fill="#041E42"/>
        <ellipse cx="62" cy="46" rx="5" ry="4" fill="#041E42"/>
        <circle cx="39" cy="45" r="1.5" fill="#FFFFFF"/>
        <circle cx="63" cy="45" r="1.5" fill="#FFFFFF"/>
        <!-- Snout -->
        <ellipse cx="50" cy="62" rx="14" ry="10" fill="#FEF3C7" stroke="#111827" stroke-width="2"/>
        <polygon points="45,56 55,56 50,62" fill="#111827"/>
      </svg>
    `
  },

  'usc': {
    name: 'Tommy Trojan',
    pawColor: '#990000',
    pawBorder: '#ffc72c',
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Gold Spartan Helmet -->
        <path d="M28 44 C28 18 72 18 72 44 L70 76 L30 76 Z" fill="#FFC72C" stroke="#111827" stroke-width="2.5"/>
        <!-- Red Plume Crest -->
        <path d="M44 26 C44 8 56 8 56 26 Z" fill="#990000" stroke="#111827" stroke-width="2"/>
        <path d="M38 28 C38 12 62 12 62 28 Z" fill="#990000" stroke="#111827" stroke-width="1.5"/>
        <!-- T-visor opening -->
        <polygon points="46,38 54,38 54,70 46,70" fill="#111827"/>
        <polygon points="34,44 66,44 66,52 34,52" fill="#111827"/>
        <!-- Determined Eyes in visor -->
        <circle cx="42" cy="48" r="2.5" fill="#FFFFFF"/>
        <circle cx="58" cy="48" r="2.5" fill="#FFFFFF"/>
      </svg>
    `
  },

  'miami': {
    name: 'Sebastian the Ibis',
    pawColor: '#f47321',
    pawBorder: '#005030',
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Green/Orange Sailor Cap -->
        <path d="M32 32 C32 16 68 16 68 32 Z" fill="#005030" stroke="#111827" stroke-width="2"/>
        <rect x="28" y="30" width="44" height="6" rx="2" fill="#F47321"/>
        <!-- Ibis Head -->
        <circle cx="50" cy="50" r="28" fill="#FFFFFF" stroke="#111827" stroke-width="2.5"/>
        <!-- Curved Ibis Beak -->
        <path d="M44 54 C44 76 60 84 66 84 C64 78 54 66 54 54 Z" fill="#F47321" stroke="#111827" stroke-width="2"/>
        <!-- Angry/Fierce Eyes -->
        <ellipse cx="38" cy="46" rx="6" ry="4" fill="#111827"/>
        <circle cx="39" cy="45" r="2" fill="#FFFFFF"/>
      </svg>
    `
  },

  'wisconsin': {
    name: 'Bucky Badger',
    pawColor: '#c5050c',
    pawBorder: '#ffffff',
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Ears -->
        <circle cx="26" cy="36" r="10" fill="#111827"/>
        <circle cx="74" cy="36" r="10" fill="#111827"/>
        <!-- Head -->
        <circle cx="50" cy="54" r="30" fill="#F3F4F6" stroke="#111827" stroke-width="2.5"/>
        <!-- Badger Stripes -->
        <path d="M32 34 L38 64 M68 34 L62 64" stroke="#111827" stroke-width="7" stroke-linecap="round"/>
        <!-- Eyes -->
        <circle cx="38" cy="48" r="3.5" fill="#FFFFFF"/>
        <circle cx="62" cy="48" r="3.5" fill="#FFFFFF"/>
        <!-- Snout -->
        <ellipse cx="50" cy="64" rx="10" ry="7" fill="#FFFFFF" stroke="#111827" stroke-width="1.5"/>
        <circle cx="50" cy="60" r="3" fill="#111827"/>
        <!-- Red/White Striped Sweater -->
        <rect x="26" y="76" width="48" height="12" rx="3" fill="#C5050C" stroke="#111827" stroke-width="2"/>
        <rect x="36" y="76" width="8" height="12" fill="#FFFFFF"/>
        <rect x="56" y="76" width="8" height="12" fill="#FFFFFF"/>
      </svg>
    `
  },

  'florida-state': {
    name: 'Chief Osceola & Cimarron',
    pawColor: '#782f40',
    pawBorder: '#ceb888',
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Feathers -->
        <path d="M38 10 C34 26 44 32 44 32 Z" fill="#782F40" stroke="#111827" stroke-width="1.5"/>
        <path d="M46 6 C42 24 52 30 52 30 Z" fill="#CEB888" stroke="#111827" stroke-width="1.5"/>
        <!-- Head -->
        <circle cx="50" cy="52" r="26" fill="#D97706" stroke="#111827" stroke-width="2.5"/>
        <!-- Headband -->
        <rect x="24" y="40" width="52" height="7" fill="#782F40" stroke="#111827" stroke-width="1.5"/>
        <circle cx="50" cy="43.5" r="2.5" fill="#CEB888"/>
        <!-- Eyes -->
        <circle cx="40" cy="52" r="3.5" fill="#111827"/>
        <circle cx="60" cy="52" r="3.5" fill="#111827"/>
        <!-- War Paint -->
        <path d="M34 58 L42 60 M66 58 L58 60" stroke="#782F40" stroke-width="2.5"/>
      </svg>
    `
  },

  'colorado': {
    name: 'Ralphie & Chip the Buffalo',
    pawColor: '#cfb87c',
    pawBorder: '#000000',
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Horns -->
        <path d="M26 38 C14 26 22 14 30 22 Z" fill="#CFB87C" stroke="#111827" stroke-width="2"/>
        <path d="M74 38 C86 26 78 14 70 22 Z" fill="#CFB87C" stroke="#111827" stroke-width="2"/>
        <!-- Furry Buffalo Head -->
        <circle cx="50" cy="52" r="30" fill="#451A03" stroke="#111827" stroke-width="2.5"/>
        <!-- Fur tuft -->
        <circle cx="50" cy="30" r="14" fill="#78350F"/>
        <!-- Eyes -->
        <circle cx="38" cy="48" r="4.5" fill="#111827"/>
        <circle cx="62" cy="48" r="4.5" fill="#111827"/>
        <circle cx="39" cy="47" r="1.5" fill="#FFFFFF"/>
        <circle cx="63" cy="47" r="1.5" fill="#FFFFFF"/>
        <!-- Snout -->
        <ellipse cx="50" cy="64" rx="14" ry="10" fill="#1C1917" stroke="#111827" stroke-width="2"/>
        <circle cx="44" cy="64" r="2.5" fill="#78350F"/>
        <circle cx="56" cy="64" r="2.5" fill="#78350F"/>
      </svg>
    `
  },

  'missouri': {
    name: 'Truman the Tiger',
    pawColor: '#f1b82d',
    pawBorder: '#000000',
    photoUrl: '/mascots/missouri.png'
  },

  'mississippi-state': {
    name: 'Bully the Bulldog',
    pawColor: '#660000',
    pawBorder: '#ffffff',
    photoUrl: '/mascots/mississippi-state.png'
  },

  'ole-miss': {
    name: 'Tony the Landshark',
    pawColor: '#13294b',
    pawBorder: '#ce1126',
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Shark Fin on Head -->
        <path d="M50 16 L62 38 L38 38 Z" fill="#1E3A8A" stroke="#111827" stroke-width="2"/>
        <!-- Head -->
        <ellipse cx="50" cy="54" rx="34" ry="28" fill="#1E3A8A" stroke="#111827" stroke-width="2.5"/>
        <!-- Shark Face / Snout -->
        <path d="M22 52 C22 36 78 36 78 52 C78 74 65 82 50 82 C35 82 22 74 22 52 Z" fill="#93C5FD" stroke="#111827" stroke-width="2"/>
        <!-- Eyes -->
        <circle cx="36" cy="46" r="5" fill="#111827"/>
        <circle cx="64" cy="46" r="5" fill="#111827"/>
        <circle cx="37" cy="44" r="1.5" fill="#FFFFFF"/>
        <circle cx="65" cy="44" r="1.5" fill="#FFFFFF"/>
        <!-- Sharp Shark Teeth -->
        <polygon points="32,66 36,60 40,66" fill="#FFFFFF" stroke="#111827" stroke-width="1"/>
        <polygon points="40,66 44,60 48,66" fill="#FFFFFF" stroke="#111827" stroke-width="1"/>
        <polygon points="48,66 52,60 56,66" fill="#FFFFFF" stroke="#111827" stroke-width="1"/>
        <polygon points="56,66 60,60 64,66" fill="#FFFFFF" stroke="#111827" stroke-width="1"/>
        <polygon points="64,66 68,60 72,66" fill="#FFFFFF" stroke="#111827" stroke-width="1"/>
        <!-- Red Collar -->
        <rect x="26" y="80" width="48" height="8" rx="2" fill="#CE1126" stroke="#111827" stroke-width="1.5"/>
      </svg>
    `
  },

  'vanderbilt': {
    name: 'Mr. Commodore (Mr. C)',
    pawColor: '#866d4b',
    pawBorder: '#000000',
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Naval Captain Bicorne Hat -->
        <path d="M16 42 C20 18 80 18 84 42 Z" fill="#0F172A" stroke="#111827" stroke-width="2.5"/>
        <path d="M14 42 Q50 34 86 42 Q50 46 14 42 Z" fill="#CA8A04" stroke="#111827" stroke-width="1.5"/>
        <!-- Gold Star on Hat -->
        <circle cx="50" cy="28" r="4" fill="#EAB308"/>
        <!-- Face -->
        <circle cx="50" cy="56" r="26" fill="#FED7AA" stroke="#111827" stroke-width="2"/>
        <!-- Eyes -->
        <circle cx="40" cy="52" r="4" fill="#111827"/>
        <circle cx="60" cy="52" r="4" fill="#111827"/>
        <circle cx="41" cy="50" r="1.5" fill="#FFFFFF"/>
        <circle cx="61" cy="50" r="1.5" fill="#FFFFFF"/>
        <!-- Commodore White Mustache -->
        <path d="M30 64 C36 58 48 64 50 64 C52 64 64 58 70 64 C64 74 36 74 30 64 Z" fill="#F8FAFC" stroke="#111827" stroke-width="2"/>
      </svg>
    `
  }
};

export const REAL_MASCOT_PHOTOS = {
  // SEC (Complete 16 Mascot Roster)
  'georgia': '/mascots/georgia.png',
  'alabama': '/mascots/alabama.png',
  'texas': '/mascots/texas.png',
  'florida': '/mascots/florida.png',
  'lsu': '/mascots/lsu.png',
  'tennessee': '/mascots/tennessee.png',
  'auburn': '/mascots/auburn.png',
  'oklahoma': '/mascots/oklahoma.png',
  'texas-am': '/mascots/texas-am.png',
  'south-carolina': '/mascots/south-carolina.png',
  'arkansas': '/mascots/arkansas.png',
  'kentucky': '/mascots/kentucky.png',
  'missouri': '/mascots/missouri.png',
  'mississippi-state': '/mascots/mississippi-state.png',

  // Big Ten
  'ohio-state': '/mascots/ohio-state.png',
  'oregon': '/mascots/oregon.png',
  'michigan': '/mascots/michigan.png',
  'penn-state': '/mascots/penn-state.png',
  'wisconsin': '/mascots/wisconsin.png',
  'usc': '/mascots/usc.png',
  'michigan-state': '/mascots/michigan-state.png',
  'washington': '/mascots/washington.png',
  'iowa': '/mascots/iowa.png',

  // ACC
  'clemson': '/mascots/clemson.png',
  'florida-state': '/mascots/florida-state.png',
  'miami': '/mascots/miami.png',

  // Big 12
  'colorado': '/mascots/colorado.png',

  // Independents
  'notre-dame': '/mascots/notre-dame.png'
};

/**
 * Mascot Generator for any FBS team
 * Returns official photorealistic sideline costume headshot or stylized mascot character
 */
export function getMascotForTeam(team) {
  if (!team) return null;
  const tid = team.id?.toLowerCase() || '';
  const photoUrl = REAL_MASCOT_PHOTOS[tid] || null;

  if (MASCOT_REGISTRY[tid]) {
    return {
      ...MASCOT_REGISTRY[tid],
      photoUrl,
      teamName: team.name,
      teamId: team.id
    };
  }

  // Create a stylized character mascot matching team nickname/colors
  const primaryColor = team.colors?.primary || '#f59e0b';
  const secondaryColor = team.colors?.secondary || '#ffffff';
  const nickname = team.nickname || 'Mascot';

  return {
    name: `${nickname} Character`,
    photoUrl,
    pawColor: primaryColor,
    pawBorder: secondaryColor,
    svg: `
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Athletic Mascot Head -->
        <circle cx="26" cy="32" r="10" fill="${primaryColor}" stroke="#111827" stroke-width="2"/>
        <circle cx="74" cy="32" r="10" fill="${primaryColor}" stroke="#111827" stroke-width="2"/>
        <circle cx="50" cy="52" r="30" fill="${primaryColor}" stroke="#111827" stroke-width="2.5"/>
        <!-- Face Plate -->
        <ellipse cx="50" cy="56" rx="20" ry="18" fill="${secondaryColor}" stroke="#111827" stroke-width="1.5"/>
        <!-- Fierce Eyes -->
        <circle cx="40" cy="48" r="5" fill="#111827"/>
        <circle cx="60" cy="48" r="5" fill="#111827"/>
        <circle cx="41" cy="46" r="2" fill="#FFFFFF"/>
        <circle cx="61" cy="46" r="2" fill="#FFFFFF"/>
        <!-- Snout -->
        <ellipse cx="50" cy="64" rx="10" ry="7" fill="${primaryColor}" stroke="#111827" stroke-width="1.5"/>
        <circle cx="50" cy="62" r="2.5" fill="#111827"/>
        <!-- Team Initial Cap -->
        <rect x="36" y="24" width="28" height="10" rx="3" fill="#111827"/>
        <text x="50" y="32" font-size="8" font-weight="900" fill="#FFFFFF" text-anchor="middle" font-family="sans-serif">${team.abbreviation?.substring(0, 3) || 'CFB'}</text>
      </svg>
    `
  };
}
