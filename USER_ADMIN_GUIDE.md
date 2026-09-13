# RetailOS — คู่มือการใช้งานฉบับเต็ม

> **RetailOS — AI Operating System สำหรับธุรกิจ Retail**
>
> คู่มือนี้ครอบคลุมการใช้งานสำหรับ **Owner / Admin / Manager / Cashier / Technician / Viewer** และอธิบายทั้ง workflow ของผู้ดูแลระบบและผู้ใช้งานหน้าร้าน ตั้งแต่เริ่มต้นระบบ → ตั้งค่าธุรกิจ → สินค้าและสต็อก → POS → ลูกค้า → งานซ่อม → จัดซื้อ → Analytics/AI → การตรวจสอบและความปลอดภัย

---

## 1. ภาพรวม RetailOS

RetailOS ออกแบบเป็นระบบบริหารร้านค้าหลายสาขาและหลาย tenant โดยมีโมดูลหลักดังนี้

- **Dashboard** — ภาพรวมธุรกิจ ยอดขาย สต็อก กำไร สุขภาพธุรกิจ และ AI recommendations
- **POS** — ขายสินค้า รับชำระเงิน และรองรับสินค้าแบบติดตาม IMEI
- **Products** — สินค้า SKU / Barcode / ราคา / ต้นทุน / การติดตาม IMEI / จำนวนสต็อก
- **IMEI Inventory** — ติดตามเครื่องเป็นราย IMEI และตรวจสถานะก่อนขาย
- **Stock & Transfer** — จัดการสต็อกและโอนสินค้าระหว่างสาขา
- **Purchases** — Supplier / Purchase Order / รับสินค้าเข้า
- **Customers (CRM)** — ฐานลูกค้า ประวัติ และข้อมูลติดต่อ
- **Loyalty & Points** — คะแนนสะสมและสิทธิประโยชน์
- **Installment** — การผ่อนชำระและติดตามยอดค้าง
- **Repair Center** — รับซ่อม ตรวจสอบ รออะไหล่ ซ่อม และส่งมอบ
- **Trade-In** — รับซื้อ/แลกเปลี่ยนสินค้าเก่า
- **Accounting** — รายรับ รายจ่าย ต้นทุน และธุรกรรมทางการเงิน
- **Reports & Analytics** — รายงานยอดขาย สต็อก กำไร และพฤติกรรมธุรกิจ
- **AI Copilot** — ผู้ช่วยวิเคราะห์ธุรกิจ
- **AI Insights** — Forecast / Alert / Opportunity
- **Automation** — งานอัตโนมัติและ approval workflow
- **Apps & Integrations** — เชื่อมต่อบริการภายนอก
- **Settings** — การตั้งค่าระบบและธุรกิจ

> **หมายเหตุเรื่องสถานะหน้าจอ:** คู่มือนี้เป็นคู่มือการใช้งานของ RetailOS โดยยึด workflow และ business rules ในระบบจริงเป็นหลัก ปัจจุบันบางเมนูใน UI ยังเป็นหน้า architecture/placeholder และยังไม่เปิด workflow เต็มชุดเหมือน POS, Products, CRM, Repair และ Purchases ดังนั้นห้ามตีความว่าปุ่มทุกเมนูที่แสดงใน Sidebar มีความสามารถครบเท่ากันทั้งหมดแล้ว

---

# PART A — ADMIN / OWNER GUIDE

## 2. บทบาทและสิทธิ์ผู้ใช้งาน

RetailOS รองรับ role หลัก 6 ระดับ

| Role | เหมาะกับ | สิทธิ์หลัก |
|---|---|---|
| **Owner** | เจ้าของกิจการ | ทุกสิทธิ์ |
| **Admin** | ผู้ดูแลระบบ | ทุกสิทธิ์ |
| **Manager** | ผู้จัดการสาขา | Dashboard, Sales, Inventory, Customer, Repair, Purchase |
| **Cashier** | พนักงานขาย/แคชเชียร์ | Sales, Customer และอ่าน Inventory |
| **Technician** | ช่างซ่อม | Repair และอ่าน Inventory |
| **Viewer** | ผู้ดูรายงาน | อ่าน Dashboard, Sales, Inventory, Customer, Repair, Purchase |

### หลักสำคัญของสิทธิ์

