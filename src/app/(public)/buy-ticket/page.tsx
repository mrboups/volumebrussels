import PricingCard from "@/components/PricingCard";

export default function BuyTicketPage() {
  return (
    <section className="py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-medium">
            Your all-access pass to the city: choose your option
          </h1>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center sm:items-stretch justify-center gap-8">
          <PricingCard
            title="Night Pass"
            price="&euro;29"
            subtitle="One night of clubbing."
            features={[
              "Skip Line Access to 2 Clubs",
              "Free Access to Atomium & Brussels Design Museum",
              "Free Access to 5 Brussels Museums",
            ]}
            filled={false}
            passType="night"
          />
          <PricingCard
            title="Weekend Pass"
            price="&euro;48"
            subtitle="48h Clubbing Weekend"
            features={[
              "Free Unlimited Access to all clubs",
              "Free Access to Atomium & Brussels Design Museum",
              "Free Access to 5 Brussels Museums",
            ]}
            filled={true}
            passType="weekend"
          />
        </div>
      </div>
    </section>
  );
}
