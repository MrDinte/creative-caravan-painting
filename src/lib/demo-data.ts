import type {
  Invoice,
  StockItem,
  Supplier,
  TimesheetEntry,
  ContactSubmission,
  GalleryItem,
  Job,
  JobUpdate,
  OrderEnquiry,
  PriceBookItem,
  Product,
  Quote,
  Staff,
  Task,
} from "./types";

// Seeded staff. Names match the assignees on the seeded tasks.
export const demoStaff: Staff[] = [
  {
    id: "s1", name: "Tim", role: "Owner / Spray Painter", active: true,
    username: "tim", accessLevel: "admin", hasLogin: true,
    hourlyRateCents: 6500, overtimeMultiplier: 2.5, overtimeAfterHours: 38,
    defaultBreakMinutes: 30, createdAt: "2026-01-05T00:00:00.000Z",
  },
  {
    id: "s2", name: "Jake", role: "Panel & Prep", active: true,
    username: "jake", accessLevel: "staff", hasLogin: true,
    hourlyRateCents: 4200, overtimeMultiplier: 2.5, overtimeAfterHours: 38,
    defaultBreakMinutes: 30, createdAt: "2026-01-05T00:00:00.000Z",
  },
  {
    id: "s3", name: "Mel", role: "Interiors & Upholstery", active: true,
    username: "mel", accessLevel: "staff", hasLogin: true,
    hourlyRateCents: 4000, overtimeMultiplier: 2.5, overtimeAfterHours: 38,
    defaultBreakMinutes: 30, createdAt: "2026-03-02T00:00:00.000Z",
  },
];

// scrypt hashes of "workshop2026" for the demo logins.
export const demoStaffPasswords: Record<string, string> = {
  s1: "e0f59d1dac1081e8a245ced83629a10b:3f513ce4c31bce700e441a0c2b159acf8a3841326ea139f697c4f6b40334a7fab89946438da740a5f01f27d077671d77dcab1bb07f35e62f46061c3453bef9bc",
  s2: "26c83fea3768d64d098d4d0bea4c76f9:9c99b448f9b1e735bde315fdac50910ae9718a50b09d09ab3802f2e795324ede973f704a5bd872f08869a400f64656c2dec8cb10e456b04de8bd97a2a9c33165",
  s3: "1a80bd0b0fb4bded733126a3ee134ed0:37c2a19a5ec4db54401a9a39aa0daf8cac8d2c47aa117519be8f86a229b99338105604f7a81ab33c327c524fb38045afbb9e60ee0230cf4b72dd8890a5ae10fd",
};

// A fortnight of hours, including a week that tips Jake into overtime.
export const demoTimesheets: TimesheetEntry[] = [
  { id: "ts1", staffId: "s2", jobId: "j1", workDate: "2026-07-13", hours: 8.5, breakMinutes: 30, notes: "Sanding and prep", createdAt: "2026-07-13T17:00:00.000Z" },
  { id: "ts2", staffId: "s2", jobId: "j1", workDate: "2026-07-14", hours: 8.5, breakMinutes: 30, notes: "Masking", createdAt: "2026-07-14T17:00:00.000Z" },
  { id: "ts3", staffId: "s2", jobId: "j1", workDate: "2026-07-15", hours: 9, breakMinutes: 30, notes: "Prep finish", createdAt: "2026-07-15T17:00:00.000Z" },
  { id: "ts4", staffId: "s2", jobId: "j4", workDate: "2026-07-16", hours: 9, breakMinutes: 30, notes: "Vinyl flooring", createdAt: "2026-07-16T17:00:00.000Z" },
  { id: "ts5", staffId: "s2", jobId: "j4", workDate: "2026-07-17", hours: 9.5, breakMinutes: 30, notes: "Gas lift bed", createdAt: "2026-07-17T17:00:00.000Z" },
  { id: "ts6", staffId: "s1", jobId: "j1", workDate: "2026-07-16", hours: 7.5, breakMinutes: 30, notes: "Base coat", createdAt: "2026-07-16T17:00:00.000Z" },
  { id: "ts7", staffId: "s1", jobId: "j2", workDate: "2026-07-17", hours: 6, breakMinutes: 30, notes: "Frame polishing", createdAt: "2026-07-17T17:00:00.000Z" },
  { id: "ts8", staffId: "s3", jobId: "j4", workDate: "2026-07-16", hours: 8, breakMinutes: 30, notes: "Cushion reupholstery", createdAt: "2026-07-16T17:00:00.000Z" },
];