1. ผู้ใช้ต้องอยู่ใน tenant เดียวกับข้อมูลที่กำลังเข้าถึง
2. ผู้ใช้ที่ถูกปิดใช้งานจะไม่สามารถใช้ permission ต่อได้
3. การเข้าถึงสาขาต้องอยู่ใน `branchIds` ของผู้ใช้
4. Owner และ Admin มีสิทธิ์เต็มระบบ
5. Manager ไม่มีสิทธิ์ระดับระบบทั้งหมดแบบ Owner/Admin
6. Cashier ไม่ควรได้รับสิทธิ์แก้ไขข้อมูลเชิงบริหาร
7. Technician เน้นงานซ่อมและข้อมูลสต็อกที่จำเป็นต่อการซ่อม
8. Viewer เป็น read-only สำหรับข้อมูลที่ได้รับอนุญาต

---

## 3. ขั้นตอนเริ่มต้นสำหรับ Owner / Admin

### 3.1 ตรวจสอบ Tenant

ตรวจสอบข้อมูลธุรกิจให้ถูกต้องก่อนเริ่มใช้งาน

- ชื่อกิจการ
- Tenant code
- สกุลเงิน
- Timezone
- สาขาหลัก
- สถานะสาขา

ตัวอย่างระบบเริ่มต้นใช้:

- Currency: THB
- Timezone: Asia/Bangkok
- Branch: สำนักงานใหญ่ / HQ

### 3.2 สร้างและกำหนดผู้ใช้งาน

แนวทางแนะนำ:

- เจ้าของกิจการ → Owner
- ผู้ดูแลระบบ → Admin
- ผู้จัดการสาขา → Manager
- พนักงานขาย → Cashier
- ช่าง → Technician
- ผู้บริหารที่ต้องการดูรายงาน → Viewer

**หลักความปลอดภัย:** ให้สิทธิ์เท่าที่จำเป็นต่อหน้าที่งาน อย่าให้ Cashier หรือ Technician ได้สิทธิ์ Admin โดยไม่จำเป็น

### 3.3 กำหนดสาขา

สำหรับแต่ละผู้ใช้ ให้กำหนดเฉพาะสาขาที่มีสิทธิ์เข้าถึง เช่น

- Manager A → Branch A
- Manager B → Branch B
- Cashier A1 → Branch A
- Technician A1 → Branch A

การตรวจสอบ branch access ต้องผ่านก่อนจึงทำรายการของสาขานั้นได้

---

## 4. Dashboard — ศูนย์ควบคุมธุรกิจ

เมื่อเข้าหน้า Dashboard ให้ตรวจสอบจากบนลงล่าง

### 4.1 KPI Cards

ใช้ดูภาพรวมทันที:

- Total Revenue — ยอดขายรวม
- Gross Profit — กำไรขั้นต้น
- Orders — จำนวนออเดอร์
- Units Sold — จำนวนหน่วยขาย
- Avg. Order Value — ค่าเฉลี่ยต่อออเดอร์
- Profit Margin — อัตรากำไร

**วิธีอ่าน:**

1. ดู Revenue เพื่อดูขนาดยอดขาย
2. ดู Gross Profit/Profit Margin เพื่อดูคุณภาพของยอดขาย
3. ดู Orders + AOV เพื่อดูพฤติกรรมการซื้อ
4. เปรียบเทียบกับช่วงก่อนหน้า
5. หากยอดขายเพิ่มแต่กำไรลด ให้ตรวจ discount, cost และ product mix

> ข้อมูล KPI บางตัวอาจแสดง `—` หรือข้อความว่ารอข้อมูลต้นทุน/line-item เมื่อข้อมูลต้นทุนหรือรายละเอียดรายการขายยังไม่ครบ ซึ่งควรถือว่าเป็นข้อมูลที่ยังคำนวณไม่ได้ ไม่ควรนำตัวเลขดังกล่าวไปตัดสินใจทางบัญชี

### 4.2 Sales Overview

กราฟใช้ดูแนวโน้ม Revenue และ Profit

ให้สังเกต:

- ยอดขายขึ้น/ลงวันไหน
- กำไรเคลื่อนไหวตามยอดขายหรือไม่
- มีช่วงที่ Revenue สูงแต่ Profit ต่ำหรือไม่

### 4.3 Top Selling Products

ใช้หา:

- สินค้าขายดี
- จำนวนหน่วยขาย
- มูลค่าการขาย

นำข้อมูลไปใช้กับการสั่งซื้อและวางโปรโมชั่น

### 4.4 Inventory Health / Stock Alert

ตรวจสินค้าที่:

- ปกติ
- ใกล้หมด
- ค้างสต็อก
- อายุสต็อกสูง

