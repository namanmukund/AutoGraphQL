import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as util from 'util';
import * as path from 'path';
import { decode } from 'base-64';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const getByteCode = async (input) => {
  const code = decode(input);
  // const mainFilePath = path.join(__dirname, '../../../../../main.py');
  await writeFile('/tmp/main.py', code, 'utf8');

  const pythonProcess = spawnSync('python3', ['-m', 'py_compile', '/tmp/main.py']);
  if (pythonProcess.error) {
    return {
      error: 'Internal Error',
    };
  }

  if (pythonProcess.status) {
    return {
      error: pythonProcess.stderr.toString(),
    };
  }
  // 37 is not a magic number, it is version of python - 3.7
  // This code needs to updated to get correct python version according to the system.
  const res = await readFile('/tmp/__pycache__/main.cpython-37.pyc');
  return {
    byteCode: res.toString('base64'),
  };
};

export default getByteCode;
