#!/usr/bin/env node
// Minimal JSON field extractor so wire-access.sh doesn't need `jq` installed.
// Reads JSON from stdin, prints the value at a dotted path (supports [N] array
// indexing and .find(key=value) for locating an object in an array by field).
//
// Usage:
//   echo '{"result":{"id":"abc"}}' | node jq-lite.mjs result.id
//   echo '{"result":[{"name":"a","id":1},{"name":"b","id":2}]}' \
//     | node jq-lite.mjs 'result.find(name=b).id'
//
// Exits 1 (no output) if the path doesn't resolve, so callers can use
// `id=$(... | node jq-lite.mjs ...) || true` and check for an empty string.

let input = "";
process.stdin.on("data", (d) => (input += d));
process.stdin.on("end", () => {
  let data;
  try {
    data = JSON.parse(input);
  } catch {
    process.exit(1);
  }

  const expr = process.argv[2] ?? "";
  let current = data;

  // Split on "." at depth 0 only, so dots inside find(...) values (e.g. a
  // hostname like "hr.example.com") don't get split apart.
  const parts = [];
  let depth = 0;
  let buf = "";
  for (const ch of expr) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "." && depth === 0) {
      parts.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  parts.push(buf);

  for (const part of parts) {
    if (current == null) break;

    const findMatch = part.match(/^find\(([^=]+)=(.*)\)$/);
    const indexMatch = part.match(/^(\w+)\[(\d+)\]$/);

    if (findMatch) {
      const [, key, value] = findMatch;
      current = Array.isArray(current) ? current.find((item) => String(item[key]) === value) : undefined;
    } else if (indexMatch) {
      const [, key, idx] = indexMatch;
      current = current[key]?.[Number(idx)];
    } else {
      current = current[part];
    }
  }

  if (current === undefined || current === null) process.exit(1);
  console.log(typeof current === "string" ? current : JSON.stringify(current));
});