Admin ควรตรวจ Stock Alert อย่างน้อยวันละครั้ง

### 4.5 Repair Status

ดูจำนวนงานในแต่ละสถานะ:

1. รอรับเครื่อง
2. กำลังตรวจสอบ
3. รออะไหล่
4. กำลังซ่อม
5. เสร็จสิ้น

### 4.6 Business Health Score

ใช้เป็น dashboard เชิงบริหาร ไม่ควรใช้แทนรายงานบัญชี

ดูองค์ประกอบ เช่น:

- Sales
- Inventory
- Profit
- Customer
- Cash Flow

### 4.7 AI Recommendations

AI สามารถเสนอแนวทาง เช่น:

- ลดราคาสินค้าค้างสต็อก
- สั่งสินค้าเพิ่มเมื่อ demand สูง
- หาโอกาสขายสินค้าเสริม

**กฎการใช้งาน:** AI เป็นคำแนะนำ ไม่ใช่การอนุมัติทางธุรกิจโดยอัตโนมัติ โดยเฉพาะ action ที่มีความเสี่ยงสูงควรผ่าน approval workflow

---

## 5. Products — จัดการสินค้า

### 5.1 ข้อมูลสินค้าที่ควรมี

- SKU
- Barcode
- ชื่อสินค้า
- Brand
- Category
- Cost
- Selling Price
- Active/Inactive
- Track IMEI

### 5.2 การเพิ่มสินค้า

Workflow มาตรฐาน:

1. เข้า **Products**
2. ตรวจว่า Category มีอยู่แล้ว
3. กำหนด SKU ที่ไม่ซ้ำ
4. กำหนด Barcode ที่ไม่ซ้ำภายใน tenant
5. ใส่ต้นทุน
6. ใส่ราคาขาย
7. เลือก Track IMEI สำหรับมือถือ/อุปกรณ์ที่ต้องติดตามรายเครื่อง
8. เปิด Active
9. ตรวจสต็อกเริ่มต้น

### 5.3 สินค้าที่ติดตาม IMEI

เลือก `Track IMEI = true` สำหรับสินค้าที่ต้องระบุ IMEI

ตัวอย่าง:

- iPhone
- Samsung Galaxy
- Smartphone อื่น ๆ ที่ร้านต้องติดตามรายเครื่อง

**ห้ามใช้ IMEI ซ้ำหรือขายเครื่องโดยไม่มี IMEI ที่ผ่าน validation**

---

## 6. IMEI Inventory — การบริหารเครื่องรายเครื่อง

### สถานะหลัก

- `in_stock` — อยู่ในสต็อก
- สถานะอื่นควรเปลี่ยนตาม lifecycle ของระบบเมื่อมี workflow รองรับ

### Workflow รับเครื่องเข้า

1. รับสินค้า
2. ตรวจ IMEI จากตัวเครื่อง/กล่อง
3. ตรวจว่า IMEI ถูกต้อง
4. ผูก IMEI กับ Product
5. ผูกกับ Branch
6. ตั้งสถานะ `in_stock`
7. ตรวจว่าไม่มี IMEI ซ้ำ

### Workflow ก่อนขาย

1. เลือกสินค้า IMEI
2. กรอก IMEI 15 หลัก
3. ตรวจสถานะ IMEI
4. เพิ่มเข้า Cart
5. ตรวจราคา + VAT
6. รับชำระเงิน
7. เมื่อ checkout สำเร็จจึงถือว่าการขายเสร็จสมบูรณ์

**หาก checkout ไม่สำเร็จ ต้องไม่ถือว่าเครื่องถูกขายออกจากระบบ**

---

## 7. POS — คู่มือ Admin / Manager

### 7.1 ขั้นตอนขายสินค้าทั่วไป

1. เข้า **POS**
2. ค้นหาสินค้าด้วยชื่อ/Brand
3. กด **Add to POS**
4. ตรวจรายการในตะกร้า
5. ตรวจ Subtotal
6. ตรวจ VAT 7%
7. ตรวจ Total
8. กรอกจำนวนเงินที่รับ
9. กด **ชำระเงิน**
10. ตรวจ Sale ID และเงินทอน

### 7.2 ขั้นตอนขายสินค้า IMEI

1. เลือกสินค้าที่ติด IMEI
2. กรอก IMEI 15 หลัก
3. ระบบตรวจ IMEI
4. Add to POS
5. ตรวจ Cart ว่า IMEI ถูกต้อง
6. ตรวจ Total รวม VAT 7%
7. รับเงิน
8. Checkout
9. ตรวจ Sale ID
10. ตรวจว่าสต็อกลดหลังขายสำเร็จ