// Demo dataset used when no DATABASE_URL is configured, so the site works
// end-to-end as a live demo. Swap to Neon by setting DATABASE_URL (see db/schema.sql).

export const demoJobs: Job[] = [
  {
    id: "j1",
    jobCode: "CCP-2026-001",
    title: "Full Exterior Respray — Two-Tone Teal",
    customerName: "Sarah Mitchell",
    customerEmail: "sarah@example.com",
    vanMakeModel: "Jayco Starcraft 2004",
    status: "in_progress",
    accessCode: "VAN123",
    scheduledStart: "2026-07-13",
    scheduledEnd: "2026-07-24",
    assignedTo: "s1",
    location: "workshop",
    notes: "Customer chose 2 pac teal over white, new decals supplied.",
    createdAt: "2026-07-01T09:00:00.000Z",
  },
  {
    id: "j2",
    jobCode: "CCP-2026-002",
    title: "Millard Louvre Window Restoration",
    customerName: "Greg Thompson",
    customerEmail: "greg@example.com",
    vanMakeModel: "Millard 1978",
    status: "awaiting_parts",
    accessCode: "VAN456",
    scheduledStart: "2026-07-20",
    scheduledEnd: "2026-07-28",
    assignedTo: "s1",
    location: "workshop",
    notes: "Curved perspex on order. Winder and lock repairs included.",
    createdAt: "2026-07-05T09:00:00.000Z",
  },
  {
    id: "j3",
    jobCode: "CCP-2026-003",
    title: "Retro Two-Tone Restoration",
    customerName: "Lisa & Mark Nguyen",
    customerEmail: "nguyen@example.com",
    vanMakeModel: "Viscount Grand Tourer 1976",
    status: "booked",
    accessCode: "VAN789",
    scheduledStart: "2026-08-03",
    scheduledEnd: "2026-08-21",
    assignedTo: "s2",
    location: "bellmere",
    notes: "Full resto: decal removal, rust repair, mustard/cream scheme.",
    createdAt: "2026-07-10T09:00:00.000Z",
  },
  {
    id: "j4",
    jobCode: "CCP-2026-004",
    title: "Interior Reno + Roof Reseal",
    customerName: "Dave Carter",
    customerEmail: "dave@example.com",
    vanMakeModel: "Coromal Excel 2010",
    status: "quality_check",
    accessCode: "VAN321",
    scheduledStart: "2026-06-29",
    scheduledEnd: "2026-07-22",
    assignedTo: "s2",
    location: "workshop",
    notes: "Globalcote roof reseal, vinyl flooring, gas lift bed install.",
    createdAt: "2026-06-15T09:00:00.000Z",
  },
];

