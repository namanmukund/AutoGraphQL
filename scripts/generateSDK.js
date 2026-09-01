import fs from 'fs';
import path from 'path';
import { generateTypeScriptSDK } from '../src/codegen/sdkGenerator';
import schema from '../src/graphql';

const args = process.argv.slice(2);
let outputPath = path.resolve(process.cwd(), 'sdk/index.ts');

const outIndex = args.indexOf('--output');
if (outIndex !== -1 && args[outIndex + 1]) {
  outputPath = path.resolve(process.cwd(), args[outIndex + 1]);
}

try {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tsCode = generateTypeScriptSDK(schema);
  fs.writeFileSync(outputPath, tsCode, 'utf8');

  console.log(`✅ TypeScript SDK successfully generated at: ${outputPath} (${tsCode.length} bytes)`);
  process.exit(0);
} catch (err) {
  console.error(`❌ Failed to generate TypeScript SDK: ${err.message}`);
  process.exit(1);
}
