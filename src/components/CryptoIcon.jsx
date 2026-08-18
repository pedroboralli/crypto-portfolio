import { useState } from 'react';
import { getCryptoIconUrl, DefaultCryptoIcon } from '../utils/cryptoIcons';

function CryptoIcon({ symbol, name, imageUrl, size = 'large', className = '' }) {
  const [imageError, setImageError] = useState(false);
  const iconUrl = imageUrl || getCryptoIconUrl(symbol, size);

  // Determine size classes
  const sizeClass = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-10 h-10',
    xlarge: 'w-12 h-12',
  }[size] || 'w-8 h-8';

  if (!iconUrl || imageError) {
    return (
      <div className={`${sizeClass} ${className} flex-shrink-0`}>
        <DefaultCryptoIcon className={sizeClass} />
      </div>
    );
  }

  return (
    <div className={`${sizeClass} ${className} flex-shrink-0 relative group`}>
      <img
        src={iconUrl}
        alt={name || symbol}
        className={`${sizeClass} rounded-full object-cover transition-transform group-hover:scale-110`}
        onError={() => setImageError(true)}
        loading="lazy"
      />
      {/* Subtle glow effect */}
      <div className="absolute inset-0 rounded-full bg-primary-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
    </div>
  );
}

export default CryptoIcon;