### 7.3 VAT

POS ต้องแสดง:

- Subtotal
- VAT 7%
- Total

ตัวอย่างสินค้า 590 บาท:

- Subtotal = ฿590
- VAT 7% = ฿41.30
- Total = ฿631.30

ให้ใช้ยอด Total เป็นยอดที่ลูกค้าต้องชำระ

### 7.4 กรณีลูกค้าจ่ายไม่พอ

ตัวอย่าง Total = ฿631

ลูกค้าจ่าย = ฿630

ผลที่ถูกต้อง:

- Checkout ต้องถูกปฏิเสธ
- แจ้งว่ายอดชำระไม่เพียงพอ
- ห้ามตัดสต็อกบางส่วน
- ห้ามสร้าง sale ที่ถือว่าชำระแล้ว

### 7.5 กรณีจ่ายเกิน

ถ้าลูกค้าจ่ายมากกว่า Total:

- Checkout สำเร็จ
- คำนวณเงินทอน
- แสดง Sale ID
- ตรวจรายการและยอดเงินอีกครั้ง

---

## 8. Customers (CRM)

### เพิ่มลูกค้า

1. เข้า **Customers (CRM)**
2. กรอกชื่อ
3. กรอกเบอร์โทร
4. กด **เพิ่มลูกค้า**
5. ตรวจว่าลูกค้าปรากฏในตาราง

### แนวทางข้อมูลลูกค้า

ควรบันทึก:

- ชื่อ
- เบอร์โทร
- Email (ถ้ามี)
- ประวัติการซื้อ
- คะแนนสะสม
- งานซ่อม
- สินค้าที่สนใจ

### การรักษาความถูกต้อง

- หลีกเลี่ยงการสร้างลูกค้าซ้ำ
- ตรวจเบอร์ก่อนสร้างใหม่
- อย่าเปิดเผยข้อมูลลูกค้าให้ role ที่ไม่มีสิทธิ์
- การเข้าถึงลูกค้าต้องอยู่ใน tenant เดียวกัน

---

## 9. Loyalty & Points

แนวทางการทำงาน:

1. ลูกค้าซื้อสินค้า
2. ระบบคำนวณคะแนนตาม policy ของธุรกิจ
3. เพิ่มคะแนนให้ Loyalty Account
4. ลูกค้าใช้คะแนนเมื่อเข้าเงื่อนไข
5. ห้ามทำให้คะแนนติดลบ

Admin ควรกำหนด policy ให้ชัดเจน เช่น:

- ทุก ฿X = Y points
- คะแนนหมดอายุเมื่อใด
- ใช้คะแนนแลกอะไรได้บ้าง
- ใครมีสิทธิ์ปรับคะแนน manual

---

## 10. Repair Center

### รับเครื่องซ่อม

1. เข้า **Repair Center**
2. ระบุลูกค้า
3. ระบุอุปกรณ์
4. ระบุอาการเสีย
5. กด **รับเครื่องซ่อม**
6. ตรวจเลขงานซ่อม
7. ตั้งสถานะเริ่มต้นเป็น Received

### Lifecycle งานซ่อม

`Received → Diagnosing → Ready → Completed`

ใน workflow ที่ละเอียดสามารถมีขั้น `รออะไหล่` และ `กำลังซ่อม` ตามกระบวนการของร้าน

### ก่อนส่งมอบ

ตรวจ:

- ลูกค้าถูกคน
- เครื่องถูกเครื่อง
- อาการและรายการซ่อมครบ
- ค่าใช้จ่ายครบ
- สถานะงานเป็นพร้อมส่งมอบ/เสร็จสิ้น
- Warranty ตามเงื่อนไข

---

## 11. Trade-In / รับซื้อ

Workflow แนะนำ:

1. ระบุลูกค้า
2. ระบุอุปกรณ์
3. ตรวจสภาพ
4. ตรวจ IMEI/Serial หากเกี่ยวข้อง
5. ประเมินราคา
6. บันทึกข้อเสนอ
7. ขออนุมัติเมื่อเกินวงเงิน/ความเสี่ยงที่กำหนด
8. ปิดรายการรับซื้อ
9. นำสินค้าเข้าสู่ inventory ตาม policy

ห้ามนำราคาที่ AI แนะนำไปจ่ายเงินจริงโดยไม่มีการตรวจสอบตาม policy ของร้าน

