import { Info } from 'lucide-react';

export function AlgorithmExplainer() {
  return (
    <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
      <h3 className="font-serif text-lg font-semibold text-taksu-forest flex items-center gap-2 mb-4">
        <Info className="h-5 w-5 text-taksu-bamboo" />
        How the Pool Rotation Works
      </h3>
      
      <div className="space-y-4 text-sm text-taksu-sage">
        <p>
          At Taksu Living, we ensure fair distribution of reservations across all identical villas in your property&apos;s pool. Our proprietary algorithm automatically assigns new incoming bookings to the villa that needs it most.
        </p>
        
        <div>
          <strong className="text-taksu-forest block mb-1">1. The Priority Score</strong>
          <p>
            Every 24 hours, the system calculates a Priority Score for your villa. This score is based on the revenue generated and nights booked over the last 90 days. A lower score means your villa is higher in the queue for the next booking.
          </p>
        </div>

        <div>
          <strong className="text-taksu-forest block mb-1">2. Fair Share Metric</strong>
          <p>
            This metric compares your villa&apos;s performance against the pool average. 
            A score of <strong>1.0</strong> means you are perfectly balanced with the pool. 
            If it dips below 1.0, the system will actively route the next available channel bookings (from Airbnb, Booking.com, etc.) to your villa until balance is restored.
          </p>
        </div>

        <div>
          <strong className="text-taksu-forest block mb-1">3. Direct Bookings Excluded</strong>
          <p>
            If a guest specifically requests your exact villa number through a direct booking, that reservation bypasses the rotation algorithm. It will, however, increase your 90-day revenue metric, which naturally lowers your priority for the next automated channel booking to keep things fair for the other owners.
          </p>
        </div>
      </div>
    </div>
  );
}