export const demoTasks: Task[] = [
  { id: "t1", jobId: "j1", workId: "CCP-2026-001-W01", title: "Sand and prep exterior panels", assignee: "Jake", status: "done", createdAt: "2026-07-13T08:00:00.000Z" },
  { id: "t2", jobId: "j1", workId: "CCP-2026-001-W02", title: "Mask windows and trim", assignee: "Jake", status: "done", createdAt: "2026-07-14T08:00:00.000Z" },
  { id: "t3", jobId: "j1", workId: "CCP-2026-001-W03", title: "Spray base coat — 2 pac white", assignee: "Tim", status: "in_progress", createdAt: "2026-07-16T08:00:00.000Z" },
  { id: "t4", jobId: "j1", workId: "CCP-2026-001-W04", title: "Spray feature band — teal", assignee: "Tim", status: "todo", createdAt: "2026-07-16T08:05:00.000Z" },
  { id: "t5", jobId: "j1", workId: "CCP-2026-001-W05", title: "Apply new decals + final polish", assignee: "Jake", status: "todo", createdAt: "2026-07-16T08:10:00.000Z" },
  { id: "t6", jobId: "j2", workId: "CCP-2026-002-W01", title: "Remove louvre panes and frames", assignee: "Jake", status: "done", createdAt: "2026-07-20T08:00:00.000Z" },
  { id: "t7", jobId: "j2", workId: "CCP-2026-002-W02", title: "Order curved perspex cut-to-size", assignee: "Tim", status: "in_progress", createdAt: "2026-07-20T09:00:00.000Z" },
  { id: "t8", jobId: "j3", workId: "CCP-2026-003-W01", title: "Strip old decals and assess rust", assignee: "Jake", status: "todo", createdAt: "2026-07-10T09:30:00.000Z" },
  { id: "t9", jobId: "j4", workId: "CCP-2026-004-W01", title: "Globalcote roof reseal", assignee: "Tim", status: "done", createdAt: "2026-06-29T08:00:00.000Z" },
  { id: "t10", jobId: "j4", workId: "CCP-2026-004-W02", title: "Lay vinyl flooring", assignee: "Jake", status: "done", createdAt: "2026-07-06T08:00:00.000Z" },
  { id: "t11", jobId: "j4", workId: "CCP-2026-004-W03", title: "Install gas lift bed", assignee: "Jake", status: "done", createdAt: "2026-07-13T08:00:00.000Z" },
  { id: "t12", jobId: "j4", workId: "CCP-2026-004-W04", title: "Final quality inspection", assignee: "Tim", status: "in_progress", createdAt: "2026-07-20T08:00:00.000Z" },
];

export const demoUpdates: JobUpdate[] = [
  { id: "u1", jobId: "j1", author: "Tim", message: "Van booked in — colours confirmed: teal feature band over 2 pac white.", visibleToCustomer: true, photoUrls: [], createdAt: "2026-07-13T10:00:00.000Z" },
  { id: "u2", jobId: "j1", author: "Jake", message: "Prep complete. Panels sanded back and masked, ready for spray booth.", visibleToCustomer: true, photoUrls: [], createdAt: "2026-07-15T15:30:00.000Z" },
  { id: "u3", jobId: "j1", author: "Tim", message: "Base coat down and looking great — feature band goes on this week.", visibleToCustomer: true, photoUrls: [], createdAt: "2026-07-18T11:00:00.000Z" },
  { id: "u4", jobId: "j1", author: "Tim", message: "Internal note: order extra teal tint for touch-up kit.", visibleToCustomer: false, photoUrls: [], createdAt: "2026-07-18T11:05:00.000Z" },
  { id: "u5", jobId: "j2", author: "Tim", message: "Frames cleaned and polished. Curved perspex on order — ETA next week.", visibleToCustomer: true, photoUrls: [], createdAt: "2026-07-21T09:00:00.000Z" },
  { id: "u6", jobId: "j4", author: "Jake", message: "Interior fit-out finished! Final inspection underway, pickup Friday.", visibleToCustomer: true, photoUrls: [], createdAt: "2026-07-20T14:00:00.000Z" },
];

