import Link from "next/link";

interface PricingCardProps {
  title: string;
  price: string;
  subtitle: string;
  features: string[];
  filled?: boolean;
}

export default function PricingCard({ title, price, subtitle, features, filled = false }: PricingCardProps) {
  return (
    <div className="border border-gray-200 p-8 flex flex-col items-center text-center w-full max-w-sm">
      <h3 className="text-2xl font-extrabold uppercase tracking-wide">{title}</h3>
      <p className="text-4xl font-extrabold mt-4">{price}</p>
      <p className="text-gray-500 mt-2 text-sm">{subtitle}</p>

      <ul className="mt-8 space-y-3 w-full text-left">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 text-black font-bold">&#10003;</span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href="#"
        className={`mt-8 w-full py-3 text-sm font-semibold uppercase tracking-wide text-center transition-colors ${
          filled
            ? "bg-black text-white hover:bg-gray-900"
            : "border-2 border-black text-black hover:bg-black hover:text-white"
        }`}
      >
        Buy Now
      </Link>
    </div>
  );
}
