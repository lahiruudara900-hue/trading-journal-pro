'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase'
import { Trade, TradeInsert } from '@/lib/types'
import { calculateRiskReward } from '@/lib/calculations'
import ScreenshotUpload from './ScreenshotUpload'

const SESSIONS = ['Asian','London','New York','London AM','New York AM','New York PM']
const DIRECTIONS = ['Buy','Sell']
const RESULTS = ['Win','Loss','Breakeven']
const BIASES = ['Bullish','Bearish','Neutral']
const SETUPS = ['Silver Bullet','FVG','OTE','SMT Divergence','Liquidity Sweep','Breaker','Order Block','Other']
const LIQUIDITY = ['PDH','PDL','Asian High','Asian Low','Equal Highs','Equal Lows','Previous Week High','Previous Week Low','None']
const POI = ['FVG','Order Block','Breaker','Mitigation Block','Premium Zone','Discount Zone','Other']
const EMOTIONS = ['Confident','Anxious','Calm','Excited','Fearful','Neutral','Greedy','Patient']

type FormData = Omit<TradeInsert, 'screenshot_url'>

const DEFAULTS: FormData = {
  trade_date: new Date().toISOString().slice(0,10),
  pair: '', session: 'London' as any, direction: 'Buy' as any,
  entry_price: 0, stop_loss: 0, take_profit: 0,
  risk_percent: 0, risk_amount: 0, risk_reward: 0,
  result: 'Win' as any, profit_loss: 0,
  setup_type: 'FVG' as any, bias: 'Bullish' as any,
  liquidity_taken: 'None' as any, point_of_interest: 'FVG' as any,
  followed_rules: true, rule_following_score: 8,
  emotion: 'Calm', mistake: '', lesson: '', notes: '',
}