export const demoProducts: Product[] = [
  {
    id: "p1",
    slug: "perspex-cut-to-size",
    name: "Custom Perspex — Cut to Size",
    category: "Perspex & Windows",
    priceCents: 4500,
    description:
      "Quality perspex supplied and cut to size for caravans, boats and homes — including curved perspex for vintage van windows. Tell us your measurements at checkout and we'll cut it to fit.",
    art: { body: "#bae6fd", stripe: "#0369a1", accent: "#0ea5e9" },
  },
  {
    id: "p2",
    slug: "caravan-reseal-kit",
    name: "Caravan Reseal Kit",
    category: "Repairs & Sealing",
    priceCents: 12900,
    description:
      "Everything you need to stop leaks before they start: premium sealant, backing rod, applicator and step-by-step guide from our workshop team.",
    art: { body: "#fde68a", stripe: "#b45309", accent: "#f59e0b" },
  },
  {
    id: "p3",
    slug: "exterior-polish-restore-kit",
    name: "Exterior Polish & Restore Kit",
    category: "Paint & Finish",
    priceCents: 7900,
    description:
      "Bring the shine back to tired aluminium cladding. Cutting compound, polish and microfibre kit — the same products we use on full restorations.",
    art: { body: "#a7f3d0", stripe: "#047857", accent: "#10b981" },
  },
  {
    id: "p4",
    slug: "window-rubber-seal-pack",
    name: "Window Rubber & Seal Pack",
    category: "Perspex & Windows",
    priceCents: 5900,
    description:
      "Replacement rubbers, fly screens and dust seals for most caravan windows, including Millard louvre windows. Keep the dust out and the cool in.",
    art: { body: "#e9d5ff", stripe: "#7e22ce", accent: "#a855f7" },
  },
  {
    id: "p5",
    slug: "restoration-booking-deposit",
    name: "Restoration Booking Deposit",
    category: "Services",
    priceCents: 15000,
    description:
      "Secure your spot in the workshop. Your deposit locks in a start date for a respray, restoration or renovation and comes straight off your final invoice.",
    art: { body: "#99f6e4", stripe: "#0f766e", accent: "#14b8a6" },
  },
  {
    id: "p6",
    slug: "gift-voucher-100",
    name: "Gift Voucher — $100",
    category: "Gift Vouchers",
    priceCents: 10000,
    description:
      "The perfect gift for the caravan lover in your life. Redeemable on any service or product — from window repairs to a full respray.",
    art: { body: "#fecdd3", stripe: "#be123c", accent: "#f43f5e" },
  },
];

export const demoGallery: GalleryItem[] = [
  {
    id: "g1",
    title: "Jayco Starcraft — Coastal Teal Respray",
    vanMakeModel: "Jayco Starcraft 2004",
    jobType: "Exterior Transformation",
    description:
      "Faded and chalky to head-turner. Full sand-back, 2 pac white base with a coastal teal feature band and fresh decals.",
    before: { body: "#d6d3d1", stripe: "#a8a29e", accent: "#78716c" },
    after: { body: "#ffffff", stripe: "#0f766e", accent: "#14b8a6" },
  },
  {
    id: "g2",
    title: "Viscount Grand Tourer — Retro Mustard Resto",
    vanMakeModel: "Viscount Grand Tourer 1976",
    jobType: "Full Restoration",
    description:
      "A 1976 classic given a new lease on life: rust repairs, decal removal, and a period-correct mustard and cream two-tone.",
    before: { body: "#e7e5e4", stripe: "#d97706", accent: "#92400e" },
    after: { body: "#fef3c7", stripe: "#d97706", accent: "#f59e0b" },
  },
  {
    id: "g3",
    title: "Millard — Sunset Orange Makeover",
    vanMakeModel: "Millard 1982",
    jobType: "Interior & Exterior Makeover",
    description:
      "Louvre windows restored and polished, new seals throughout, and a bold sunset orange band to finish the exterior makeover.",
    before: { body: "#f5f5f4", stripe: "#a8a29e", accent: "#57534e" },
    after: { body: "#fff7ed", stripe: "#ea580c", accent: "#fb923c" },
  },
  {
    id: "g4",
    title: "Coromal Excel — Modern Grey Two-Tone",
    vanMakeModel: "Coromal Excel 2010",
    jobType: "Respray + Reseal",
    description:
      "Insurance hail repair turned full refresh: panel repairs, Globalcote roof reseal, and a sharp modern graphite two-tone.",
    before: { body: "#e7e5e4", stripe: "#78716c", accent: "#44403c" },
    after: { body: "#f8fafc", stripe: "#334155", accent: "#0f766e" },
  },
];

