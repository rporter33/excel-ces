// prisma/seed.ts
// Seeds the database with the complete product catalog from CES 2026.2

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // ── TEAR-OFF LABOR ──
  const tearOff = [
    ["Asphalt tear off", 46], ["Additional layers of asphalt shingles", 31.5],
    ["Felt Tear Off after 2nd layer", 3.5], ["Tri Laminate", 65], ["Heavy Shake", 65],
    ["Medium Shake or Cedar Shingles", 65], ["Modified", 33],
    ["Steep TO/install - 7/12", 11], ["Steep TO/install - 8/12", 21],
    ["Steep TO/Install - 9/12", 24], ["Steep TO/install - 10/12", 30],
    ["Steep TO/install - 11/12", 34], ["Steep TO/install - 12/12", 42],
    ["Concrete Tile", 100], ["Redeck per sheet (includes TO and Install)", 20],
    ["Tarp Haul", 9], ["Trip Fee to grab materials", 80],
  ];
  for (let i = 0; i < tearOff.length; i++) {
    await prisma.product.create({ data: { name: tearOff[i][0], unitCost: tearOff[i][1], category: "TEAR_OFF", isLabor: true, unitType: "SQUARE", sortOrder: i } });
  }

  // ── INSTALL LABOR ──
  const install = [
    ["3-tab/Dimensional install", 40], ["Starter shingles", 9], ["Ridge shingles", 9],
    ["6 nail application", 10], ["Premium 2-layer (Presidential, Woodcrest)", 75],
    ["Premium 3-layer (Presidential TL, Woodmoor)", 80], ["Double felt under 4/12", 7],
    ["Modified Bitumen / Peel & Stick", 47], ["Skylight Flashing", 40],
    ["Swamp Cooler Flashing", 75], ["Chimney Flashing & Counter Flashing", 40],
    ["Skylight Dome/Window R&R", 65], ["Cut hole for attic vent", 12],
    ["Install solar powered fan", 35], ["Cut/install cont. ridge vent (lf)", 2.5],
    ["R&R cont. ridge vent (lf)", 1.25], ["R&R cont. eave vent (lf)", 2.5],
    ["Cut/install cont. eave vent (lf)", 1.25], ["Install counter flashing (lf)", 1.25],
    ["Install headwall flashing (lf)", 1.25], ["Ice & Water ($50/roll)", 55],
    ["Mansard Install", 20], ["Valley (lf)", 2], ["D&R Swamp Cooler", 150],
    ["D&R Satellite Dish", 50], ["Hand Load", 20], ["Remove gutters (lf)", 1],
    ["2 Story surcharge", 15], ["Decking Install per sheet", 14],
    ["Hand load Decking per sheet", 1], ["Build Cricket", 100], ["Install F-Wave shingles", 95],
  ];
  for (let i = 0; i < install.length; i++) {
    await prisma.product.create({ data: { name: install[i][0], unitCost: install[i][1], category: "INSTALL", isLabor: true, unitType: "SQUARE", sortOrder: i } });
  }

  // ── SHINGLES ──
  const shingles = [
    ["OC Supreme 3 Tab 25yr", "Owens Corning", 153.93],
    ["OC Duration & Designer Dimensional LL", "Owens Corning", 141.00],
    ["OC Duration Storm LL Class 4 IR", "Owens Corning", 159.00],
    ["OC Woodcrest LL", "Owens Corning", 231.18],
    ["OC Woodmoor LL", "Owens Corning", 264.18],
    ["OC Duration Flex SBS Class 4 IR", "Owens Corning", 171.00],
    ["CertainTeed Landmark", "CertainTeed", 150.21],
    ["CertainTeed Landmark TL", "CertainTeed", 274.16],
    ["CertainTeed Northgate ClimateFlex SBS Class 4 IR", "CertainTeed", 180.72],
    ["CertainTeed Presidential Shake Class 4 IR", "CertainTeed", 276.20],
    ["CertainTeed Presidential Shake Ltd Life", "CertainTeed", 256.20],
    ["CertainTeed Presidential Shake TL LL", "CertainTeed", 289.56],
    ["CertainTeed Grand Manor LL", "CertainTeed", 410.30],
    ["Malarkey Highlander NEX", "Malarkey", 150.27],
    ["Malarkey Vista AR Class 4 IR", "Malarkey", 165.09],
    ["Malarkey Legacy SBS LL Class 4 IR", "Malarkey", 180.72],
    ["Malarkey Windsor SBS LL Class 4 IR", "Malarkey", 289.55],
    ["GAF Timberline HD Standard LL", "GAF", 158.85],
    ["F-Wave Revia Designer Slate", "F-Wave", 0],
    ["F-Wave Revia Shake", "F-Wave", 0],
    ["F-Wave Classic Slate", "F-Wave", 0],
  ];
  for (let i = 0; i < shingles.length; i++) {
    await prisma.product.create({ data: { name: shingles[i][0], manufacturer: shingles[i][1], unitCost: shingles[i][2], category: "SHINGLE", isLabor: false, unitType: "SQUARE", sortOrder: i } });
  }

  // ── COLORS ──
  const colors = [
    "Aged Bark","Amber","Antique Brown","Antique Silver","Autumn Blend","Bark Wood",
    "Black Canyon","Black Oak","Black Walnut","Brownstone","Brownwood","Buckskin Tan",
    "Burnt Sienna","Charcoal Black","Charcoal Grey","Chateau Green","Chestnut",
    "Classic Weathered Wood","Cottage Red","Country Gray","Desert Tan","Driftwood",
    "Estate Gray","Espresso","Flagstone","Granite Gray","Harbor Blue","Harvest Brown",
    "Heather","Heather Blend","Hunter Green","Midnight Black","Natural Wood","Oakwood",
    "Onyx Black","Pewter Gray","Quarry Gray","Rustic Slate","Sable","Sedona Canyon",
    "Shadow Gray","Shasta White","Shenandoah","Sienna Blend","Sierra Gray","Silverwood",
    "Slate Gray","Storm Cloud","Storm Grey","Summer Harvest","Tahoe","Teak","Terra Cotta",
    "Thunderstorm Gray","Tudor Brown","Weathered White","Weathered Wood",
  ];
  for (let i = 0; i < colors.length; i++) {
    await prisma.shingleColor.create({ data: { name: colors[i], sortOrder: i } });
  }
  const fwave = ["American Blend Birchwood","American Blend Charcoal","American Blend Harvest",
    "Colonial Estate","Hampton Estate","Lakeshore","Mountain Cedar","Sonoma Estate","Woodland Estate"];
  for (let i = 0; i < fwave.length; i++) {
    await prisma.shingleColor.create({ data: { name: fwave[i], manufacturer: "F-Wave", sortOrder: 100 + i } });
  }

  // ── DEFAULT USER ──
  await prisma.user.upsert({
    where: { email: "admin@excelroofing.com" },
    update: {},
    create: { name: "Admin", email: "admin@excelroofing.com", role: "SYSTEM_ADMIN" },
  });

  console.log("✅ Seed complete.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
