import { promises as fs } from 'fs';
import path from 'path';
import postcss from 'postcss';
import { compileString } from 'sass-embedded';

function getFilePriority(fileName) {
  if (fileName.includes('themes')) return 0;
  if (fileName.includes('design-system')) return 1;
  return 2;
}
export function compareFiles(a, b) {
  const priorityDiff = getFilePriority(a.id) - getFilePriority(b.id);
  if (priorityDiff !== 0) {
    return priorityDiff;
  }
  const nameA = path.basename(a.id);
  const nameB = path.basename(b.id);
  return nameA.localeCompare(nameB);
}
function copyFontFolders(emitFile) {
  return async function (fontImport) {
    const fontDir = path.join(path.dirname(fontImport.id), 'files');
    const fontFiles = await fs.readdir(fontDir);

    await Promise.all(fontFiles.map(async file => {
      const filePath = path.join(fontDir, file);
      emitFile({
        type: 'asset',
        fileName: path.join(path.basename(fontDir), file),
        source: await fs.readFile(filePath)
      });
    }));
  }
}

export default function bundleSass({ output, noOutput = false, copyFonts = false, exclusive = true, scssOnly = false, postfixOptions = {} } = {}) {
  const files = new Set();
  const bundleExt = "scss";
  const {
    plugins = [],
    use = [],
  } = postfixOptions;
  return {
    name: 'bundle-sass',
    transform(source, id) {
      if (/\.s?[ac]ss$/.test(id)) {
        if (/\.sass$/.test(id)) {
          bundleExt = "sass";
        }
        files.add({ id, content: source });
        if (exclusive) {
          return { code: `export default ${JSON.stringify(source)}` };
        }
      }
      return null;
    },
    async generateBundle(opts) {
      if (noOutput) {
        return;
      }
      const outputName = output || `${opts.file ? path.parse(opts.file).name : 'index'}.${bundleExt}`;
      
      const outputPath = path.resolve(
        opts.file ? path.dirname(opts.file) : opts.dir,
        outputName,
      );
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      const uniqueFiles = Array.from(files);
      uniqueFiles.sort(compareFiles);

      const bundledContent = use.join('\n')
        + uniqueFiles.map((file) => file.content).join('\n');
      //await fs.writeFile(outputPath, bundledContent);
      this.emitFile({
        type: 'asset',
        fileName: outputName,
        source: bundledContent
      });

      if (scssOnly) {
        return;
      }

      if (copyFonts) {
        const fontSourceFiles = uniqueFiles.filter((file) => file.id.includes("@fontsource"));
        await Promise.all(fontSourceFiles.map(copyFontFolders(this.emitFile)));
      }

      const cssResult = await compileString(bundledContent, {});

      const outputName2 = `${outputName.replace(/\.s?[ac]ss$/, '.css')}`;

      const validPlugins = plugins.filter(Boolean);
      const r = await postcss(validPlugins)
        .process(cssResult.css);

      this.emitFile({
        type: 'asset',
        fileName: outputName2,
        source: r.css
      });
      if (r.map) {
        this.emitFile({
          type: 'asset',
          fileName: `${outputName2}.map`,
          source: r.map.toString()
        });
      }
    },
  };
}
