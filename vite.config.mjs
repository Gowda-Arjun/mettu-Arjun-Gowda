import { defineConfig } from "vite";
import dotenv from 'dotenv';
import tailwindcss from "@tailwindcss/vite";
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import { processImages } from './src/image-preprocess.mjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '/assets/images');
const outputDir = path.join(__dirname, '/assets/images-processed');
const siteConfigPath = path.join(__dirname, 'config.yaml');
const requirementsPath = path.join(__dirname, 'requirements.txt');
const DEFAULT_PYTHON_EXECUTABLE = 'python3';

processImages(inputDir, outputDir).catch(e =>
  console.error('[images] initial processing failed', e)
);

const sanitizeExecutable = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
};

const loadSiteConfig = () => {
  try {
    const raw = fs.readFileSync(siteConfigPath, 'utf8');
    return YAML.parse(raw) || {};
  } catch (err) {
    console.error('[config] Unable to read config.yaml', err);
    return {};
  }
};

const resolvePythonExecutable = () => {
  const envOverride = sanitizeExecutable(process.env.PY_EXECUTABLE);
  if (envOverride) {
    return envOverride;
  }

  const siteConfig = loadSiteConfig();
  const runtimeConfig = siteConfig && typeof siteConfig === 'object' ? siteConfig.runtime : null;

  const candidates = [
    runtimeConfig && runtimeConfig.python_executable,
    runtimeConfig && runtimeConfig.python,
    runtimeConfig && runtimeConfig.interpreter,
    siteConfig && siteConfig.python_executable,
    siteConfig && siteConfig.python,
  ];

  for (const candidate of candidates) {
    const value = sanitizeExecutable(candidate);
    if (value) {
      return value;
    }
  }

  return DEFAULT_PYTHON_EXECUTABLE;
};

let pythonExecutable = resolvePythonExecutable();
console.log(`[config] Using Python executable: ${pythonExecutable}`);

const ensurePythonRequirements = () => {
  try {
    console.log('Installing python dependencies...');
    execSync(`${pythonExecutable} -m pip install -r "${requirementsPath}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error('Failed to install Python dependencies. Verify interpreter path.', e);
  }
};

const runGenerateStyles = () => {
  try {
    const output = execSync(`${pythonExecutable} src/main.py --generate-styles`);
    const text = output.toString().trim();
    if (text) {
      console.log(text);
    }
  } catch (e) {
    console.error('[styles] failed to generate theme/font CSS.', e);
  }
};

const refreshPythonExecutable = () => {
  const resolved = resolvePythonExecutable();
  if (resolved !== pythonExecutable) {
    console.log(`[config] Python executable updated to: ${resolved}`);
    pythonExecutable = resolved;
    ensurePythonRequirements();
  } else {
    pythonExecutable = resolved;
  }
  return pythonExecutable;
};

ensurePythonRequirements();
runGenerateStyles();

const py_build_plugin = () => {
  let ready = false;

  const handleExit = () => {
    console.log('\nCleaning up build files...');
    try {
      const output = execSync(`${pythonExecutable} src/main.py --clean`);
      console.log(output.toString().trim());
    } catch (e) {
      console.error("Cleanup script failed:", e);
    }
    process.exit();
  };

  process.on('SIGINT', handleExit);

  return {
    name: 'builder-ssg',
    configureServer(server) {
      const regenerateGeneratedCss = () => {
        runGenerateStyles();
      };

      const build = (file = null) => {
        const command = file
          ? `${pythonExecutable} src/main.py --file ${file}`
          : `${pythonExecutable} src/main.py`;

        try {
          const output = execSync(command);
          console.log(output.toString().trim());

          server.ws.send({ type: 'full-reload', path: "*" });
          ready = true;
        } catch (e) {
          console.error("Script failed to update: ", e);
        }
      };

      build();

      server.watcher.on('all', (event, filePath) => {
        if (!ready) {
          return;
        }

        if (filePath.endsWith('config.yaml')) {
          refreshPythonExecutable();
          regenerateGeneratedCss();
          build();
          return;
        }

        if (filePath.includes('/content/') || filePath.includes('/templates/')) {
          if (event === 'change') {
            const buildTarget = filePath.includes('/templates/') ? null : filePath;
            build(buildTarget);
          } else if (event === 'add' || event === 'unlink') {
            build();
          }
        }
        if (event === 'change' && filePath.includes('/assets/css/')) {
          build();
        }
        if (event === 'unlink') {
          build();
        }
      });
    },
  };
};

export default defineConfig({
  plugins: [
    py_build_plugin(),
    tailwindcss(),
  ],
  build: {
    outDir: './dist',
  },
});
