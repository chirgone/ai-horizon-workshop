#!/usr/bin/env node
// Safely patches a single string field's value inside a JSONC file (wrangler.jsonc
// configs, which have comments so a real JSON.parse/stringify round-trip would be
// lossy). Matches "<field>": "<anything, including \" escapes>" and replaces just
// the value, leaving comments/formatting elsewhere in the file untouched.
//
// Usage: node patch-json-field.mjs <file> <fieldName> <newValue> [occurrenceIndex=0]
//
// If <newValue> already starts and ends with a literal `"`, it's used verbatim
// (for pre-escaped JSON-string values, e.g. FlareID's SIGNING_PUBLIC_JWK). Otherwise
// it's JSON-stringified automatically.

import { readFileSync, writeFileSync } from "node:fs";

const [, , file, fieldName, newValue, occurrenceArg] = process.argv;
if (!file || !fieldName || newValue === undefined) {
  console.error("Usage: node patch-json-field.mjs <file> <fieldName> <newValue> [occurrenceIndex=0]");
  process.exit(1);
}
const occurrence = occurrenceArg ? Number(occurrenceArg) : 0;

const rawValue = newValue.startsWith('"') && newValue.endsWith('"') ? newValue : JSON.stringify(newValue);

const content = readFileSync(file, "utf8");
const pattern = new RegExp(`("${fieldName}"\\s*:\\s*)"(?:[^"\\\\]|\\\\.)*"`, "g");

let count = 0;
let replaced = false;
const patched = content.replace(pattern, (match, prefix) => {
  if (count++ === occurrence) {
    replaced = true;
    return `${prefix}${rawValue}`;
  }
  return match;
});

if (!replaced) {
  console.error(`Field "${fieldName}" (occurrence ${occurrence}) not found in ${file}`);
  process.exit(1);
}

writeFileSync(file, patched, "utf8");
console.log(`Patched ${fieldName} in ${file}`);
