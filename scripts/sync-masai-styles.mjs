import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
//npm run sync:masai-styles
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");
const masaiBlocksRoot = path.resolve(projectRoot, "..", "masai-blocks");
const sourceStylesDir = path.join(masaiBlocksRoot, "registry", "styles");
const targetStylesDir = path.join(projectRoot, "src", "lib");

const filesToSync = ["masai-colors.css", "masai-typography.css"];

async function syncStyles() {
  await mkdir(targetStylesDir, { recursive: true });

  await Promise.all(
    filesToSync.map(async (fileName) => {
      const sourcePath = path.join(sourceStylesDir, fileName);
      const targetPath = path.join(targetStylesDir, fileName);
      await copyFile(sourcePath, targetPath);
      return { fileName, sourcePath, targetPath };
    }),
  );

  console.log("Synced Masai style tokens:");
  for (const fileName of filesToSync) {
    console.log(`- ${fileName}`);
  }
}

syncStyles().catch((error) => {
  console.error("Failed to sync Masai styles.");
  console.error(error);
  process.exitCode = 1;
});
