import type { Database } from '@/lib/supabase/types';

type StatementRow = Database['public']['Tables']['monthly_statements']['Row'];

export const UBUD_MARKET_MEDIAN = {
  occupancy: 0.65, // Updated to a more realistic Bali figure for demonstration
  adr_usd: 113,
  revpar_usd: 73,
};

export interface AnalyticsData {
  // Aggregate KPIs
  total_revenue: number;
  total_net_payout: number;
  avg_occupancy: number;
  avg_adr: number;
  avg_revpar: number;
  
  // Charts
  trendData: Array<{
    month: string;
    gross_revenue: number;
    net_payout: number;
    occupancy: number;
  }>;
  channelMix: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
}

export function calculateAnalytics(statements: StatementRow[]): AnalyticsData {
  if (statements.length === 0) {
    return {
      total_revenue: 0,
      total_net_payout: 0,
      avg_occupancy: 0,
      avg_adr: 0,
      avg_revpar: 0,
      trendData: [],
      channelMix: [],
    };
  }

  let total_revenue = 0;
  let total_net_payout = 0;
  let total_occupied_nights = 0;
  let total_available_nights = 0;
  
  // For ADR and RevPAR averaging
  let sum_adr = 0;
  let count_adr = 0;
  let sum_revpar = 0;
  let count_revpar = 0;

  const trendData: AnalyticsData['trendData'] = [];
  const channelsAggregated: Record<string, number> = {};

  for (const st of statements) {
    total_revenue += st.gross_revenue_usd;
    total_net_payout += st.owner_net_payout_usd;
    total_occupied_nights += st.occupied_nights;
    total_available_nights += st.available_nights;

    if (st.adr_usd != null && st.adr_usd > 0) {
      sum_adr += Number(st.adr_usd);
      count_adr++;
    }
    
    if (st.revpar_usd != null && st.revpar_usd > 0) {
      sum_revpar += Number(st.revpar_usd);
      count_revpar++;
    }

    // Process channels
    const channels = st.revenue_by_channel as Record<string, number>;
    if (channels) {
      for (const [channel, amount] of Object.entries(channels)) {
        channelsAggregated[channel] = (channelsAggregated[channel] || 0) + Number(amount);
      }
    }

    // Trend formatting
    const date = new Date(st.billing_month);
    const shortMonth = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

    trendData.push({
      month: shortMonth,
      gross_revenue: Number(st.gross_revenue_usd),
      net_payout: Number(st.owner_net_payout_usd),
      occupancy: Number(st.occupancy_rate),
    });
  }

  const avg_occupancy = total_available_nights > 0 ? total_occupied_nights / total_available_nights : 0;
  const avg_adr = count_adr > 0 ? sum_adr / count_adr : 0;
  const avg_revpar = count_revpar > 0 ? sum_revpar / count_revpar : 0;

  // Format channel mix for Recharts
  const CHANNEL_COLORS: Record<string, string> = {
    airbnb: '#FF5A5F',
    booking: '#003580',
    agoda: '#2A5298',
    direct: '#2C3E2C', // taksu-forest
    other: '#D4C5A0', // taksu-sand
  };

  const channelMix = Object.entries(channelsAggregated)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: CHANNEL_COLORS[name.toLowerCase()] || CHANNEL_COLORS.other,
    }))
    .sort((a, b) => b.value - a.value);

  return {
    total_revenue,
    total_net_payout,
    avg_occupancy,
    avg_adr,
    avg_revpar,
    trendData,
    channelMix,
  };
}