---

## 12. Purchases / Supplier / Stock Transfer

### สร้าง Purchase Order

1. เข้า **Purchases**
2. ระบุ Supplier
3. ระบุจำนวนรายการ
4. ระบุยอดรวม
5. กด **สร้าง PO**
6. ตรวจสถานะ `Draft`

### Lifecycle Purchase Order

`Draft → Approved → Received`

และสามารถ `Cancelled` ได้ตาม business rule

**ไม่ควรย้อนสถานะ PO ที่ปิดแล้วโดยไม่มี workflow รองรับ**

### Stock Transfer

Workflow:

`Draft → In Transit → Received`

ห้ามโอนจากสาขาเดียวกันไปสาขาเดียวกัน และต้องตรวจสิทธิ์ tenant/branch ก่อนทำรายการ

---

## 13. Accounting / Reports & Analytics

Admin ใช้เพื่อตรวจ:

- ยอดขาย
- รายรับ
- รายจ่าย
- ต้นทุน
- กำไรขั้นต้น
- Margin
- Cash Flow
- ลูกหนี้/ยอดผ่อน
- สินค้าค้างสต็อก
- สินค้าขายดี

### รอบการตรวจที่แนะนำ

**ทุกวัน**
- Sales
- Cash
- Stock Alert
- Repair pending

**ทุกสัปดาห์**
- Gross Profit
- Product mix
- Dead stock
- Purchase trend
- Customer trend

**ทุกเดือน**
- Revenue
- Gross Profit
- Profit Margin
- Cash Flow
- Inventory turnover
- Branch performance

---

## 14. AI Copilot / AI Insights

### AI Copilot

ใช้ถาม/วิเคราะห์ เช่น:

- วันนี้ยอดขายเป็นอย่างไร
- สินค้าใดเสี่ยงขาดสต็อก
- สินค้าใดค้างสต็อก
- ควรสั่งสินค้าเพิ่มหรือไม่
- มีโอกาสขายสินค้าเสริมหรือไม่

### AI Insight 3 ประเภท

- **Forecast** — คาดการณ์
- **Alert** — แจ้งเตือนความเสี่ยง
- **Opportunity** — โอกาสทางธุรกิจ

### AI Autopilot

Automation ที่มีความเสี่ยงสูงต้องมี approval ก่อน execute

หลักสำคัญ:

- Low risk → อาจ execute ตาม policy
- Medium risk → ตรวจ policy/approval
- High risk → ต้องมี approval ที่ถูกต้อง

Approval ต้องตรงทั้ง `actionId` และ `tenantId` ก่อน execute

---

## 15. Apps & Integrations

ก่อนเชื่อมระบบภายนอก Admin ต้องตรวจ:

1. ระบบปลายทางคืออะไร
2. ข้อมูลใดถูกส่งออก
3. ข้อมูลใดถูกนำเข้า
4. Authentication แบบใด
5. Webhook/Callback URL ถูกต้องหรือไม่
6. Secret/API key เก็บใน environment ที่ปลอดภัย
7. มี audit trail หรือไม่
8. มี retry/failure policy หรือไม่

ห้ามใส่ secret ลง source code หรือ commit ลง Git

---

## 16. Settings / Security Checklist สำหรับ Admin

ก่อนเปิดใช้งานจริงให้ตรวจ:

- [ ] ผู้ใช้ทุกคนมี role ถูกต้อง
- [ ] ผู้ใช้ถูกผูก branch ถูกต้อง
- [ ] ผู้ใช้ที่ลาออกถูกปิด active
- [ ] Tenant ถูกต้อง
- [ ] Barcode ไม่ซ้ำ
- [ ] IMEI ไม่ซ้ำ
- [ ] Supplier ถูก tenant
- [ ] Customer ถูก tenant
- [ ] Branch ถูก tenant
- [ ] Audit event มี tenant boundary
- [ ] Notification อยู่ใน tenant ที่ถูกต้อง
- [ ] Database ใช้ SSL ตาม environment policy
- [ ] Production secrets อยู่ใน environment variables
- [ ] ไม่ใช้ข้อมูล production เป็น integration test database

---

# PART B — USER / STAFF GUIDE

## 17. คู่มือพนักงานหน้าร้าน

### 17.1 เริ่มงาน

ก่อนเริ่มขาย:

