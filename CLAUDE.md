# my.mech.data

## น้ำเสียง (ใช้กับทุกข้อความที่สื่อสารกับผู้ใช้)

หนูเป็นน้องสาวตัวเล็ก ๆ พูดจาอ้อนหวาน นอบน้อม สุภาพ และใจเย็นเสมอค่ะ
- แทนตัวเองว่า **"หนู"** เสมอ และเรียกผู้ใช้อย่างให้เกียรติ ให้ผู้ใช้งานเป็นพี่ เสมอ
- ลงท้ายประโยคด้วย **"ค่ะ"** (บอกเล่า) หรือ **"คะ"** (คำถาม) ให้ถูกหลัก
- เป็นผู้หญิง พูดเพราะ อ่อนโยน ไม่ห้วน ไม่ใช้คำหยาบ
- ยังรายงานผลครบถ้วน ตรงไปตรงมา และแม่นยำตามหน้าที่ทุกอย่าง — แค่ห่อด้วยน้ำเสียงที่อ่อนหวาน
- ส่วนที่เป็นโครงสร้างทางเทคนิค (path, ชื่อ section, PASS/FAIL, โค้ด) คงรูปแบบเดิมไว้ให้ถูกต้องเสมอ


Dashboard ส่วนตัวสำหรับเก็บข้อมูลคีย์บอร์ดและต้นทุนที่ซื้อมา — เว็บ static
ที่อ่าน/เขียนข้อมูลลง GitHub ได้ตรงๆ เพื่อให้กรอกจากมือถือได้
แยกเป็นสองหน้า: **`index.html` ดูข้อมูล** กับ **`entry.html` กรอกข้อมูล**

## โครงสร้าง

```
index.html            หน้าสรุป — อ่านอย่างเดียว (hero, สรุป, bars, ตารางคอลเลกชัน)
entry.html            หน้ากรอกข้อมูล — ฟอร์มเพิ่ม/แก้/ลบ + แผง GitHub token
assets/theme.css      สไตล์ที่ทั้งสองหน้าใช้ร่วมกัน
assets/core.js        config · state · helper · GitHub i/o — โค้ดที่ใช้ร่วมกัน (`window.MECH`)
assets/seed.js        สำเนา data/keyboards.json สำหรับ fallback ตอนเปิดด้วย file://
data/keyboards.json   แหล่งข้อมูลจริง — หน้าเว็บอ่านและเขียนไฟล์นี้ผ่าน GitHub API
CLAUDE.md             ไฟล์นี้
```

ไม่มี build, ไม่มี dependency, ไม่มี package.json — แก้ไฟล์แล้ว commit ได้เลย

### สองหน้าแบ่งงานกันยังไง

- **`index.html` ไม่เขียนข้อมูลเลย** — ไม่มีฟอร์ม ไม่มีช่อง token
  คลิกแถวในตารางแล้วเด้งไป `entry.html#<id>` เพื่อแก้
- **`entry.html` เป็นที่เดียวที่เรียก `MECH.persist()`** — ฟอร์ม, ปุ่มลบ,
  ปุ่มล้างตัวอย่าง, แผง token อยู่ที่นี่ทั้งหมด
- ทั้งสองหน้าโหลดข้อมูลด้วย `MECH.load()` ตัวเดียวกัน แต่วาดผลคนละชุด
  — logic ที่ใช้ร่วมกันต้องอยู่ใน `assets/core.js` เท่านั้น อย่า copy ข้ามหน้า
- แต่ละหน้าผูก `MECH.onRender(fn)` (วาดใหม่เมื่อข้อมูลเปลี่ยน) และ
  `MECH.onStatus(fn)` (badge/ข้อความ sync) — core ไม่แตะ DOM เอง
- หน้าสรุปไม่รู้ว่า `entry.html` เพิ่งบันทึกอะไร — ปุ่ม **ดึงข้อมูลใหม่**
  เรียก `MECH.refresh()` (ล้าง `sha` แล้ว `load()` ใหม่)

## ภาษาบนหน้าเว็บ

**ข้อความบน UI เป็นภาษาอังกฤษทั้งหมด** — ปุ่ม, label, หัวตาราง, ข้อความ error,
สถานะ sync เวลาเพิ่มข้อความใหม่ให้เขียนเป็นอังกฤษเสมอ
(ส่วน CLAUDE.md และการคุยกับผู้ใช้ยังเป็นภาษาไทยเหมือนเดิม)

- label ที่เอาไว้โชว์ของ `type` / `status` อยู่ใน `TYPES` / `STATUS`
  ใน `assets/core.js` — **key เป็นค่าใน JSON ห้ามแก้** แก้ได้แค่ค่าที่เป็นข้อความ
- วันที่ใช้ `toLocaleString('en-GB', …)` (เช่น `21 Aug 2026, 10:40`)
  ไม่ใช่ `th-TH` เพราะจะกลายเป็น พ.ศ.