export const demoPriceBook: PriceBookItem[] = [
  { id: "pb1", code: "PB-EXT-01", name: "Full exterior respray — 2 pac (single axle van)", category: "Exterior Painting", unit: "each", priceCents: 650000 },
  { id: "pb2", code: "PB-EXT-02", name: "Full exterior respray — 2 pac (tandem axle van)", category: "Exterior Painting", unit: "each", priceCents: 850000 },
  { id: "pb3", code: "PB-EXT-03", name: "Feature band / two-tone upgrade", category: "Exterior Painting", unit: "each", priceCents: 120000 },
  { id: "pb4", code: "PB-EXT-04", name: "Decal removal", category: "Exterior Painting", unit: "per hour", priceCents: 9500 },
  { id: "pb5", code: "PB-SEAL-01", name: "Roof reseal — Globalcote", category: "Reseals & Repairs", unit: "each", priceCents: 185000 },
  { id: "pb6", code: "PB-SEAL-02", name: "Window / hatch reseal", category: "Reseals & Repairs", unit: "per window", priceCents: 18500 },
  { id: "pb7", code: "PB-WIN-01", name: "Window winder or lock repair", category: "Windows", unit: "each", priceCents: 12500 },
  { id: "pb8", code: "PB-WIN-02", name: "Perspex supply & cut — flat", category: "Windows", unit: "per m²", priceCents: 22000 },
  { id: "pb9", code: "PB-WIN-03", name: "Perspex supply & cut — curved", category: "Windows", unit: "per window", priceCents: 38000 },
  { id: "pb10", code: "PB-INT-01", name: "Vinyl flooring supply & lay", category: "Interior", unit: "per m²", priceCents: 14500 },
  { id: "pb11", code: "PB-INT-02", name: "Gas lift bed install", category: "Interior", unit: "each", priceCents: 145000 },
  { id: "pb12", code: "PB-LAB-01", name: "General workshop labour", category: "Labour", unit: "per hour", priceCents: 11000 },
];

export const demoQuotes: Quote[] = [
  {
    id: "q1",
    quoteNumber: "Q-2026-014",
    customerName: "Peter Hall",
    customerEmail: "peter@example.com",
    customerPhone: "0400 111 222",
    vanMakeModel: "Franklin Regent 1979",
    status: "sent",
    notes: "Includes colour matching to supplied swatch. Rust repair quoted separately if found during prep.",
    validUntil: "2026-08-18",
    createdAt: "2026-07-18T09:00:00.000Z",
    lines: [
      { id: "q1l1", priceBookItemId: "pb1", description: "Full exterior respray — 2 pac (single axle van)", qty: 1, unitPriceCents: 650000 },
      { id: "q1l2", priceBookItemId: "pb3", description: "Feature band / two-tone upgrade", qty: 1, unitPriceCents: 100000 },
      { id: "q1l3", priceBookItemId: "pb4", description: "Decal removal", qty: 4, unitPriceCents: 9500 },
    ],
  },
  {
    id: "q2",
    quoteNumber: "Q-2026-015",
    customerName: "Robyn West",
    customerEmail: "robyn@example.com",
    customerPhone: "0400 333 444",
    vanMakeModel: "Jayco Freedom 1998",
    status: "draft",
    notes: "",
    validUntil: "2026-08-21",
    createdAt: "2026-07-21T09:00:00.000Z",
    lines: [
      { id: "q2l1", priceBookItemId: "pb5", description: "Roof reseal — Globalcote", qty: 1, unitPriceCents: 185000 },
      { id: "q2l2", priceBookItemId: "pb6", description: "Window / hatch reseal", qty: 6, unitPriceCents: 18500 },
      { id: "q2l3", priceBookItemId: null, description: "Supply + fit new roof hatch (custom)", qty: 1, unitPriceCents: 42000 },
    ],
  },
];

export const demoContacts: ContactSubmission[] = [];
export const demoOrders: OrderEnquiry[] = [];

