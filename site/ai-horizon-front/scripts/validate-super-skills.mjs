import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { skills } from '../src/skill-content.js';

const contractsRoot = new URL('../../../super-skills/', import.meta.url);
const contractFields = ['summary', 'trigger', 'inputs', 'outputs', 'sourceRequirements', 'boundaries', 'approval', 'prompt'];

function valuesFor(skill) {
  return contractFields.flatMap((field) => Array.isArray(skill[field]) ? skill[field] : [skill[field]]);
}

for (const skill of skills) {
  const contractUrl = new URL(`${skill.slug}/SKILL.md`, contractsRoot);
  const contract = await readFile(contractUrl, 'utf8');
  const missing = valuesFor(skill).filter((value) => !contract.includes(value));
  if (!contract.includes(`name: ${skill.slug}`) || !contract.includes(`# ${skill.title}`) || missing.length > 0) {
    const path = fileURLToPath(contractUrl);
    throw new Error(`${path} does not match the UI contract. Missing: ${missing.join(' | ') || 'identity metadata'}`);
  }
}

console.log(`Validated ${skills.length} canonical Super Skill contracts.`);
