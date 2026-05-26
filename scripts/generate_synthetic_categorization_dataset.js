import fs from "node:fs";
import path from "node:path";

const vendors = [
  ["Uber", "Travel", "airport cab ride"],
  ["Ola", "Travel", "client meeting cab"],
  ["IndiGo", "Travel", "business flight"],
  ["Swiggy", "Food", "team dinner"],
  ["Zomato", "Food", "overtime meal"],
  ["DMart", "Groceries", "monthly groceries"],
  ["BigBasket", "Groceries", "pantry supplies"],
  ["Amazon", "Shopping", "office accessory"],
  ["Notion", "Software", "workspace subscription"],
  ["Zoom", "Software", "video meeting subscription"],
  ["Office Depot", "Office", "stationery purchase"],
  ["Apollo Pharmacy", "Health", "medical purchase"],
];

const rows = [];

for (let i = 0; i < 600; i += 1) {
  const [vendor, category, description] = vendors[i % vendors.length];
  const amount = 250 + ((i * 137) % 12000);
  const reimbursable = ["Travel", "Food", "Software", "Office"].includes(category);

  rows.push({
    id: i + 1,
    vendor,
    amount,
    currency: "INR",
    description,
    category,
    reimbursable,
    prompt: `Categorize this transaction: vendor=${vendor}, amount=${amount}, description=${description}`,
    completion: category,
  });
}

const outputDir = path.join(process.cwd(), "data");
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "synthetic_spend_categorization.jsonl"),
  rows.map((row) => JSON.stringify(row)).join("\n")
);

console.log(`Generated ${rows.length} rows`);