// One settled invoice and one part-paid, so the portal's payment progress bar
// has something meaningful to show in the demo.
export const demoInvoices: Invoice[] = [
  {
    id: "inv1",
    invoiceNumber: "INV-2026-001",
    jobId: "j1",
    customerName: "Sarah Mitchell",
    customerEmail: "sarah@example.com",
    status: "sent",
    issuedDate: "2026-07-15",
    dueDate: "2026-07-29",
    notes: "50% deposit received. Balance due on collection.",
    lines: [
      { id: "il1", description: "Full exterior respray — 2 pac (single axle van)", qty: 1, unitPriceCents: 650000 },
      { id: "il2", description: "Feature band / two-tone upgrade", qty: 1, unitPriceCents: 120000 },
    ],
    payments: [
      {
        id: "pay1",
        invoiceId: "inv1",
        amountCents: 423500,
        method: "bank",
        reference: "Deposit — CBA transfer",
        paidAt: "2026-07-15T04:00:00.000Z",
        recordedBy: "Tim",
      },
    ],
    createdAt: "2026-07-15T03:00:00.000Z",
  },
  {
    id: "inv2",
    invoiceNumber: "INV-2026-002",
    jobId: "j4",
    customerName: "Dave Carter",
    customerEmail: "dave@example.com",
    status: "paid",
    issuedDate: "2026-07-20",
    dueDate: "2026-08-03",
    notes: "Paid in full on collection. Thanks Dave!",
    lines: [
      { id: "il3", description: "Roof reseal — Globalcote", qty: 1, unitPriceCents: 185000 },
      { id: "il4", description: "Vinyl flooring supply & lay", qty: 8, unitPriceCents: 14500 },
      { id: "il5", description: "Gas lift bed install", qty: 1, unitPriceCents: 145000 },
    ],
    payments: [
      {
        id: "pay2",
        invoiceId: "inv2",
        amountCents: 495000,
        method: "card",
        reference: "EFTPOS on collection",
        paidAt: "2026-07-22T02:00:00.000Z",
        recordedBy: "Tim",
      },
    ],
    createdAt: "2026-07-20T01:00:00.000Z",
  },
];

export const demoSuppliers: Supplier[] = [
  {
    id: "sup1", name: "Brisbane Paint Supplies", contactName: "Dan Whitfield",
    phone: "07 3888 1200", email: "orders@bnepaint.example",
    website: "https://bnepaint.example", address: "12 Industrial Ave, Brendale QLD 4500",
    accountNumber: "CCP-4471", notes: "2 pac and primers. 30-day account. Free delivery over $500.",
    createdAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "sup2", name: "Acrylic & Perspex Direct", contactName: "Priya Raman",
    phone: "07 3555 8890", email: "sales@perspexdirect.example",
    website: "https://perspexdirect.example", address: "8 Kremzow Rd, Brendale QLD 4500",
    accountNumber: "AP-2210", notes: "Cut-to-size perspex, curved a specialty. 3–5 day lead time.",
    createdAt: "2026-02-14T00:00:00.000Z",
  },
  {
    id: "sup3", name: "Caravan Parts Wholesale", contactName: "Mick Doyle",
    phone: "07 3204 7766", email: "mick@cpwholesale.example",
    website: "", address: "44 Boundary Rd, Narangba QLD 4504",
    accountNumber: "CPW-0912", notes: "Windows, hatches, winders, seals. Best prices on bulk orders.",
    createdAt: "2026-03-08T00:00:00.000Z",
  },
];

