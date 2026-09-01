import fs from 'fs';
import path from 'path';
import { validateSchemaAgainstBaseline, formatDiffReport } from '../src/governance/schemaDiff';
import currentSchema from '../src/graphql';

const args = process.argv.slice(2);

let basePath = path.resolve(process.cwd(), 'schema.graphql');
let format = 'console';
let allowBreaking = false;

for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--base' && args[i + 1]) {
    basePath = path.resolve(process.cwd(), args[i + 1]);
    i += 1;
  } else if (args[i] === '--format' && args[i + 1]) {
    format = args[i + 1];
    i += 1;
  } else if (args[i] === '--allow-breaking') {
    allowBreaking = true;
  }
}

if (!fs.existsSync(basePath)) {
  console.error(`❌ Baseline schema file not found at: ${basePath}`);
  console.error('Run "npm run schema:dump" to generate the initial baseline schema.');
  process.exit(1);
}

try {
  const result = validateSchemaAgainstBaseline(basePath, currentSchema);
  const report = formatDiffReport(result, { format });
  console.log(report);

  if (!result.isCompatible && !allowBreaking) {
    console.error('\n❌ CI Check Failed: Breaking changes detected in GraphQL schema!');
    process.exit(1);
  }

  process.exit(0);
} catch (err) {
  console.error(`❌ Error executing schema diff: ${err.message}`);
  process.exit(1);
}