1. Login ด้วยบัญชีของตนเอง
2. ตรวจสาขาที่กำลังทำงาน
3. ตรวจ POS พร้อมใช้งาน
4. ตรวจเงินทอน/ช่องทางชำระเงินตาม policy ร้าน
5. ตรวจสินค้าและ Stock Alert

ห้ามใช้บัญชีของเพื่อนร่วมงานแทนกัน เพราะระบบต้องสามารถตรวจสอบว่าใครเป็นผู้ทำรายการ

---

## 18. Cashier — ขั้นตอนขายสินค้า

### สินค้าทั่วไป

`POS → ค้นหาสินค้า → Add to POS → ตรวจ Cart → ตรวจ VAT → รับเงิน → ชำระเงิน`

### มือถือที่มี IMEI

`POS → เลือกมือถือ → กรอก IMEI 15 หลัก → Add to POS → ตรวจ IMEI → ตรวจยอด → รับเงิน → ชำระเงิน`

### ถ้า IMEI ผิด

- หยุดรายการ
- ตรวจ IMEI จากเครื่อง/กล่องอีกครั้ง
- กรอกใหม่
- ห้ามเดา IMEI

### ถ้าเงินไม่พอ

- แจ้งยอดที่ต้องชำระ
- ให้ลูกค้าชำระเพิ่ม
- อย่าพยายามกดซ้ำเพื่อ bypass validation

---

## 19. การเพิ่มลูกค้าโดยพนักงานขาย

เมื่อลูกค้าใหม่:

1. เข้า Customers (CRM)
2. กรอกชื่อจริงที่ลูกค้าแจ้ง
3. กรอกเบอร์โทร
4. ตรวจว่ามีลูกค้าเดิมหรือไม่
5. เพิ่มลูกค้า

ใช้ข้อมูลเพื่อ:

- ใบขาย
- ประวัติการซื้อ
- Loyalty
- งานซ่อม
- การติดตามลูกค้า

---

## 20. Technician — ขั้นตอนรับซ่อม

1. รับเครื่องจากลูกค้า
2. ตรวจชื่อ/เบอร์ลูกค้า
3. ตรวจรุ่นเครื่อง
4. บันทึกอาการเสีย
5. ตรวจ IMEI/Serial หากต้องติดตาม
6. บันทึกสภาพเครื่อง
7. สร้างใบรับซ่อม
8. แจ้งสถานะให้ลูกค้า

### ระหว่างซ่อม

เปลี่ยนสถานะตามความจริง:

- Received
- Diagnosing
- Waiting for parts
- Repairing
- Ready
- Completed

ห้ามตั้ง Completed ก่อนเครื่องผ่านการตรวจ

---

## 21. Manager — ตรวจงานประจำวัน

ช่วงเปิดร้าน:

- ตรวจ Dashboard
- ตรวจ Stock Alert
- ตรวจงานซ่อมค้าง
- ตรวจ Cash/POS

ช่วงกลางวัน:

- ตรวจยอดขาย
- ตรวจสินค้าขายดี
- ตรวจ stock ที่ลดเร็ว

ก่อนปิดร้าน:

- ตรวจยอดขายทั้งหมด
- ตรวจรายการที่ชำระสำเร็จ
- ตรวจเงินสด
- ตรวจสินค้าที่ถูกขาย
- ตรวจงานซ่อมที่ยังไม่เสร็จ
- ตรวจ Purchase/Stock movement ที่สำคัญ

---

## 22. Viewer — การใช้งานรายงาน

Viewer ใช้สำหรับดูข้อมูลที่ได้รับอนุญาต โดยเน้น:

- Dashboard
- Sales report
- Inventory report
- Customer report
- Repair report
- Purchase report

ไม่ควรแก้ไขข้อมูล operational หาก role ไม่มี write permission

---

# PART C — WORKFLOW มาตรฐานของร้าน

## 23. Workflow ขายมือถือครบวงจร

```text
ลูกค้าเลือกสินค้า
      ↓
ค้นหา Product/SKU
      ↓
เลือกเครื่องที่มี IMEI
      ↓
ตรวจ IMEI 15 หลัก
      ↓
Add to POS
      ↓
ตรวจราคา + Discount + VAT 7%
      ↓
รับชำระเงิน
      ↓
Checkout
      ↓
สร้าง Sale/Payment
      ↓
ตัด Stock
      ↓
ปิดรายการ
```

ถ้าเกิด error ก่อน Checkout ให้แก้ไขก่อนทำรายการใหม่

---

## 24. Workflow ซื้อสินค้าเข้า