export const demoStockItems: StockItem[] = [
  { id: "st1", ccpCode: "CCP-S-0001", barcode: "9310872001234", name: "2 pac topcoat — Gloss White 4L", category: "paint", unit: "tin", qtyOnHand: 6, reorderLevel: 3, costCents: 18500, saleCents: 27500, supplierId: "sup1", location: "Paint store A2", notes: "Base for most resprays.", createdAt: "2026-03-01T00:00:00.000Z" },
  { id: "st2", ccpCode: "CCP-S-0002", barcode: "9310872005678", name: "2 pac topcoat — Coastal Teal 4L", category: "paint", unit: "tin", qtyOnHand: 2, reorderLevel: 2, costCents: 21000, saleCents: 31500, supplierId: "sup1", location: "Paint store A3", notes: "Feature band colour.", createdAt: "2026-03-01T00:00:00.000Z" },
  { id: "st3", ccpCode: "CCP-S-0003", barcode: "", name: "Etch primer 4L", category: "paint", unit: "tin", qtyOnHand: 9, reorderLevel: 4, costCents: 11000, saleCents: 16500, supplierId: "sup1", location: "Paint store A1", notes: "", createdAt: "2026-03-01T00:00:00.000Z" },
  { id: "st4", ccpCode: "CCP-S-0004", barcode: "9315544220017", name: "Perspex sheet 2440×1220 — 3mm clear", category: "acrylic", unit: "sheet", qtyOnHand: 4, reorderLevel: 2, costCents: 14500, saleCents: 24000, supplierId: "sup2", location: "Rack B", notes: "Cut to size for windows.", createdAt: "2026-03-04T00:00:00.000Z" },
  { id: "st5", ccpCode: "CCP-S-0005", barcode: "9315544220024", name: "Perspex sheet — 4mm tinted", category: "acrylic", unit: "sheet", qtyOnHand: 1, reorderLevel: 2, costCents: 19500, saleCents: 32500, supplierId: "sup2", location: "Rack B", notes: "Low — reorder.", createdAt: "2026-03-04T00:00:00.000Z" },
  { id: "st6", ccpCode: "CCP-S-0006", barcode: "9300675110099", name: "Window winder assembly", category: "windows", unit: "each", qtyOnHand: 12, reorderLevel: 5, costCents: 3200, saleCents: 6500, supplierId: "sup3", location: "Bin C4", notes: "Fits most Millard and Jayco.", createdAt: "2026-03-10T00:00:00.000Z" },
  { id: "st7", ccpCode: "CCP-S-0007", barcode: "9300675110105", name: "Window rubber seal — 10m roll", category: "windows", unit: "roll", qtyOnHand: 3, reorderLevel: 2, costCents: 4800, saleCents: 8900, supplierId: "sup3", location: "Bin C5", notes: "", createdAt: "2026-03-10T00:00:00.000Z" },
  { id: "st8", ccpCode: "CCP-S-0008", barcode: "", name: "Entry door — 1750×600 white", category: "doors", unit: "each", qtyOnHand: 2, reorderLevel: 1, costCents: 68000, saleCents: 105000, supplierId: "sup3", location: "Rack D", notes: "Special order, 2 week lead.", createdAt: "2026-03-12T00:00:00.000Z" },
  { id: "st9", ccpCode: "CCP-S-0009", barcode: "9312445007781", name: "Checker plate trim — 3m length", category: "trim", unit: "length", qtyOnHand: 7, reorderLevel: 4, costCents: 5600, saleCents: 9900, supplierId: "sup3", location: "Rack E", notes: "", createdAt: "2026-03-12T00:00:00.000Z" },
  { id: "st10", ccpCode: "CCP-S-0010", barcode: "9311234556677", name: "Masking tape 48mm — carton of 24", category: "consumables", unit: "carton", qtyOnHand: 5, reorderLevel: 2, costCents: 7200, saleCents: 11500, supplierId: "sup1", location: "Consumables shelf", notes: "", createdAt: "2026-03-15T00:00:00.000Z" },
  { id: "st11", ccpCode: "CCP-S-0011", barcode: "", name: "Globalcote roof sealant 15L", category: "consumables", unit: "drum", qtyOnHand: 1, reorderLevel: 2, costCents: 32000, saleCents: 48000, supplierId: "sup1", location: "Consumables shelf", notes: "Low — used on most reseals.", createdAt: "2026-03-15T00:00:00.000Z" },
];