- ตัวเลขเงินใช้ `toLocaleString('en-US')` + สัญลักษณ์ `฿` เพราะสกุลเงินยังเป็นบาท
- ข้อมูลที่ผู้ใช้กรอกเอง (ชื่อรายการ, ร้าน, โน้ต) จะเป็นภาษาอะไรก็ได้
  — การเรียงชื่อยังใช้ `localeCompare(…, 'th')` เพื่อให้ชื่อไทยเรียงถูก

## รูปแบบข้อมูล

`data/keyboards.json`:

```json
{
  "currency": "THB",
  "updated_at": "2026-08-21T03:40:00.000Z",
  "items": [
    {
      "id": "kb-abc123-xy9z",
      "name": "Keychron Q1 Pro",
      "type": "keyboard",
      "vendor": "Shopee",
      "purchased_at": "2026-03-14",
      "status": "owned",
      "cost": { "item": 8900, "tax": 623, "shipping": 120 },
      "notes": "",
      "example": false
    }
  ]
}
```

- `type` — `keyboard` | `switches` | `keycaps` | `parts` | `accessory`
- `status` — `owned` | `incoming` | `sold` | `gifted`
- `cost` เป็นบาททั้งหมด **ไม่เก็บยอดรวม** — `total` คำนวณสดเสมอจาก
  `item + tax + shipping` (ดู `totalOf()`) อย่าเพิ่มฟิลด์ `total` ลง JSON
  เพราะมันจะเพี้ยนกับค่าที่คำนวณได้
- `example: true` = แถวตัวอย่างที่มากับ repo ตอนแรก หน้าเว็บจะขึ้น banner
  ให้กดล้างทิ้ง และการแก้ไขแถวไหนก็ตามจะ set เป็น `false` อัตโนมัติ
- `id` สร้างจาก `newId()` — ห้ามซ้ำ เพราะใช้อ้างอิงตอนแก้/ลบ

## การ sync กับ GitHub

หน้าเว็บโหลดข้อมูลตามลำดับนี้ (`load()` ใน `assets/core.js` — ใช้ร่วมกันทั้งสองหน้า):

1. **GitHub Contents API** — ใช้เมื่อมี token เท่านั้น เป็นทางเดียวที่ได้ `sha`
   ของไฟล์ ซึ่งจำเป็นตอนเขียนกลับ
2. **fetch `data/keyboards.json` แบบ relative** — ใช้ได้เมื่อเปิดผ่าน web server
   หรือ GitHub Pages (repo เป็น public จึงอ่านได้โดยไม่ต้องมี token)
3. **`localStorage['mech.cache.v1']`** — สิ่งที่เบราว์เซอร์นี้เขียนล่าสุด
4. **`window.MECH_SEED`** จาก `assets/seed.js` — fallback สุดท้าย
   ใช้ตอนเปิดไฟล์ตรงๆ ด้วย `file://` (`fetch()` อ่านไฟล์ข้างๆ ไม่ได้
   แต่ `<script src>` ยังโหลดได้)

การเขียนใช้ `PUT /repos/aumiity/my.mech.data/contents/data/keyboards.json`
พร้อม `sha` ถ้าไม่มี `sha` อยู่ในมือ `pushToGitHub()` จะไปดึงมาก่อน และถ้าเจอ
409/422 (มีเครื่องอื่นเขียนแทรก) จะดึง sha ใหม่แล้วลองอีกครั้งหนึ่ง

**Token** เป็น fine-grained PAT ที่ให้สิทธิ์ `Contents: Read and write`
เฉพาะ repo นี้ เก็บใน `localStorage['mech.gh.token']` ของเบราว์เซอร์นั้นๆ
ไม่เคยถูก commit และไม่ถูกส่งไปที่อื่นนอกจาก `api.github.com`

### seed.js ต้อง sync ตามด้วย

`assets/seed.js` เป็นสำเนาของ `data/keyboards.json` ตอนที่ generate ครั้งล่าสุด
— มันจะเก่าไปเรื่อยๆ เมื่อกรอกข้อมูลผ่านเว็บ ซึ่งไม่เป็นไรเพราะเป็นแค่
fallback ชั้นสุดท้าย ถ้าอยากให้ตรงกันอีกครั้ง:

```sh
node -e "
const fs=require('fs');
const d=fs.readFileSync('data/keyboards.json','utf8').trim();
fs.writeFileSync('assets/seed.js',
  '/* fallback copy of data/keyboards.json — regenerate with the snippet in CLAUDE.md */\n' +
  'window.MECH_SEED = ' + d + ';\n');"
```

## Theme

CSS อยู่ที่ `assets/theme.css` ไฟล์เดียว ทั้งสองหน้า `<link>` ตัวเดียวกัน
— แก้ที่นี่ที่เดียวแล้วเปลี่ยนทั้งเว็บ

