import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://volumebrussels.com"),
  title: {
    default: "Volume Brussels | One night access pass to all major clubs and parties every friday or saturday",
    template: "%s | Volume Brussels",
  },
  description:
    "Volume Brussels is a one night access pass to all major clubs and parties every friday or saturday, as well as typical city attractions.",
  keywords: [
    "Brussels nightlife",
    "Brussels clubs",
    "nightclub pass",
    "Brussels party",
    "club pass",
    "Brussels tickets",
    "Fuse",
    "C12",
    "Spirito",
    "Mirano",
    "Madame Moustache",
    "Atomium",
    "Brussels tourism",
    "weekend pass",
  ],
  authors: [{ name: "Volume Brussels" }],
  creator: "Volume Brussels",
  publisher: "PLAY ASBL",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  alternates: {
    canonical: "https://volumebrussels.com/",
  },
  openGraph: {
    title: "Volume Brussels | Nightlife Pass",
    description:
      "Volume Brussels is a one night access pass to all major clubs and parties every friday or saturday, as well as typical city attractions.",
    url: "https://volumebrussels.com/",
    siteName: "Volume Brussels",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Volume Brussels — Brussels Nightlife in One Pass",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Volume Brussels | Nightlife Pass",
    description:
      "Volume Brussels is a one night access pass to all major clubs and parties every friday or saturday, as well as typical city attractions.",
    images: ["/hero.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "application-name": "Volume Brussels",
    "apple-mobile-web-app-title": "Volume Brussels",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <head>
        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Volume Brussels",
              url: "https://volumebrussels.com",
              logo: "https://volumebrussels.com/logo.svg",
              description:
                "Volume Brussels is a one night access pass to all major clubs and parties every friday or saturday, as well as typical city attractions.",
              sameAs: [
                "https://www.facebook.com/volume.brussels",
                "https://www.instagram.com/volume.brussels",
              ],
              address: {
                "@type": "PostalAddress",
                streetAddress: "Rue Nestor de Tière 35",
                addressLocality: "Brussels",
                postalCode: "1030",
                addressCountry: "BE",
              },
              email: "volumebrussels@gmail.com",
            }),
          }}
        />
        {/* Crisp Chat — forced right position via CSS override */}
        <style dangerouslySetInnerHTML={{ __html: `.crisp-client .cc-1brb6 { right: 20px !important; left: auto !important; }` }} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.$crisp=[];window.CRISP_WEBSITE_ID="bc17566d-d0af-44d8-88d2-87b545df24ab";(function(){d=document;s=d.createElement("script");s.src="https://client.crisp.chat/l.js";s.async=1;d.getElementsByTagName("head")[0].appendChild(s);})();`,
          }}
        />
        {/* Facebook Pixel */}
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','1061230591722350');fbq('track','PageView');`,
          }}
        />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=UA-3895408-3" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','UA-3895408-3');`,
          }}
        />
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-TKN45GW7');`,
          }}
        />
        {/* Hotjar */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:2920939,hjsv:6};a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`,
          }}
        />
{/* Weglot removed — project deleted */}
      </head>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-montserrat)]">
        {children}
      </body>
    </html>
  );
}
