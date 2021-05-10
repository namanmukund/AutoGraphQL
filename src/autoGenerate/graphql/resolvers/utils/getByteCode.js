import { spawnSync, exec } from 'child_process';
import * as fs from 'fs';
import * as util from 'util';
import { decode } from 'base-64';

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const pythonVersion = util.promisify(exec);
const getByteCode = async (input) => {
  const code = decode(input);
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
  try {
    const pyVersion = await pythonVersion('python3 -c "import platform; print(platform.python_version())"');
    const { stdout } = pyVersion;
    const pyVersionArray = stdout.toString()
      .split('.');
    const pyVersionNumber = pyVersionArray[0] + pyVersionArray[1];
    const res = await readFile(`/tmp/__pycache__/main.cpython-${pyVersionNumber}.pyc`);
    return {
      byteCode: res.toString('base64'),
    };
  } catch (e) {
    return {
      error: e,
    };
  }
};

export default getByteCode;