export default function TradeForm({ existing, userId }: { existing?: Trade; userId: string }) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>(existing ? { ...existing } : { ...DEFAULTS })
  const [screenshot, setScreenshot] = useState<string | null>(existing?.screenshot_url ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (form.entry_price && form.stop_loss && form.take_profit) {
      const rr = calculateRiskReward(form.entry_price, form.stop_loss, form.take_profit)
      setForm(f => ({ ...f, risk_reward: rr }))
    }
  }, [form.entry_price, form.stop_loss, form.take_profit])

  const set = (key: keyof FormData, value: any) => setForm(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.pair.trim()) { setError('Pair is required.'); return }
    setError(''); setLoading(true)
    const supabase = getSupabaseClient()
    const payload = { ...form, screenshot_url: screenshot, user_id: userId }
    const { error: err } = existing
      ? await supabase.from('trades').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id)
      : await supabase.from('trades').insert([payload])
    if (err) { setError(err.message); setLoading(false) }
    else { setSuccess(true); setTimeout(() => router.push('/trades/history'), 1200) }
  }

  const Section = ({ title }: { title: string }) => (
    <div className="col-span-full mt-2">
      <h3 className="text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-1">{title}</h3>
      <div className="border-t border-[#1f1f2e] mb-4" />
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
      {success && <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-3 text-emerald-400 text-sm">✓ Trade {existing ? 'updated' : 'saved'}! Redirecting…</div>}

      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Section title="Basic Information" />
          <div><label className="form-label">Trade Date</label><input type="date" className="form-input" value={form.trade_date} onChange={e => set('trade_date', e.target.value)} required /></div>
          <div><label className="form-label">Pair</label><input type="text" className="form-input" placeholder="EURUSD, NAS100…" value={form.pair} onChange={e => set('pair', e.target.value.toUpperCase())} required /></div>
          <div><label className="form-label">Session</label><select className="form-select" value={form.session} onChange={e => set('session', e.target.value)}>{SESSIONS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label className="form-label">Direction</label><select className="form-select" value={form.direction} onChange={e => set('direction', e.target.value)}>{DIRECTIONS.map(d => <option key={d}>{d}</option>)}</select></div>
          <div><label className="form-label">Result</label><select className="form-select" value={form.result} onChange={e => set('result', e.target.value)}>{RESULTS.map(r => <option key={r}>{r}</option>)}</select></div>
          <div><label className="form-label">Profit / Loss ($)</label><input type="number" step="0.01" className="form-input" placeholder="e.g. 150.00" value={form.profit_loss || ''} onChange={e => set('profit_loss', parseFloat(e.target.value) || 0)} /></div>

          <Section title="Entry & Risk" />
          <div><label className="form-label">Entry Price</label><input type="number" step="any" className="form-input" value={form.entry_price || ''} onChange={e => set('entry_price', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="form-label">Stop Loss</label><input type="number" step="any" className="form-input" value={form.stop_loss || ''} onChange={e => set('stop_loss', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="form-label">Take Profit</label><input type="number" step="any" className="form-input" value={form.take_profit || ''} onChange={e => set('take_profit', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="form-label">Risk %</label><input type="number" step="0.01" className="form-input" value={form.risk_percent || ''} onChange={e => set('risk_percent', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="form-label">Risk Amount ($)</label><input type="number" step="0.01" className="form-input" value={form.risk_amount || ''} onChange={e => set('risk_amount', parseFloat(e.target.value) || 0)} /></div>
          <div><label className="form-label">R:R (auto-calculated)</label><input type="number" step="0.01" className="form-input bg-[#0e0e16]" readOnly value={form.risk_reward || ''} placeholder="Fill entry, SL, TP above" /></div>

          <Section title="ICT Setup" />
          <div><label className="form-label">Setup Type</label><select className="form-select" value={form.setup_type} onChange={e => set('setup_type', e.target.value)}>{SETUPS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><label className="form-label">Bias</label><select className="form-select" value={form.bias} onChange={e => set('bias', e.target.value)}>{BIASES.map(b => <option key={b}>{b}</option>)}</select></div>
          <div><label className="form-label">Liquidity Taken</label><select className="form-select" value={form.liquidity_taken} onChange={e => set('liquidity_taken', e.target.value)}>{LIQUIDITY.map(l => <option key={l}>{l}</option>)}</select></div>
          <div><label className="form-label">Point of Interest</label><select className="form-select" value={form.point_of_interest} onChange={e => set('point_of_interest', e.target.value)}>{POI.map(p => <option key={p}>{p}</option>)}</select></div>

          <Section title="Psychology" />
          <div><label className="form-label">Emotion</label><select className="form-select" value={form.emotion} onChange={e => set('emotion', e.target.value)}>{EMOTIONS.map(em => <option key={em}>{em}</option>)}</select></div>
          <div><label className="form-label">Followed Rules?</label><select className="form-select" value={form.followed_rules ? 'yes' : 'no'} onChange={e => set('followed_rules', e.target.value === 'yes')}><option value="yes">Yes</option><option value="no">No</option></select></div>
          <div><label className="form-label">Rule Score (1-10)</label><input type="number" min={1} max={10} className="form-input" value={form.rule_following_score || ''} onChange={e => set('rule_following_score', parseInt(e.target.value) || 0)} /></div>
          <div className="col-span-full"><label className="form-label">Mistake</label><textarea className="form-input resize-none" rows={2} value={form.mistake} onChange={e => set('mistake', e.target.value)} /></div>
          <div className="col-span-full"><label className="form-label">Lesson Learned</label><textarea className="form-input resize-none" rows={2} value={form.lesson} onChange={e => set('lesson', e.target.value)} /></div>
          <div className="col-span-full"><label className="form-label">Notes</label><textarea className="form-input resize-none" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-xs font-semibold text-[#8888a0] uppercase tracking-widest mb-4">Chart Screenshot</h3>
        <ScreenshotUpload value={screenshot} onChange={setScreenshot} userId={userId} />
      </div>

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary px-6" disabled={loading || success}>
          {loading ? 'Saving…' : existing ? 'Update Trade' : 'Save Trade'}
        </button>
      </div>
    </form>
  )
}