#!/usr/bin/env node
/**
 * Regenerates scripts/iconify-prefixes.json from the public collections list.
 * Run when Iconify adds new icon sets:  node scripts/update-prefixes.js
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const OUTPUT = path.join(__dirname, "iconify-prefixes.json");

https
  .get("https://api.iconify.design/collections", (res) => {
    let data = "";

    res.on("data", (chunk) => (data += chunk));

    res.on("end", () => {
      try {
        const prefixes = Object.keys(JSON.parse(data)).sort();

        if (prefixes.length === 0) {
          throw new Error("collections list came back empty");
        }

        fs.writeFileSync(OUTPUT, JSON.stringify(prefixes, null, 2) + "\n");
        console.log(`✅ ${prefixes.length} prefixes written to ${OUTPUT}`);
      } catch (err) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
    });
  })
  .on("error", (err) => {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  });
