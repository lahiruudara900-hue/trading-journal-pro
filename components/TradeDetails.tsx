import Image from 'next/image'
import Link from 'next/link'
import { Trade } from '@/lib/types'
import { formatPL } from '@/lib/calculations'

interface Props { trade: Trade; onDelete: () => void }

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <div className="text-xs text-[#555570] uppercase tracking-wider mb-1">{label}</div>
    <div className="text-sm text-[#e8e8f0] font-medium">{value || '—'}</div>
  </div>
)

export default function TradeDetails({ trade, onDelete }: Props) {
  const plColor = trade.profit_loss > 0 ? 'text-emerald-400' : trade.profit_loss < 0 ? 'text-red-400' : 'text-[#8888a0]'
  const resultBadge = () => {
    if (trade.result === 'Win') return <span className="badge-win text-sm px-3 py-1">Win</span>
    if (trade.result === 'Loss') return <span className="badge-loss text-sm px-3 py-1">Loss</span>
    return <span className="badge-breakeven text-sm px-3 py-1">Breakeven</span>
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{trade.pair}</h1>
            {resultBadge()}
            <span className={trade.direction === 'Buy' ? 'badge-buy' : 'badge-sell'}>{trade.direction === 'Buy' ? '↑ Buy' : '↓ Sell'}</span>
          </div>
          <p className="text-[#8888a0] text-sm mt-1">{trade.trade_date} · {trade.session}</p>
        </div>
        <div className={`text-3xl font-bold num ${plColor}`}>{formatPL(trade.profit_loss)}</div>
      </div>
      {trade.screenshot_url && (
        <div className="card overflow-hidden rounded-xl">
          <Image src={trade.screenshot_url} alt="Chart" width={1200} height={600} className="w-full object-cover max-h-[500px]" unoptimized />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-[#8888a0] uppercase tracking-widest">Trade Info</h3>
          <Field label="Date" value={trade.trade_date} />
          <Field label="Session" value={trade.session} />
          <Field label="Direction" value={trade.direction} />
          <Field label="Result" value={trade.result} />
        </div>
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-[#8888a0] uppercase tracking-widest">Risk Details</h3>
          <Field label="Entry" value={trade.entry_price} />
          <Field label="Stop Loss" value={trade.stop_loss} />
          <Field label="Take Profit" value={trade.take_profit} />
          <Field label="Risk %" value={trade.risk_percent ? `${trade.risk_percent}%` : null} />
          <Field label="Risk $" value={trade.risk_amount ? `$${trade.risk_amount}` : null} />
          <Field label="R:R" value={trade.risk_reward ? `${trade.risk_reward}R` : null} />
        </div>
        <div className="card p-5 space-y-4">
          <h3 className="text-xs font-semibold text-[#8888a0] uppercase tracking-widest">ICT Details</h3>
          <Field label="Setup" value={trade.setup_type} />
          <Field label="Bias" value={trade.bias} />
          <Field label="Liquidity" value={trade.liquidity_taken} />
          <Field label="POI" value={trade.point_of_interest} />
        </div>
        <div className="card p-5 space-y-4 sm:col-span-2 lg:col-span-3">
          <h3 className="text-xs font-semibold text-[#8888a0] uppercase tracking-widest">Psychology</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="Emotion" value={trade.emotion} />
            <Field label="Followed Rules" value={trade.followed_rules ? '✅ Yes' : '❌ No'} />
            <Field label="Rule Score" value={trade.rule_following_score ? `${trade.rule_following_score}/10` : null} />
          </div>
          {trade.mistake && <Field label="Mistake" value={trade.mistake} />}
          {trade.lesson && <Field label="Lesson" value={trade.lesson} />}
          {trade.notes && <Field label="Notes" value={trade.notes} />}
        </div>
      </div>
      <div className="flex gap-3">
        <Link href={`/trades/${trade.id}/edit`} className="btn-secondary">Edit Trade</Link>
        <button onClick={onDelete} className="btn-danger">Delete Trade</button>
      </div>
    </div>
  )
}