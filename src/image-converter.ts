import { Command } from "commander";
import path from "path";
import fsp from "fs/promises";
import os from "os";
import { globby } from "globby";
import sharp from "sharp";
import bmp from "@vingle/bmp-js";

const tempDir = ".image-converter-temp";

const conversion_boolean_path = path.join(tempDir, ".conversion");
const code_search_files_path = path.join(tempDir, ".code_search_files");
const staged_files_path = path.join(tempDir, ".staged_files");
const exclusions_path = path.join(tempDir, ".converter_exclusions");
const converted_source_image_files_path = path.join(
  tempDir,
  ".converted_source_image_files"
);
const converted_target_image_files_path = path.join(
  tempDir,
  ".converted_target_image_files"
);
const error_path = path.join(tempDir, ".converter_errors");

const jpegImageExtensions = ["jpg", "jpeg", "jpe", "jif", "jfif", "jfi"];

const heImageExtensions = [
  "heif",
  "heifs",
  "heic",
  "heics",
  "avci",
  "avcs",
  "avif",
  "avifs",
];

try {
  if ((await fsp.stat(tempDir).catch(() => false)) === false) {
    await fsp.mkdir(tempDir);
  }

  if ((await fsp.stat(conversion_boolean_path).catch(() => false)) !== false) {
    await fsp.unlink(conversion_boolean_path);
  }
  if ((await fsp.stat(code_search_files_path).catch(() => false)) !== false) {
    await fsp.unlink(code_search_files_path);
  }
  if (
    (await fsp.stat(converted_source_image_files_path).catch(() => false)) !==
    false
  ) {
    await fsp.unlink(converted_source_image_files_path);
  }
  if (
    (await fsp.stat(converted_target_image_files_path).catch(() => false)) !==
    false
  ) {
    await fsp.unlink(converted_target_image_files_path);
  }
  if ((await fsp.stat(error_path).catch(() => false)) !== false) {
    await fsp.unlink(error_path);
  }
} catch (err) {
  console.error("\x1b[41m%s\x1b[0m", err);
  throw err;
}

interface Options {
  imageGlob: string;
  codeGlob: string | undefined;
  processSvgFiles: boolean;
  overrideStagedFiles: boolean;
  overrideExcludedFiles: boolean;
  createFallbackImage: boolean;
}

class ImageConverter {
  options: Options;
  conversion_error = false;

  constructor(argv: string[]) {
    const program = this.getOptions(argv);
    this.options = program.opts();
  }

  getOptions(argv: string[]) {
    const program = new Command();

    program
      .version("0.1.1", "-v, --version")
      .usage("[OPTIONS]...")
      .requiredOption("-i, --image-glob <value>", "glob to search image files")
      .option("-c, --code-glob <value>", "glob to search code files")
      .option("--process-svg-files", "process SVG files", false)
      .option("--override-staged-files", "don't exclude unstaged files", false)
      .option(
        "--override-excluded-files",
        "don't exclude files from exclusions list",
        false
      )
      .option(
        "--create-fallback-image",
        "create a PNG/GIF file if a JPEG, PNG, GIF, TIFF, or BMP file doesn't exist",
        false
      )
      .parse(argv);

    return program;
  }

  async runProgram() {
    const files = await globby(path.normalize(this.options.imageGlob));
    await this.processFiles(files);
  }

