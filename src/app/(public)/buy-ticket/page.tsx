import PricingCard from "@/components/PricingCard";
import FAQ from "@/components/FAQ";

export default function BuyTicketPage() {
  return (
    <>
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

      {/* FAQ Section */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-center">
            Frequently Asked Questions
          </h2>
          <div className="mt-4 text-center">
            <p className="text-gray-600">More questions?</p>
            <p className="text-gray-600">
              Contact us using the online chat at the bottom right of this page.
            </p>
            <p className="text-gray-500 text-sm mt-1">
              (office hours, friday and saturday until 2am)
            </p>
          </div>
          <div className="mt-10">
            <FAQ />
          </div>
        </div>
      </section>
    </>
  );
}
