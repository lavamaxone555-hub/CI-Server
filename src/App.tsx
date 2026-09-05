import { useMemo, useState } from 'react'
import './styles.css'
import { retailStore } from './domain/retailStore'
import { checkout, type CartItem } from './domain/pos'

type Product = { id: string; name: string; brand: string; price: number; stock: number; trackImei: boolean }
const nav = ['Overview', 'POS', 'Inventory', 'Customers', 'Repairs', 'Purchasing', 'Analytics']
const icons = ['⌂', '▣', '▤', '♙', '🔧', '⇄', '◒']
const money = (n: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(n)
const getProducts = (): Product[] => retailStore.products.map(p => ({ id:p.id, name:p.name, brand:p.brand, price:p.price, trackImei:p.trackImei, stock:retailStore.inventory.find(i=>i.productId===p.id)?.quantity ?? 0 }))

function App() {
  const [active, setActive] = useState('Overview')
  const [aiOpen, setAiOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [paid, setPaid] = useState('')
  const [message, setMessage] = useState('')
  const products = getProducts()
  const filtered = useMemo(() => products.filter(p => (p.name+p.brand).toLowerCase().includes(query.toLowerCase())), [query, products.length, retailStore.inventory.map(i=>i.quantity).join(',')])

  const addToCart = (p: Product) => {
    if (p.trackImei) return setMessage('สินค้านี้ต้องระบุ IMEI — ฟังก์ชันลงทะเบียน/ขาย IMEI อยู่ในโมดูล POS production')
    setCart(c => {
      const found=c.find(x=>x.productId===p.id)
      return found ? c.map(x=>x.productId===p.id?{...x,qty:x.qty+1}:x) : [...c,{productId:p.id,name:p.name,qty:1,unitPrice:p.price,discount:0}]
    })
    setMessage('')
  }
  const completeCheckout = () => {
    try {
      const sale = checkout({ tenantId:retailStore.tenant.id, branchId:retailStore.branches[0].id, items:cart, paid:Number(paid), paymentMethod:'cash' })
      setMessage('ชำระเงินสำเร็จ '+sale.id+' | เงินทอน '+money(sale.change))
      setCart([]); setPaid('')
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Checkout failed') }
  }
  const renderOverview = () => <><div className="hero"><div><div className="eyebrow">RETAILOS DEMO</div><h1>Business Overview <span>✦</span></h1><p>ภาพรวมธุรกิจและสต็อกแบบเรียลไทม์</p></div><div className="heroBtns"><button className="secondary" onClick={()=>setActive('POS')}>＋ New Sale</button><button className="primary" onClick={()=>setAiOpen(true)}>✦ Ask AI</button></div></div>
    <section className="kpis">{[['Revenue','฿1,284,500'],['Orders',String(retailStore.sales.length)],['Products',String(products.length)],['Stock Units',String(products.reduce((s,p)=>s+p.stock,0))]].map(k=><div className="kpi" key={k[0]}><div className="kpiTop"><span>{k[0]}</span></div><strong>{k[1]}</strong><div className="trend">Live demo data</div></div>)}</section>
    <InventoryTable products={filtered} onAdd={addToCart} /></>
  const renderPos = () => <><div className="hero"><div><div className="eyebrow">POINT OF SALE</div><h1>POS Checkout</h1><p>เลือกสินค้า เพิ่มตะกร้า และชำระเงิน</p></div></div><section className="grid2"><div className="card"><div className="cardHead"><div><h2>สินค้า</h2><span>เลือกสินค้าที่ต้องการขาย</span></div></div><div className="quickGrid">{products.map(p=><button key={p.id} onClick={()=>addToCart(p)}><span>▣</span>{p.name}<br/><b>{money(p.price)}</b></button>)}</div></div><div className="card"><div className="cardHead"><div><h2>ตะกร้า</h2><span>{cart.length} รายการ</span></div></div><div className="tableWrap"><table><tbody>{cart.map(i=><tr key={i.productId}><td>{i.name}</td><td><button className="dots" onClick={()=>setCart(c=>c.map(x=>x.productId===i.productId?{...x,qty:Math.max(1,x.qty-1)}:x))}>−</button> {i.qty} <button className="dots" onClick={()=>setCart(c=>c.map(x=>x.productId===i.productId?{...x,qty:x.qty+1}:x))}>+</button></td><td>{money(i.qty*i.unitPrice)}</td></tr>)}</tbody></table></div><div className="cardHead"><div><h2>Total: {money(cart.reduce((s,i)=>s+i.qty*i.unitPrice,0)*1.07)}</h2></div></div><div className="actions"><input type="number" placeholder="จำนวนเงินที่รับ" value={paid} onChange={e=>setPaid(e.target.value)} /><button className="primary" onClick={completeCheckout}>ชำระเงิน</button></div></div></section></>
  const renderInventory = () => <><div className="hero"><div><div className="eyebrow">INVENTORY</div><h1>Inventory Management</h1><p>ตรวจสอบสต็อกและสินค้า</p></div></div><InventoryTable products={filtered} onAdd={addToCart}/></>
  const renderGeneric = () => <div className="card" style={{padding:24}}><h1>{active}</h1><p>โมดูล {active} ถูกเชื่อมต่อกับ navigation แล้ว</p>{active==='Customers' && <><h2>Customers</h2>{retailStore.customers.map(c=><p key={c.id}>{c.name} · {c.phone}</p>)}</>}{active==='Repairs' && <p>Repair workflow พร้อมสำหรับการเชื่อมต่อ service layer</p>}{active==='Purchasing' && <p>Purchasing workflow พร้อมสำหรับการเชื่อมต่อ supplier และ receiving</p>}{active==='Analytics' && <p>Analytics dashboard ใช้ข้อมูลธุรกิจสำหรับรายงาน</p>}</div>

  return <div className="app"><aside className="sidebar"><div className="brand"><div className="brandMark">◈</div><div><b>RetailOS</b><span>AI Operating System</span></div></div><div className="workspace"><div className="avatar">M</div><div><b>Mobile Hub</b><span>{retailStore.branches.length} branch · Pro</span></div></div><div className="sectionLabel">WORKSPACE</div><nav>{nav.map((item,i)=><button key={item} className={active===item?'navItem active':'navItem'} onClick={()=>{setActive(item);setMessage('')}}><span className="icon">{icons[i]}</span>{item}{item==='POS'&&<kbd>F2</kbd>}</button>)}</nav><div className="sectionLabel">INTELLIGENCE</div><button className="navItem aiNav" onClick={()=>setAiOpen(true)}><span className="spark">✦</span>AI Copilot <span className="live">LIVE</span></button></aside>
  <main className="main"><header className="topbar"><div className="crumb">{active} <span>/</span> RetailOS</div><div className="topActions"><div className="globalSearch">⌕<input placeholder="Search products…" value={query} onChange={e=>setQuery(e.target.value)} /></div><div className="miniAvatar">AS</div></div></header><div className="content">{message&&<div className="stateMessage" role="status">{message}</div>}{active==='Overview'?renderOverview():active==='POS'?renderPos():active==='Inventory'?renderInventory():renderGeneric()}<footer>RetailOS Demo · <span>System online</span></footer></div></main>
  {aiOpen&&<div className="aiPanel"><div className="aiPanelTop"><div><div className="aiTitle"><span>✦</span> AI Copilot</div><small>Demo intelligence layer</small></div><button onClick={()=>setAiOpen(false)}>×</button></div><div className="aiChat"><div className="aiBubble"><b>RetailOS Copilot พร้อมใช้งาน</b><p>สามารถเปิดปิด panel และตรวจสอบ navigation ได้</p></div></div></div>}</div>
}
function InventoryTable({products,onAdd}:{products:Product[];onAdd:(p:Product)=>void}) { return <section className="card tableCard"><div className="cardHead"><div><h2>Inventory</h2><span>{products.length} products</span></div></div><div className="tableWrap"><table><thead><tr><th>PRODUCT</th><th>BRAND</th><th>PRICE</th><th>STOCK</th><th>ACTION</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><b>{p.name}</b>{p.trackImei&&' · IMEI'}</td><td>{p.brand}</td><td>{money(p.price)}</td><td>{p.stock} units</td><td><button className="linkBtn" onClick={()=>onAdd(p)}>Add to POS</button></td></tr>)}</tbody></table></div></section> }
export default App