  async processFiles(files: string[]): Promise<void> {
    try {
      let stagedFilesList: string[] | undefined;
      let exclusions: RegExp | undefined;
      let filesFiltered: string[];

      filesFiltered = files;

      if (!this.options.overrideStagedFiles) {
        stagedFilesList = (await fsp.readFile(staged_files_path, "utf-8"))
          .trim()
          .split(/[\r\n]/);
      }
      if (!this.options.overrideExcludedFiles) {
        exclusions = new RegExp(
          (await fsp.readFile(exclusions_path, "utf-8"))
            .trim()
            .replace(/[\r\n]/g, "|")
        );
      }

      const exclusionsString = String(exclusions);

      if (
        !this.options.overrideStagedFiles &&
        !this.options.overrideExcludedFiles
      ) {
        if (exclusionsString !== "/(?:)/") {
          filesFiltered = files.filter(
            (filepath) =>
              stagedFilesList?.includes(filepath) === true &&
              exclusions?.test(filepath) === false
          );
        } else {
          filesFiltered = files.filter((filepath) =>
            stagedFilesList?.includes(filepath)
          );
        }
      } else if (!this.options.overrideStagedFiles) {
        filesFiltered = files.filter((filepath) =>
          stagedFilesList?.includes(filepath)
        );
      } else if (!this.options.overrideExcludedFiles) {
        if (exclusionsString !== "/(?:)/") {
          filesFiltered = files.filter(
            (filepath) => exclusions?.test(filepath) === false
          );
        }
      }

      console.log(
        "\x1b[36m%s\x1b[0m",
        "Converting images to alternative format..."
      );

      if (filesFiltered.length > 0) {
        const actions = filesFiltered.map(async (inputFile) =>
          this.processImage(inputFile, files)
        );
        const boolArray = await Promise.all(actions);
        const converted = boolArray.some((bool) => bool);
        if (!converted && !this.conversion_error) {
          console.log("\x1b[34m%s\x1b[0m", "No images need converting.");
        } else if (converted) {
          let code_search_files: string[] | undefined;

          await fsp.appendFile(conversion_boolean_path, "");

          if (
            this.options.codeGlob !== undefined &&
            !this.options.overrideStagedFiles
          ) {
            code_search_files = (
              await globby(path.normalize(this.options.codeGlob))
            ).filter((filepath) => stagedFilesList?.includes(filepath));
          } else if (this.options.codeGlob !== undefined) {
            code_search_files = await globby(
              path.normalize(this.options.codeGlob)
            );
          }
          if (code_search_files !== undefined && code_search_files.length > 0) {
            await fsp.appendFile(
              code_search_files_path,
              code_search_files.join(os.EOL) + os.EOL
            );
          }
        }
      } else {
        console.log("\x1b[34m%s\x1b[0m", "No images need converting.");
      }
    } catch (err) {
      console.error("\x1b[41m%s\x1b[0m", err);
      throw err;
    }
  }