```text
Supplier
  ↓
Purchase Order
  ↓
Approval
  ↓
รับสินค้า
  ↓
ตรวจ SKU / Barcode / IMEI
  ↓
เพิ่ม Stock
  ↓
ตรวจยอดรับจริง
  ↓
ปิด PO
```

---

## 25. Workflow งานซ่อม

```text
รับเครื่อง
  ↓
ตรวจสภาพ
  ↓
Diagnosing
  ↓
ประเมินราคา
  ↓
รออะไหล่ (ถ้ามี)
  ↓
Repairing
  ↓
QC
  ↓
Ready
  ↓
ส่งมอบ
  ↓
Completed
```

---

## 26. Workflow รับซื้อ / Trade-In

```text
รับเครื่องเก่า
  ↓
ตรวจสภาพ
  ↓
ตรวจ IMEI/Serial
  ↓
ประเมินราคา
  ↓
ตรวจ approval ตามวงเงิน
  ↓
อนุมัติ
  ↓
จ่ายเงิน/เครดิตตาม policy
  ↓
นำเข้าสต็อกหรือดำเนินการตามสถานะ
```

---

# PART D — การแก้ปัญหาเบื้องต้น

## 27. กด Add to POS แล้วไม่ได้

ตรวจตามลำดับ:

1. สินค้ายัง Active หรือไม่
2. Stock ยังมีหรือไม่
3. ถ้าเป็น IMEI → กรอก IMEI หรือยัง
4. IMEI ครบ 15 หลักหรือไม่
5. IMEI อยู่ใน branch ที่กำลังใช้งานหรือไม่
6. IMEI อยู่สถานะ `in_stock` หรือไม่

---

## 28. ชำระเงินไม่ได้

### ยอดไม่พอ

ตรวจจำนวนเงินที่รับให้มากกว่าหรือเท่ากับ Total

### Total ไม่ตรง

ตรวจ:

- ราคา
- จำนวน
- Discount
- VAT 7%

อย่าปรับยอดด้วยการแก้ข้อมูลหลังบ้านเพื่อให้ผ่าน validation

---

## 29. เพิ่มลูกค้าไม่ได้

ตรวจ:

- ชื่อลูกค้าต้องไม่ว่าง
- เบอร์โทรต้องไม่ว่าง
- ตรวจข้อมูลลูกค้าเดิมก่อนเพิ่ม

---

## 30. สร้างงานซ่อมไม่ได้

ต้องมีอย่างน้อย:

- ลูกค้า
- อุปกรณ์
- อาการเสีย

จากนั้นกดรับเครื่องซ่อมอีกครั้ง

---

## 31. สร้าง Purchase Order ไม่ได้

ตรวจ:

- Supplier
- จำนวนรายการ > 0
- ยอดรวม > 0

จากนั้นสร้าง PO ใหม่

---

# PART E — DAILY OPERATING CHECKLIST

## 32. เปิดร้าน

**Admin/Manager**

- [ ] ตรวจ Dashboard
- [ ] ตรวจ Stock Alert
- [ ] ตรวจเงิน/สถานะ POS
- [ ] ตรวจงานซ่อมค้าง
- [ ] ตรวจ Purchase ที่ต้องรับ
- [ ] ตรวจ AI Alerts

**Cashier**

- [ ] Login บัญชีตัวเอง
- [ ] ตรวจสาขา
- [ ] ตรวจ POS
- [ ] ตรวจเงินทอน

**Technician**

- [ ] ตรวจ Repair queue
- [ ] ตรวจงานที่รออะไหล่
- [ ] ตรวจงานพร้อมส่งมอบ

## 33. ปิดร้าน

- [ ] ตรวจยอดขาย
- [ ] ตรวจรายการชำระเงิน
- [ ] ตรวจเงินสด
- [ ] ตรวจ Stock movement
- [ ] ตรวจ IMEI ที่ขายวันนี้
- [ ] ตรวจงานซ่อมที่ยังค้าง
- [ ] ตรวจ PO/Transfer ที่ยังไม่ปิด
- [ ] ตรวจ notification/alert
- [ ] ตรวจ audit trail เมื่อมีรายการผิดปกติ

---

# PART F — SECURITY & DATA GOVERNANCE

## 34. กฎสำคัญสำหรับผู้ใช้ทุกคน

