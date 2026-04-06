interface OfferCardProps {
  name: string;
  description: string;
  imageUrl?: string;
  musicTags?: string[];
  dresscodeTags?: string[];
  openDays?: string[];
  openTime?: string;
  closeTime?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  websiteUrl?: string;
}

function formatHour(h: string): string {
  const n = parseInt(h, 10);
  if (isNaN(n)) return h;
  if (n === 0 || n === 24) return "12am";
  if (n === 12) return "12pm";
  return n > 12 ? `${n - 12}pm` : `${n}am`;
}

function formatDays(days: string[]): string {
  return days
    .map((d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase())
    .join(", ");
}

export default function OfferCard({
  name,
  description,
  imageUrl,
  musicTags = [],
  dresscodeTags = [],
  openDays = [],
  openTime,
  closeTime,
  instagramUrl,
  facebookUrl,
}: OfferCardProps) {
  const hasHours = openTime && closeTime;

  return (
    <div className="bg-white border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300 group">
      {/* Image */}
      {imageUrl ? (
        <div className="w-full h-72 bg-gray-900 overflow-hidden">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      ) : (
        <div className="w-full h-72 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400 text-sm uppercase tracking-wide">Photo</span>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Name */}
        <h3 className="text-xl font-extrabold text-gray-900">{name}</h3>

        {/* Description */}
        <p className="text-gray-500 text-sm mt-2 leading-relaxed">{description}</p>

        {/* Music Tags */}
        {musicTags.length > 0 && (
          <p className="mt-5 text-sm font-bold text-gray-900 uppercase tracking-wide">
            {musicTags.join(", ")}
          </p>
        )}

        {/* Days + Hours */}
        <div className="mt-2 space-y-0.5">
          {openDays.length > 0 && (
            <p className="text-sm text-gray-500">{formatDays(openDays)}</p>
          )}
          {hasHours && (
            <p className="text-sm text-gray-500">
              {formatHour(openTime)} - {formatHour(closeTime)}
            </p>
          )}
        </div>

        {/* Dresscode Tags */}
        {dresscodeTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {dresscodeTags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-semibold uppercase tracking-wider border border-gray-900 text-gray-900 px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Social Links */}
        {(instagramUrl || facebookUrl) && (
          <div className="flex gap-3 mt-5">
            {instagramUrl && (
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer" aria-label={`${name} Instagram`} className="text-gray-400 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
            )}
            {facebookUrl && (
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" aria-label={`${name} Facebook`} className="text-gray-400 hover:text-gray-900 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
