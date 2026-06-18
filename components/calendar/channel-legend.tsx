export const CHANNEL_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  airbnb: { bg: 'bg-[#FF5A5F]/10', text: 'text-[#FF5A5F]', border: 'border-[#FF5A5F]/20' },
  booking: { bg: 'bg-[#003580]/10', text: 'text-[#003580]', border: 'border-[#003580]/20' },
  agoda: { bg: 'bg-[#2A5298]/10', text: 'text-[#2A5298]', border: 'border-[#2A5298]/20' },
  direct: { bg: 'bg-taksu-jungle/10', text: 'text-taksu-jungle', border: 'border-taksu-jungle/20' },
  other: { bg: 'bg-taksu-sage/10', text: 'text-taksu-sage', border: 'border-taksu-sage/20' },
};

export function ChannelLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm mt-4 p-4 bg-white rounded-lg border border-border">
      <span className="font-medium text-taksu-forest mr-2">Channels:</span>
      {Object.entries(CHANNEL_COLORS).map(([channel, colors]) => (
        <div key={channel} className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full ${colors.bg.replace('/10', '')} border ${colors.border}`} />
          <span className="capitalize text-taksu-sage">{channel}</span>
        </div>
      ))}
    </div>
  );
}