Theme ยืมมาจาก session-report ของ Claude Code — terminal window chrome,
block-char bars (`█`/`░`), หัวข้อ `▸`, เส้น `.hr`, สีเน้น `--clay: #D97757`

- font: JetBrains Mono + Noto Sans Thai Looped (JetBrains Mono ไม่มี glyph ไทย
  ตัวอักษรไทยจึงตกไปที่ font ตัวที่สองอัตโนมัติ — **ห้ามเอาออก** ถึงแม้ UI
  จะเป็นอังกฤษแล้ว เพราะชื่อรายการที่ผู้ใช้กรอกยังเป็นไทยได้)
- `font-variant-numeric: tabular-nums` ทำให้ตัวเลขในตารางเรียงตรงคอลัมน์
- ความกว้าง bar ใช้หน่วย `ch` จึงขยายตามขนาดฟอนต์เอง ไม่ต้องแก้ตาม
  แต่จำนวนบล็อกอยู่ในโค้ด (`bars()` ใน `index.html` ใช้ 40 บล็อก,
  16 บล็อกบนจอเล็ก) โดยเช็ค `window.innerWidth < 760`
  ให้ตรงกับ media query ใน `assets/theme.css` เสมอ

### จุดที่ตั้งใจให้ต่างจาก session-report

อย่าเผลอ "แก้กลับ" ให้เหมือน report — สามข้อนี้แก้เพราะอ่านยาก:

1. **พื้นหลังเป็นดาร์ค** — report วาง terminal บนพื้น ivory สว่าง
   (`--ivory: #FAF9F5`) แต่หน้านี้ใช้ `--page-bg: #0e0d0c`
   token `--ivory` ยังอยู่เฉยๆ เพื่อบอกที่มาของ palette
2. **ฟอนต์ใหญ่ขึ้นหนึ่งขั้น** — base 13px → 15px, ตาราง 12px → 14px,
   ป้ายเล็ก 11px → 12px
3. **สีเทาสองตัวสว่างขึ้น** — ของเดิม contrast ต่ำกว่าเกณฑ์อ่านง่ายชัดเจน

   | token | เดิม | contrast | ใหม่ | contrast |
   |---|---|---|---|---|
   | `--dim` | `rgb(136,136,136)` | 4.95:1 | `rgb(158,154,146)` | 6.26:1 |
   | `--subtle` | `rgb(80,80,80)` | **2.18:1** | `rgb(134,130,122)` | 4.59:1 |

   `--subtle` ใช้กับตัวหนังสือ 12px เยอะ (meta line, หัวตาราง, `.detail`,
   `.hint`) ถ้าจะปรับสีอีก ให้เช็คว่ายังได้ ≥ 4.5:1 บน `--term-bg` (#1a1918)

## ทดสอบ

ไม่มี test runner แต่ logic ทั้งหมดอยู่ใน IIFE และไม่แตะ DOM API แปลกๆ
จึงรันด้วย DOM shim ใน node ได้ — โหลด `assets/seed.js` + `assets/core.js`
แล้วดึง `<script>` block ของหน้าที่จะทดสอบออกมา `new Function(code)()`
พร้อม stub ของ `document.getElementById`, `localStorage`, `fetch`, `location`
แล้วอ่าน `innerHTML` / `value` ของแต่ละ element เพื่อตรวจผล
วิธีนี้จับ error ตอน render และตรวจยอดรวมได้โดยไม่ต้องเปิดเบราว์เซอร์

จุดที่ควรตรวจหลังแก้: ไม่มีตัวอักษรไทยหลุดมาใน UI (เช็คด้วย
`/[\u0E01-\u0E3E\u0E40-\u0E5B]/` — ข้าม `฿` ที่เป็น U+0E3F),
ยอด hero/summary/footer ตรงกับ `item+tax+shipping`,
ตาราง `index.html` มีแถว, `picker` ใน `entry.html` มีแถว,
เปิด `entry.html#<id>` แล้วฟอร์มเด้งข้อมูลรายการนั้นขึ้นมาจริง,
และ fallback `assets/seed.js` ทำงานเมื่อ `fetch` ล้มเหลว

## หมายเหตุ

- repo เป็น **public** — ข้อมูลใน `data/keyboards.json` ทุกคนเห็นได้
  ถ้าไม่อยากให้ราคาที่ซื้อเป็นสาธารณะ ต้องเปลี่ยน repo กลับเป็น private
  (แล้ว GitHub Pages จะต้องใช้ GitHub Pro)
- **อย่า commit ไฟล์ `session-report-*.html`** — ข้างในมี prompt
  และชื่อไฟล์จากโปรเจกต์งานอื่น (Syntropic-desktop) ติดมาด้วย
  มี `.gitignore` กันไว้แล้ว
