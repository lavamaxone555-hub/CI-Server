import { useMemo, useState } from 'react'
import './styles.css'
import { retailStore } from './domain/retailStore'
import { errorState, loadingState, successState, type UiState } from './application/uiState'
import { runOperation } from './application/runOperation'

type Product = { name: string; brand: string; price: string; stock: number; demand: 'High' | 'Medium' | 'Low' }
const nav = ['Overview', 'POS', 'Inventory', 'Customers', 'Repairs', 'Purchasing', 'Analytics']
const products: Product[] = retailStore.products.map((p) => ({
  name: p.name,
  brand: p.brand,
  price: new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(p.price),
  stock: retailStore.inventory.find((i) => i.productId === p.id)?.quantity ?? 0,
  demand: (retailStore.inventory.find((i) => i.productId === p.id)?.quantity ?? 0) <= 5 ? 'High' : (retailStore.inventory.find((i) => i.productId === p.id)?.quantity ?? 0) <= 10 ? 'Medium' : 'Low',
}))
const kpis = [['Revenue', '฿1,284,500', '+12.8%'], ['Gross Profit', '฿318,240', '+8.4%'], ['Orders', '1,842', '+6.1%'], ['Stock Value', '฿4.82M', '-3.2%']]

function App() {
  const [active, setActive] = useState('Overview')
  const [aiOpen, setAiOpen] = useState(true)
  const [query, setQuery] = useState('')
  const [inventoryState, setInventoryState] = useState<UiState<Product[]>>(() => successState(products))
  const filtered = useMemo(() => products.filter((p) => Object.values(p).join(' ').toLowerCase().includes(query.toLowerCase())), [query])

  const refreshInventory = () => {
    setInventoryState(loadingState(inventoryState.data))
    window.setTimeout(() => {
      const result = runOperation(() => {
        if (query.trim().toLowerCase() === 'error') throw new Error('Inventory service is temporarily unavailable')
        return filtered
      })
      setInventoryState(result.state === 'success' ? successState(result.data) : errorState(result.message, inventoryState.data))
    }, 250)
  }

  const visibleProducts = inventoryState.data ?? []
  return (
    <div className="app">
      <aside className="sidebar"><div className="brand"><div className="brandMark">◈</div><div><b>RetailOS</b><span>AI Operating System</span></div></div><div className="workspace"><div className="avatar">M</div><div><b>Mobile Hub</b><span>{retailStore.branches.length} branch · Pro</span></div><span className="chev">⌄</span></div><div className="sectionLabel">WORKSPACE</div><nav>{nav.map((item, i) => <button key={item} className={active === item ? 'navItem active' : 'navItem'} onClick={() => setActive(item)}><span className="icon">{['⌂', '▣', '▤', '♙', '🔧', '⇄', '◒'][i]}</span>{item}{item === 'POS' && <kbd>F2</kbd>}</button>)}</nav><div className="sectionLabel">INTELLIGENCE</div><button className="navItem aiNav" onClick={() => setAiOpen(true)}><span className="spark">✦</span>AI Copilot <span className="live">LIVE</span></button><div className="sidebarBottom"><button className="navItem"><span className="icon">⚙</span>Settings</button><div className="profile"><div className="avatar">AS</div><div><b>Alex Somchai</b><span>Owner · Admin</span></div><span>•••</span></div></div></aside>
      <main className="main"><header className="topbar"><div className="crumb">{active} <span>/</span> Business Overview</div><div className="topActions"><div className="globalSearch">⌕<input placeholder="Search anything…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && refreshInventory()} /><kbd>⌘ K</kbd></div><button className="round">?</button><button className="round notify">♢<i /></button><div className="miniAvatar">AS</div></div></header>
        <div className="content"><div className="hero"><div><div className="eyebrow">MONDAY, AUGUST 24 · 2026</div><h1>Good morning, Alex <span>✦</span></h1><p>Here’s what’s happening across your retail business today.</p></div><div className="heroBtns"><button className="secondary">＋ New Sale</button><button className="primary" onClick={() => setAiOpen(true)}>✦ Ask AI</button></div></div>
          <section className="kpis">{kpis.map((k) => <div className="kpi" key={k[0]}><div className="kpiTop"><span>{k[0]}</span><button>•••</button></div><strong>{k[1]}</strong><div className="trend"><em>{k[2]}</em><span>vs last 30 days</span></div></div>)}</section>
          <section className="grid3"><div className="card aiInsight"><div className="aiHeader"><div className="aiIcon">✦</div><div><h2>AI Insight</h2><span>Just now · Autonomous analysis</span></div><span className="pulse">● LIVE</span></div><h3>Inventory opportunity detected</h3><p>Galaxy S26 Ultra is selling <b>28% slower</b> than its 14-day average while 41 units remain in stock.</p><div className="actions"><button onClick={() => setAiOpen(true)}>Review analysis</button><button className="primary">Create promotion</button></div></div></section>
          <section className="card tableCard"><div className="cardHead"><div><h2>Inventory overview</h2><span>Real-time stock across {retailStore.branches.length} branch</span></div><button className="linkBtn" onClick={refreshInventory}>{inventoryState.state === 'loading' ? 'Loading…' : 'Refresh inventory'}</button></div>
            {inventoryState.state === 'error' && <div className="stateMessage" role="alert">{inventoryState.message} <button onClick={refreshInventory}>Retry</button></div>}
            {inventoryState.state === 'loading' && <div className="stateMessage">Loading inventory…</div>}
            {inventoryState.state === 'success' && visibleProducts.length === 0 && <div className="stateMessage">No inventory items match your search.</div>}
            {visibleProducts.length > 0 && <div className="tableWrap"><table><thead><tr><th>PRODUCT</th><th>BRAND</th><th>PRICE</th><th>STOCK</th><th>DEMAND</th><th /></tr></thead><tbody>{visibleProducts.map((p) => <tr key={p.name}><td><div className="product"><div className="device">▣</div><b>{p.name}</b></div></td><td>{p.brand}</td><td><b>{p.price}</b></td><td>{p.stock} units</td><td><span className={'demand ' + p.demand.toLowerCase()}>{p.demand}</span></td><td><button className="dots">•••</button></td></tr>)}</tbody></table></div>}
          </section><footer>RetailOS v1.0 · <span>All systems operational</span><div>Privacy · Security · Documentation</div></footer></div></main>
      {aiOpen && <div className="aiPanel"><div className="aiPanelTop"><div><div className="aiTitle"><span>✦</span> AI Copilot</div><small>Your business intelligence layer</small></div><button onClick={() => setAiOpen(false)}>×</button></div><div className="aiChat"><div className="aiBubble"><b>Good morning, Alex.</b><p>I’ve analyzed your business data. There are <strong>2 opportunities</strong> worth your attention today.</p></div></div><div className="aiPrompt"><input placeholder="Ask anything about your business…" /><button>➤</button></div><div className="aiNote">AI uses your live business data · Recommendations require approval</div></div>}
    </div>
  )
}
export default App
