export function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OpenBook",
  description: "Enterprise-grade financial management platform",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  logo: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/android-chrome-512x512.png`,
  sameAs: ["https://github.com/muhammad-fiaz/openbook"],
  author: {
    "@type": "Person",
    name: "Muhammad Fiaz",
    url: "https://github.com/muhammad-fiaz",
  },
};

export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "OpenBook",
  description: "Financial management platform for invoicing, payments, and reporting",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};