1. ห้ามแชร์บัญชี
2. ห้ามแชร์รหัสผ่าน
3. ห้ามนำข้อมูลลูกค้าออกไปใช้โดยไม่ได้รับอนุญาต
4. ห้ามแก้ IMEI ด้วยข้อมูลที่ไม่ตรงกับเครื่อง
5. ห้ามพยายาม bypass validation
6. ห้ามใช้ production database เป็น integration test database
7. หากพบยอดเงิน/สต็อกผิด ให้แจ้ง Manager/Admin แทนการแก้เอง

## 35. Tenant Isolation

ข้อมูลทุกชนิดต้องอยู่ภายใต้ tenant ที่ถูกต้อง เช่น:

- Product
- Customer
- Sale
- Supplier
- Purchase
- Repair
- Audit
- Notification
- AI Insight

หาก tenant ไม่ตรง ระบบควรปฏิเสธการเข้าถึง

## 36. Branch Isolation

ผู้ใช้สามารถทำรายการได้เฉพาะ branch ที่ได้รับอนุญาต

ตัวอย่าง:

> Cashier Branch A ไม่ควรขาย/ปรับสต็อกใน Branch B หากไม่ได้รับสิทธิ์

---

# PART G — ADMIN ACCEPTANCE CHECKLIST

ก่อนเปิดร้านจริง Admin ควรทดสอบอย่างน้อย:

- [ ] Login/Role
- [ ] Tenant access
- [ ] Branch access
- [ ] Product creation
- [ ] Barcode uniqueness
- [ ] IMEI registration
- [ ] IMEI 15-digit validation
- [ ] POS sale
- [ ] VAT calculation
- [ ] Insufficient payment rejection
- [ ] Stock decrement only after successful checkout
- [ ] Customer creation
- [ ] Loyalty rule
- [ ] Repair intake
- [ ] Purchase Order
- [ ] Stock transfer
- [ ] Reports
- [ ] AI insight/approval
- [ ] Audit/notification
- [ ] Backup/operations

---

# PART H — QUICK REFERENCE

| งาน | เมนู | ผู้ใช้หลัก |
|---|---|---|
| ดูภาพรวม | Dashboard | Owner/Admin/Manager/Viewer |
| ขายสินค้า | POS | Cashier/Manager/Admin |
| จัดการสินค้า | Products | Admin/Manager |
| จัดการ IMEI | IMEI Inventory | Admin/Manager/Cashier ตามสิทธิ์ |
| โอนสต็อก | Stock & Transfer | Manager/Admin |
| สั่งซื้อ | Purchases | Manager/Admin |
| ลูกค้า | Customers (CRM) | Cashier/Manager/Admin |
| คะแนน | Loyalty & Points | Manager/Admin |
| ผ่อน | Installment | Manager/Admin |
| รับซ่อม | Repair Center | Technician/Manager/Admin |
| รับซื้อ | Trade-In | Manager/Admin |
| บัญชี | Accounting | Admin/Manager/ผู้มีสิทธิ์ |
| รายงาน | Reports & Analytics | Owner/Admin/Manager/Viewer |
| วิเคราะห์ AI | AI Copilot / Insights | Owner/Admin/Manager |
| Automation | Automation | Owner/Admin |
| Integration | Apps & Integrations | Admin |
| ตั้งค่า | Settings | Owner/Admin |

---

# 37. สรุปสำหรับผู้บริหาร

RetailOS ควรใช้งานโดยแบ่งหน้าที่ชัดเจน:

**Owner/Admin**
> ตั้งระบบ → กำหนดสิทธิ์ → คุมสาขา → คุมสินค้า → ตรวจการเงิน → ตรวจ AI → ตรวจความปลอดภัย

**Manager**
> คุมยอดขาย → คุมสต็อก → คุมลูกค้า → คุมงานซ่อม → คุมจัดซื้อ → ตรวจรายงาน

**Cashier**
> ขาย → ตรวจ IMEI → รับเงิน → ดูแลลูกค้า

**Technician**
> รับซ่อม → ตรวจ → ซ่อม → QC → ส่งมอบ

**Viewer**
> ดูข้อมูลและรายงานตามสิทธิ์

หลักการสำคัญที่สุดคือ **ข้อมูลต้องถูกต้องก่อนเร็ว, สิทธิ์ต้องถูกต้องก่อนเข้าถึง, และธุรกรรมต้องสำเร็จแบบ atomic ก่อนจึงเปลี่ยนสถานะข้อมูลจริง**

---

**เอกสาร:** `USER_ADMIN_GUIDE.md`  
**ระบบ:** RetailOS — AI Operating System  
**Scope:** Admin + User + Operations + Security + Troubleshooting
