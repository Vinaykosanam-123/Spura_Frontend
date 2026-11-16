import type { VisualizerSlug } from '@/lib/visualizers/catalog';

export default function VisualizerGlyph({ slug, className = '' }: { slug: VisualizerSlug; className?: string }) {
  const common = {
    viewBox: '0 0 64 48',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  };

  if (slug === 'sorting') {
    return (
      <svg {...common}>
        <rect x="6" y="30" width="7" height="12" rx="1.5" />
        <rect x="17" y="21" width="7" height="21" rx="1.5" />
        <rect x="28" y="12" width="7" height="30" rx="1.5" />
        <rect x="39" y="25" width="7" height="17" rx="1.5" />
        <rect x="50" y="6" width="7" height="36" rx="1.5" />
      </svg>
    );
  }

  if (slug === 'stack-queue') {
    return (
      <svg {...common}>
        <rect x="9" y="29" width="20" height="6" rx="1.5" />
        <rect x="9" y="21" width="20" height="6" rx="1.5" />
        <rect x="9" y="13" width="20" height="6" rx="1.5" />
        <path d="M35 16h18M35 24h18M35 32h18" />
        <path d="M50 13l3 3-3 3M50 29l3 3-3 3" />
      </svg>
    );
  }

  if (slug === 'linked-list') {
    return (
      <svg {...common}>
        <rect x="4" y="19" width="14" height="12" rx="2" />
        <rect x="25" y="19" width="14" height="12" rx="2" />
        <rect x="46" y="19" width="14" height="12" rx="2" />
        <path d="M18 25h7M39 25h7M50 31v6" />
        <circle cx="50" cy="40" r="2.5" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (slug === 'bst') {
    return (
      <svg {...common}>
        <circle cx="32" cy="9" r="5" />
        <circle cx="17" cy="25" r="5" />
        <circle cx="47" cy="25" r="5" />
        <circle cx="10" cy="41" r="4" />
        <circle cx="24" cy="41" r="4" />
        <path d="M28.5 13.5L20.5 20.5M35.5 13.5L43.5 20.5M14 29.5L11.5 37M20 29.5L22.5 37" />
      </svg>
    );
  }

  if (slug === 'graph') {
    return (
      <svg {...common}>
        <circle cx="13" cy="12" r="5" />
        <circle cx="51" cy="10" r="5" />
        <circle cx="10" cy="38" r="5" />
        <circle cx="32" cy="25" r="5" />
        <circle cx="53" cy="38" r="5" />
        <path d="M17 16l10 5M27 21l-12 13M37 25l10 9M32 20l15-6" />
      </svg>
    );
  }

  if (slug === 'heap') {
    return (
      <svg {...common}>
        <circle cx="32" cy="10" r="5" />
        <circle cx="18" cy="27" r="5" />
        <circle cx="46" cy="27" r="5" />
        <path d="M28.5 14.5L21.5 22.5M35.5 14.5L42.5 22.5" />
        <rect x="14" y="38" width="8" height="6" rx="1.5" />
        <rect x="28" y="38" width="8" height="6" rx="1.5" />
        <rect x="42" y="38" width="8" height="6" rx="1.5" />
      </svg>
    );
  }

  if (slug === 'avl') {
    return (
      <svg {...common}>
        <circle cx="24" cy="12" r="5" />
        <circle cx="44" cy="26" r="5" />
        <circle cx="14" cy="26" r="5" />
        <path d="M28 14l11 8M20 14L15 21" />
        <path d="M46 36a8 8 0 1 0 6 4" />
        <path d="M49 37l3 3 2-4" />
      </svg>
    );
  }

  if (slug === 'trie') {
    return (
      <svg {...common}>
        <circle cx="10" cy="24" r="5" />
        <circle cx="32" cy="12" r="5" />
        <circle cx="32" cy="36" r="5" />
        <circle cx="54" cy="12" r="5" />
        <path d="M15 22l12-8M15 26l12 8M37 12h12" />
        <path d="M7 15v-4h4" />
      </svg>
    );
  }

  if (slug === 'recursion') {
    return (
      <svg {...common}>
        <rect x="18" y="6" width="28" height="10" rx="2" />
        <rect x="14" y="20" width="36" height="10" rx="2" />
        <rect x="10" y="34" width="44" height="10" rx="2" />
      </svg>
    );
  }

  if (slug === 'dp') {
    return (
      <svg {...common}>
        <rect x="6" y="8" width="12" height="9" rx="1.5" />
        <rect x="22" y="8" width="12" height="9" rx="1.5" />
        <rect x="38" y="8" width="12" height="9" rx="1.5" />
        <rect x="6" y="21" width="12" height="9" rx="1.5" />
        <rect x="22" y="21" width="12" height="9" rx="1.5" />
        <rect x="38" y="21" width="12" height="9" rx="1.5" />
        <rect x="6" y="34" width="12" height="9" rx="1.5" />
        <rect x="22" y="34" width="12" height="9" rx="1.5" />
        <rect x="38" y="34" width="12" height="9" rx="1.5" />
        <path d="M52 12h6M52 25h6M52 38h6" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect x="6" y="6" width="16" height="11" rx="2" />
      <rect x="6" y="21" width="16" height="11" rx="2" />
      <rect x="6" y="36" width="16" height="6" rx="2" />
      <circle cx="42" cy="11" r="5" />
      <circle cx="42" cy="26" r="5" />
      <path d="M22 11h15M22 26h15M47 16v5" />
    </svg>
  );
}
