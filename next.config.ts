import type { NextConfig } from "next";

// Security headers applied to every route. Kept intentionally conservative:
// no strict Content-Security-Policy because the site embeds Crisp, Google
// Tag Manager, Google Analytics, Facebook Pixel, Hotjar and Stripe.js via
// inline <script> blocks, and a strict CSP would need per-script nonces
// and a refactor. HSTS / frame-options / nosniff / referrer / permissions
// policy cover the easy wins without breaking third-party scripts.
const securityHeaders = [
  {
    // 2 years, include subdomains, opt-in to the HSTS preload list once
    // stable. This only applies once the browser has seen the header
    // over HTTPS, so local HTTP dev is unaffected.
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    // Block the entire site from being iframed. The ticket, pass and
    // giveaway pages should never be embedded by a third party.
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Stop browsers guessing MIME types on our responses — defends
    // against some MIME-confusion XSS tricks.
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Send the full referer on same-origin navigation, just the origin
    // on cross-origin, and nothing on HTTPS->HTTP downgrade.
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Deny powerful APIs we do not use. Keeps malicious third-party
    // scripts from accessing camera/mic/location if they ever land.
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(self), fullscreen=(self)",
  },
  {
    // Opts this site out of Google FLoC / Topics interest-group
    // tracking so our visitors are not auto-enrolled.
    key: "Permissions-Policy-Report-Only",
    value: "interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.volumebrussels.com",
          },
        ],
        destination: "https://volumebrussels.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
