export default function DashboardCard({
  title,
  value,
  subtitle,
  color = 'default',
  icon,
}: {
  title: string
  value: string
  subtitle?: string
  color?: 'default' | 'profit' | 'loss' | 'neutral'
  icon?: string
}) {
  const valueColor =
    color === 'profit'
      ? 'text-emerald-400'
      : color === 'loss'
      ? 'text-red-400'
      : color === 'neutral'
      ? 'text-amber-400'
      : 'text-white'

  return (
    <div className="card p-4 card-glow flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#8888a0] uppercase tracking-wider">
          {title}
        </span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold num ${valueColor}`}>{value}</div>
      {subtitle && <div className="text-xs text-[#555570]">{subtitle}</div>}
    </div>
  )
}