  async processImage(inputFile: string, files: string[]): Promise<boolean> {
    const inputFileDir = path.dirname(inputFile);
    const inputFileBaseNameNoExt = path.basename(
      inputFile,
      path.extname(inputFile)
    );
    const inputFileExt = path.extname(inputFile).slice(1);
    const inputFilePathNoExt = path.join(inputFileDir, inputFileBaseNameNoExt);

    const filePaths = {
      jpgFilePath: inputFilePathNoExt + ".jpg",
      jpegFilePath: inputFilePathNoExt + ".jpeg",
      pngFilePath: inputFilePathNoExt + ".png",
      gifFilePath: inputFilePathNoExt + ".gif",
      svgFilePath: inputFilePathNoExt + ".svg",
      tifFilePath: inputFilePathNoExt + ".tif",
      tiffFilePath: inputFilePathNoExt + ".tiff",
      bmpFilePath: inputFilePathNoExt + ".bmp",
      heifFilePath: inputFilePathNoExt + ".heif",
      heifsFilePath: inputFilePathNoExt + ".heifs",
      heicFilePath: inputFilePathNoExt + ".heic",
      heicsFilePath: inputFilePathNoExt + ".heics",
      avciFilePath: inputFilePathNoExt + ".avci",
      avcsFilePath: inputFilePathNoExt + ".avcs",
      avifFilePath: inputFilePathNoExt + ".avif",
      avifsFilePath: inputFilePathNoExt + ".avifs",
      webpFilePath: inputFilePathNoExt + ".webp",
    };

    let image: sharp.Sharp;
    let metadata: sharp.Metadata;
    let svgToLossless = false;

    if (inputFileExt === "svg") {
      if (this.options.processSvgFiles) {
        image = sharp(inputFile, { animated: true });

        const svgFileSizeInKilobytes = (await fsp.stat(inputFile)).size / 1024;

        if (svgFileSizeInKilobytes < 1) {
          svgToLossless = true;
        }
      } else {
        return false;
      }
    } else if (inputFileExt === "bmp") {
      const bitmap = bmp.decode(await fsp.readFile(inputFile), true);
      image = sharp(bitmap.data, {
        raw: { width: bitmap.width, height: bitmap.height, channels: 4 },
      });
    } else {
      image = sharp(inputFile, { animated: true });
    }

    try {
      metadata = await image.metadata();
    } catch (err) {
      console.error(
        "\x1b[31m%s\x1b[0m",
        "Error processing metadata for image " + inputFile
      );
      console.error("\x1b[41m%s\x1b[0m", err);
      this.conversion_error = true;
      try {
        await fsp.appendFile(error_path, inputFile + os.EOL);
        return false;
      } catch (err) {
        console.error("\x1b[41m%s\x1b[0m", err);
        throw err;
      }
    }

    const metadataFormat: string | undefined = metadata.format;

    if (
      inputFileExt !== metadataFormat &&
      metadataFormat !== "raw" &&
      !(inputFileExt === "tif" && metadataFormat === "tiff") &&
      !(
        heImageExtensions.includes(inputFileExt) && metadataFormat === "heif"
      ) &&
      !(jpegImageExtensions.includes(inputFileExt) && metadataFormat === "jpeg")
    ) {
      console.error(
        "\x1b[41m%s\x1b[0m",
        "Error: " +
          inputFile +
          " has extension " +
          inputFileExt +
          " but metadata format of " +
          String(metadataFormat)
      );
      this.conversion_error = true;
      try {
        await fsp.appendFile(error_path, inputFile + os.EOL);
        return false;
      } catch (err) {
        console.error("\x1b[41m%s\x1b[0m", err);
        throw err;
      }
    }

    if (
      !files.some(
        (filename) =>
          filePaths.webpFilePath === filename ||
          Object.values(filePaths)
            .slice(8, -1)
            .some((newFileExt) => filename === newFileExt)
      )
    ) {
      image.webp({
        quality: 100,
        lossless:
          (metadataFormat === "gif" ||
            metadataFormat === "bmp" ||
            svgToLossless) &&
          true,
        effort: 6,
      });

      try {
        await image.toFile(filePaths.webpFilePath);
        console.log("\x1b[32m%s\x1b[0m", "Converted " + inputFile);
        await fsp.appendFile(
          converted_source_image_files_path,
          inputFile + os.EOL
        );
        await fsp.appendFile(
          converted_target_image_files_path,
          filePaths.webpFilePath + os.EOL
        );
      } catch (err) {
        console.error(
          "\x1b[31m%s\x1b[0m",
          "Error processing image " + inputFile
        );
        console.error("\x1b[41m%s\x1b[0m", err);
        this.conversion_error = true;
        try {
          await fsp.appendFile(error_path, inputFile + os.EOL);
          return false;
        } catch (err) {
          console.error("\x1b[41m%s\x1b[0m", err);
          throw err;
        }
      }
      return true;
    } else if (this.options.createFallbackImage) {
      if (
        !Object.values(filePaths)
          .slice(0, -9)
          .some((newFileExt) =>
            files.some((filename) => newFileExt === filename)
          )
      ) {
        let imageFileName: string;
        if (metadata.pages == null || metadata.pages <= 1) {
          image.png({ quality: 100, effort: 10 });
          imageFileName = filePaths.pngFilePath;
        } else {
          image.gif({ effort: 10 });
          imageFileName = filePaths.gifFilePath;
        }
        try {
          await image.toFile(imageFileName);
          console.log("\x1b[32m%s\x1b[0m", "Converted " + inputFile);
          await fsp.appendFile(
            converted_source_image_files_path,
            inputFile + os.EOL
          );
          await fsp.appendFile(
            converted_target_image_files_path,
            imageFileName + os.EOL
          );
        } catch (err) {
          console.error(
            "\x1b[31m%s\x1b[0m",
            "Error processing image " + inputFile
          );
          console.error("\x1b[41m%s\x1b[0m", err);
          this.conversion_error = true;
          try {
            await fsp.appendFile(error_path, inputFile + os.EOL);
            return false;
          } catch (err) {
            console.error("\x1b[41m%s\x1b[0m", err);
            throw err;
          }
        }
        return true;
      }
    }
    return false;
  }
}

export {
  ImageConverter,
  conversion_boolean_path,
  code_search_files_path,
  staged_files_path,
  exclusions_path,
  converted_source_image_files_path,
  converted_target_image_files_path,
  error_path,
};
