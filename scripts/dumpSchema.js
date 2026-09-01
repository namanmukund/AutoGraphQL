import fs from 'fs';
import path from 'path';
import { printSchema } from 'graphql';
import schema from '../src/graphql';

const args = process.argv.slice(2);
let outputPath = path.resolve(process.cwd(), 'schema.graphql');

const outIndex = args.indexOf('--output');
if (outIndex !== -1 && args[outIndex + 1]) {
  outputPath = path.resolve(process.cwd(), args[outIndex + 1]);
}

try {
  const sdl = printSchema(schema);
  fs.writeFileSync(outputPath, sdl, 'utf8');
  console.log(`✅ GraphQL schema successfully dumped to: ${outputPath} (${sdl.length} bytes)`);
  process.exit(0);
} catch (err) {
  console.error(`❌ Failed to dump schema: ${err.message}`);
  process.exit(1);
}
