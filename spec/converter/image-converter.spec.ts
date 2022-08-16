import os from "os";
import path from "path";
import fsp from "fs/promises";
import { globby } from "globby";
import { notEqual, strictEqual } from "assert";
import "jasmine";
import sharp from "sharp";
import {
  ImageConverter,
  conversion_boolean_path,
  code_search_files_path,
  staged_files_path,
  exclusions_path,
  converted_source_image_files_path,
  converted_target_image_files_path,
  error_path,
} from "../../lib/image-converter.js";

const MAX_SAFE_TIMEOUT = Math.pow(2, 31) - 1;

beforeEach(async () => {
  try {
    await fsp.writeFile(exclusions_path, "");
    await fsp.writeFile(staged_files_path, "");

    if (
      (await fsp.stat(conversion_boolean_path).catch(() => false)) !== false
    ) {
      await fsp.unlink(conversion_boolean_path);
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
    if ((await fsp.stat(code_search_files_path).catch(() => false)) !== false) {
      await fsp.unlink(code_search_files_path);
    }
    if ((await fsp.stat(error_path).catch(() => false)) !== false) {
      await fsp.unlink(error_path);
    }
  } catch (err) {
    console.error("\x1b[41m%s\x1b[0m", err);
    throw err;
  }
}, MAX_SAFE_TIMEOUT);

afterEach(async () => {
  if (
    (await fsp.stat(converted_target_image_files_path).catch(() => false)) !==
    false
  ) {
    const convertedTargetImages = (
      await fsp.readFile(converted_target_image_files_path, "utf-8")
    )
      .trim()
      .split(/[\r\n]/);

    for (const filepath of convertedTargetImages) {
      await fsp.unlink(filepath);
    }
  }
}, MAX_SAFE_TIMEOUT);

afterAll(async () => {
  try {
    if ((await fsp.stat(exclusions_path).catch(() => false)) !== false) {
      await fsp.unlink(exclusions_path);
    }
    if ((await fsp.stat(staged_files_path).catch(() => false)) !== false) {
      await fsp.unlink(staged_files_path);
    }
    if (
      (await fsp.stat(conversion_boolean_path).catch(() => false)) !== false
    ) {
      await fsp.unlink(conversion_boolean_path);
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
    if ((await fsp.stat(code_search_files_path).catch(() => false)) !== false) {
      await fsp.unlink(code_search_files_path);
    }
    if ((await fsp.stat(error_path).catch(() => false)) !== false) {
      await fsp.unlink(error_path);
    }
  } catch (err) {
    console.error("\x1b[41m%s\x1b[0m", err);
    throw err;
  }
}, MAX_SAFE_TIMEOUT);

describe("Command line options", () => {
  const imageGlob =
    "./spec/converter/images/dummy/**/*.(jpeg|jpg|jpe|jif|jfif|jfi|png|gif|tiff|tif|bmp|webp|heif|heifs|heic|heics|avci|avcs|avif|avifs)";

  it("should correctly set --image-glob to input string", () => {
    const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

    const imageConverter = new ImageConverter(argv);

    strictEqual(imageConverter.options.imageGlob, imageGlob);
  });

  it("should correctly set --code-glob to input string", () => {
    const codeGlob = "./spec/converter/images/dummy/**/*.(js|vue|html)";

    const argv = [
      "node",
      "./lib/image-converter.js",
      "-i",
      imageGlob,
      "-c",
      codeGlob,
    ];

    const imageConverter = new ImageConverter(argv);

    strictEqual(imageConverter.options.codeGlob, codeGlob);
  });

  it("should correctly set --process-svg-files to default false", () => {
    const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

    const imageConverter = new ImageConverter(argv);

    strictEqual(imageConverter.options.processSvgFiles, false);
  });

  it("should correctly set --override-staged-files to default false", () => {
    const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

    const imageConverter = new ImageConverter(argv);

    strictEqual(imageConverter.options.overrideStagedFiles, false);
  });

  it("should correctly set --override-excluded-files to default false", () => {
    const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

    const imageConverter = new ImageConverter(argv);

    strictEqual(imageConverter.options.overrideExcludedFiles, false);
  });

  it("should correctly set --code-glob to default undefined", () => {
    const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

    const imageConverter = new ImageConverter(argv);

    strictEqual(imageConverter.options.codeGlob, undefined);
  });

  it("should correctly set --process-svg-files to true", () => {
    const argv = [
      "node",
      "./lib/image-converter.js",
      "-i",
      imageGlob,
      "--process-svg-files",
    ];

    const imageConverter = new ImageConverter(argv);

    strictEqual(imageConverter.options.processSvgFiles, true);
  });

  it("should correctly set --override-staged-files to true when provided as an option", () => {
    const argv = [
      "node",
      "./lib/image-converter.js",
      "-i",
      imageGlob,
      "--override-staged-files",
    ];

    const imageConverter = new ImageConverter(argv);

    strictEqual(imageConverter.options.overrideStagedFiles, true);
  });

  it("should correctly set --override-excluded-files to true when provided as an option", () => {
    const argv = [
      "node",
      "./lib/image-converter.js",
      "-i",
      imageGlob,
      "--override-excluded-files",
    ];

    const imageConverter = new ImageConverter(argv);

    strictEqual(imageConverter.options.overrideExcludedFiles, true);
  });
});

describe("Expected input files", () => {
  const imageGlob =
    "./spec/converter/images/dummy/**/*.(jpeg|jpg|jpe|jif|jfif|jfi|png|gif|tiff|tif|bmp|webp|heif|heifs|heic|heics|avci|avcs|avif|avifs)";

  it(
    "should error when no converter exclusions file exists",
    async () => {
      let errorMessage = "";

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      try {
        await fsp.unlink(exclusions_path);
      } catch (err) {
        console.error("\x1b[41m%s\x1b[0m", err);
        throw err;
      }

      const imageConverter = new ImageConverter(argv);

      try {
        await Promise.resolve(imageConverter.runProgram());
      } catch (err) {
        if (err instanceof Error) {
          errorMessage = err.message;
        }
      }

      strictEqual(
        errorMessage,
        `ENOENT: no such file or directory, open '${exclusions_path}'`
      );
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should error when no staged files file exists",
    async () => {
      let errorMessage = "";

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      try {
        await fsp.unlink(staged_files_path);
      } catch (err) {
        console.error("\x1b[41m%s\x1b[0m", err);
        throw err;
      }

      const imageConverter = new ImageConverter(argv);

      try {
        await Promise.resolve(imageConverter.runProgram());
      } catch (err) {
        if (err instanceof Error) {
          errorMessage = err.message;
        }
      }

      strictEqual(
        errorMessage,
        `ENOENT: no such file or directory, open '${staged_files_path}'`
      );
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should handle error when the image is an unsupported format",
    async () => {
      const imageGlobError = "./spec/converter/images/{PNG,error-images}/*.png";
      const imageGlobSuccess = "./spec/converter/images/PNG/*.png";

      const someNonImages = await globby(path.normalize(imageGlobError));
      const convertedImages = await globby(path.normalize(imageGlobSuccess));

      await fsp.writeFile(
        staged_files_path,
        someNonImages.join(os.EOL) + os.EOL
      );

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlobError];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(
        convertedTargetImages.length,
        someNonImages.length - convertedImages.length
      );
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should handle error when the image has a mismatched format compared to its extension",
    async () => {
      const imageGlobError =
        "./spec/converter/images/{JPEG,error-images}/*.jpg";
      const imageGlobSuccess = "./spec/converter/images/JPEG/*.jpg";

      const someNonImages = await globby(path.normalize(imageGlobError));
      const convertedImages = await globby(path.normalize(imageGlobSuccess));

      await fsp.writeFile(
        staged_files_path,
        someNonImages.join(os.EOL) + os.EOL
      );

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlobError];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(
        convertedTargetImages.length,
        someNonImages.length - convertedImages.length
      );
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should not error when overriding excluded files and no converter exclusions file exists",
    async () => {
      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--override-excluded-files",
      ];

      try {
        await fsp.unlink(exclusions_path);
      } catch (err) {
        console.error("\x1b[41m%s\x1b[0m", err);
        throw err;
      }

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should not error when overriding staged files and no staged files file exists",
    async () => {
      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--override-staged-files",
      ];

      try {
        await fsp.unlink(staged_files_path);
      } catch (err) {
        console.error("\x1b[41m%s\x1b[0m", err);
        throw err;
      }

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should not error when overriding excluded files and staged files, and no excluded/staged files file exists",
    async () => {
      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--override-excluded-files",
        "--override-staged-files",
      ];

      try {
        await fsp.unlink(exclusions_path);
        await fsp.unlink(staged_files_path);
      } catch (err) {
        console.error("\x1b[41m%s\x1b[0m", err);
        throw err;
      }

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting images", () => {
  it(
    "should convert JPEG images to WebP",
    async () => {
      const imageGlob =
        "./spec/converter/images/JPEG/*.(jpeg|jpg|jpe|jif|jfif|jfi)";

      const jpegImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, jpegImages.join(os.EOL) + os.EOL);

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, jpegImages.length);

      for (const filepath of convertedTargetImages) {
        const metadata = await sharp(filepath).metadata();
        strictEqual(metadata.format, "webp");
      }
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should convert PNG images to WebP",
    async () => {
      const imageGlob = "./spec/converter/images/PNG/*.png";

      const pngImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, pngImages.join(os.EOL) + os.EOL);

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, pngImages.length);

      for (const filepath of convertedTargetImages) {
        const metadata = await sharp(filepath).metadata();
        strictEqual(metadata.format, "webp");
      }
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should convert GIF images to animated WebP",
    async () => {
      const imageGlob = "./spec/converter/images/GIF/*.gif";

      const gifImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, gifImages.join(os.EOL) + os.EOL);

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, gifImages.length);

      for (const filepath of convertedTargetImages) {
        const metadata = await sharp(filepath).metadata();
        strictEqual(metadata.format, "webp");
        notEqual(metadata.pages, null);
      }
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should convert BMP images to WebP",
    async () => {
      const imageGlob = "./spec/converter/images/BMP/*.bmp";

      const bmpImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, bmpImages.join(os.EOL) + os.EOL);

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, bmpImages.length);

      for (const filepath of convertedTargetImages) {
        const metadata = await sharp(filepath).metadata();
        strictEqual(metadata.format, "webp");
      }
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should convert TIFF images to WebP",
    async () => {
      const imageGlob = "./spec/converter/images/TIFF/*.(tiff|tif)";

      const tiffImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, tiffImages.join(os.EOL) + os.EOL);

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, tiffImages.length);

      for (const filepath of convertedTargetImages) {
        const metadata = await sharp(filepath).metadata();
        strictEqual(metadata.format, "webp");
      }
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should convert SVG images to WebP",
    async () => {
      const imageGlob = "./spec/converter/images/SVG/*.svg";

      const svgImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, svgImages.join(os.EOL) + os.EOL);

      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--process-svg-files",
      ];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, svgImages.length);

      for (const filepath of convertedTargetImages) {
        const metadata = await sharp(filepath).metadata();
        strictEqual(metadata.format, "webp");
      }
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should convert WebP images to PNG if the --create-fallback-image flag is set",
    async () => {
      const imageGlob = "./spec/converter/images/WebP/example-webp.webp";

      const webpImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, webpImages.join(os.EOL) + os.EOL);

      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--create-fallback-image",
      ];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, webpImages.length);

      for (const filepath of convertedTargetImages) {
        const metadata = await sharp(filepath).metadata();
        strictEqual(metadata.format, "png");
      }
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should not convert WebP images to PNG if the --create-fallback-image flag is not set",
    async () => {
      const imageGlob = "./spec/converter/images/WebP/example-webp.webp";

      const webpImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, webpImages.join(os.EOL) + os.EOL);

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      strictEqual(
        (await fsp.stat(conversion_boolean_path).catch(() => false)) === false,
        true
      );
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should convert animated WebP images to GIF if the --create-fallback-image flag is set",
    async () => {
      const imageGlob =
        "./spec/converter/images/WebP/example-animated-webp.webp";

      const animatedWebpImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(
        staged_files_path,
        animatedWebpImages.join(os.EOL) + os.EOL
      );

      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--create-fallback-image",
      ];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, animatedWebpImages.length);

      for (const filepath of convertedTargetImages) {
        const metadata = await sharp(filepath).metadata();
        strictEqual(metadata.format, "gif");
        notEqual(metadata.pages, null);
      }
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should not convert animated WebP images to GIF if the --create-fallback-image flag is not set",
    async () => {
      const imageGlob =
        "./spec/converter/images/WebP/example-animated-webp.webp";

      const animatedWebpImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(
        staged_files_path,
        animatedWebpImages.join(os.EOL) + os.EOL
      );

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      strictEqual(
        (await fsp.stat(conversion_boolean_path).catch(() => false)) === false,
        true
      );
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should convert high efficiency images to PNG if the --create-fallback-image flag is set",
    async () => {
      const imageGlob =
        "./spec/converter/images/HEIF/*.(heif|heifs|heic|heics|avci|avcs|avif|avifs)";

      const heImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, heImages.join(os.EOL) + os.EOL);

      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--create-fallback-image",
      ];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, heImages.length);

      for (const filepath of convertedTargetImages) {
        const metadata = await sharp(filepath).metadata();
        strictEqual(metadata.format, "png");
      }
    },
    MAX_SAFE_TIMEOUT
  );

  it(
    "should not convert high efficiency images to PNG if the --create-fallback-image flag is not set",
    async () => {
      const imageGlob =
        "./spec/converter/images/HEIF/*.(heif|heifs|heic|heics|avci|avcs|avif|avifs)";

      const heImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, heImages.join(os.EOL) + os.EOL);

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      strictEqual(
        (await fsp.stat(conversion_boolean_path).catch(() => false)) === false,
        true
      );
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting images with JPEG, PNG, GIF, BMP, TIFF, or SVG and WebP file existing", () => {
  it(
    "should not convert any JPEG, PNG, BMP, GIF, TIFF, or SVG images to WebP",
    async () => {
      const imageGlob =
        "./spec/converter/images/all-images/*.(jpeg|png|gif|bmp|tiff|svg|webp)";

      const allImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, allImages.join(os.EOL) + os.EOL);

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      strictEqual(
        (await fsp.stat(conversion_boolean_path).catch(() => false)) === false,
        true
      );
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting images with JPEG, PNG, GIF, BMP, TIFF, or SVG and HEIF file existing", () => {
  it(
    "should not convert any JPEG, PNG, GIF, BMP, TIFF, or SVG images to WebP",
    async () => {
      const imageGlob =
        "./spec/converter/images/all-images/*.(jpeg|png|gif|bmp|tiff|svg|heif|heifs|heic|heics|avci|avcs|avif|avifs)";

      const allImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, allImages.join(os.EOL) + os.EOL);

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      strictEqual(
        (await fsp.stat(conversion_boolean_path).catch(() => false)) === false,
        true
      );
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting images with JPEG, PNG, GIF, BMP, TIFF, or SVG and WebP and HEIF file existing", () => {
  it(
    "should not convert any JPEG, PNG, GIF, BMP, TIFF, or SVG to WebP or HEIF",
    async () => {
      const imageGlob =
        "./spec/converter/images/all-images/*.(jpeg|png|gif|bmp|tiff|svg|webp|heif|heifs|heic|heics|avci|avcs|avif|avifs)";

      const allImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, allImages.join(os.EOL) + os.EOL);

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      strictEqual(
        (await fsp.stat(conversion_boolean_path).catch(() => false)) === false,
        true
      );
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting SVG images to WebP", () => {
  it(
    "should not convert if the --process-svg-files flag is not set and the WebP image doesn't already exist",
    async () => {
      const imageGlob = "./spec/converter/images/SVG/*.svg";

      const allImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, allImages.join(os.EOL) + os.EOL);

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      strictEqual(
        (await fsp.stat(conversion_boolean_path).catch(() => false)) === false,
        true
      );
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting SVG images to WebP", () => {
  it(
    "should not convert if the --process-svg-files flag is set and the WebP image already exist",
    async () => {
      const imageGlob = "./spec/converter/images/all-images/*.(svg|webp)";

      const allImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(staged_files_path, allImages.join(os.EOL) + os.EOL);

      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--process-svg-files",
      ];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      strictEqual(
        (await fsp.stat(conversion_boolean_path).catch(() => false)) === false,
        true
      );
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting images with excluded files, staged files override, and non-existing stages files file", () => {
  it(
    "should not convert excluded files and not require a staged file",
    async () => {
      await fsp.unlink(staged_files_path);

      const imageGlob = "./spec/converter/images/{JPEG,PNG,BMP}/*";
      const excludeImageGlob =
        "./spec/converter/images/JPEG/*.(jpeg|jpe|jif|jfif|jfi)";

      const excludedImages = await globby(path.normalize(excludeImageGlob));
      const stagedImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(
        exclusions_path,
        excludedImages.join(os.EOL) + os.EOL
      );

      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--override-staged-files",
      ];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedSourceImages = (
        await fsp.readFile(converted_source_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);
      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(
        convertedTargetImages.length,
        stagedImages.length - excludedImages.length
      );
      expect(convertedSourceImages).not.toEqual(
        jasmine.arrayContaining(excludedImages)
      );

      for (const filepath of convertedTargetImages) {
        const metadata = await sharp(filepath).metadata();
        strictEqual(metadata.format, "webp");
      }
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting images with excluded files, staged files override, and existing stages files file", () => {
  it(
    "should not convert excluded files and not use provided staged file",
    async () => {
      const imageGlob = "./spec/converter/images/{JPEG,PNG,BMP}/*";
      const excludeImageGlob =
        "./spec/converter/images/JPEG/*.(jpeg|jpe|jif|jfif|jfi)";

      const excludedImages = await globby(path.normalize(excludeImageGlob));
      const stagedImages = await globby(path.normalize(imageGlob));

      await fsp.writeFile(
        exclusions_path,
        excludedImages.join(os.EOL) + os.EOL
      );
      await fsp.writeFile(staged_files_path, "test/path/example.ext" + os.EOL);

      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--override-staged-files",
      ];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedSourceImages = (
        await fsp.readFile(converted_source_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);
      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(
        convertedTargetImages.length,
        stagedImages.length - excludedImages.length
      );
      expect(convertedSourceImages).not.toEqual(
        jasmine.arrayContaining(excludedImages)
      );

      for (const filepath of convertedTargetImages) {
        const metadata = await sharp(filepath).metadata();
        strictEqual(metadata.format, "webp");
      }
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting images with staged files with empty excluded files file, set --create-fallback-image", () => {
  it(
    "should only convert images listed in staged files and not need the excluded files file to contain anything",
    async () => {
      const imageGlob = "./spec/converter/images/**/*";
      const stagedImageGlob = "./spec/converter/images/{PNG,BMP,WebP}/*";

      const stagedImages = await globby(path.normalize(stagedImageGlob));

      await fsp.writeFile(
        staged_files_path,
        stagedImages.join(os.EOL) + os.EOL
      );

      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--create-fallback-image",
      ];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedSourceImages = (
        await fsp.readFile(converted_source_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);
      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, stagedImages.length);
      expect(convertedSourceImages).toEqual(
        jasmine.arrayWithExactContents(stagedImages)
      );

      for (const filepath of convertedTargetImages) {
        const filepathExt = path.extname(filepath).slice(1);
        const metadata = await sharp(filepath).metadata();
        if (filepathExt === "png") {
          strictEqual(metadata.format, "png");
        } else if (filepathExt === "webp") {
          strictEqual(metadata.format, "webp");
        }
      }
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting images with staged files with excluded files override and non-existing excluded files file, set --create-fallback-image", () => {
  it(
    "should only convert images listed in staged files and not require the excluded files file",
    async () => {
      await fsp.unlink(exclusions_path);

      const imageGlob = "./spec/converter/images/**/*";
      const stagedImageGlob = "./spec/converter/images/{PNG,BMP,WebP}/*";

      const stagedImages = await globby(path.normalize(stagedImageGlob));

      await fsp.writeFile(
        staged_files_path,
        stagedImages.join(os.EOL) + os.EOL
      );

      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--override-excluded-files",
        "--create-fallback-image",
      ];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedSourceImages = (
        await fsp.readFile(converted_source_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);
      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, stagedImages.length);
      expect(convertedSourceImages).toEqual(
        jasmine.arrayWithExactContents(stagedImages)
      );

      for (const filepath of convertedTargetImages) {
        const filepathExt = path.extname(filepath).slice(1);
        const metadata = await sharp(filepath).metadata();
        if (filepathExt === "png") {
          strictEqual(metadata.format, "png");
        } else if (filepathExt === "webp") {
          strictEqual(metadata.format, "webp");
        }
      }
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting images with empty staged files file and empty excluded files file", () => {
  it(
    "should not convert anything",
    async () => {
      const imageGlob = "./spec/converter/images/**/*";

      const argv = ["node", "./lib/image-converter.js", "-i", imageGlob];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      strictEqual(
        (await fsp.stat(conversion_boolean_path).catch(() => false)) === false,
        true
      );
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting images with staged files with excluded files override and populated excluded files file, set --create-fallback-image", () => {
  it(
    "should only convert images listed in staged files and ignore exclusions",
    async () => {
      const imageGlob = "./spec/converter/images/**/*";
      const excludeImageGlob = "./spec/converter/images/{PNG,BMP}/*.(png|bmp)";
      const stagedImageGlob = "./spec/converter/images/{PNG,BMP,WebP}/*";

      const excludedImages = await globby(path.normalize(excludeImageGlob));
      const stagedImages = await globby(path.normalize(stagedImageGlob));

      await fsp.writeFile(
        exclusions_path,
        excludedImages.join(os.EOL) + os.EOL
      );
      await fsp.writeFile(
        staged_files_path,
        stagedImages.join(os.EOL) + os.EOL
      );

      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--override-excluded-files",
        "--create-fallback-image",
      ];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedSourceImages = (
        await fsp.readFile(converted_source_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);
      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, stagedImages.length);
      expect(convertedSourceImages).toEqual(
        jasmine.arrayWithExactContents(stagedImages)
      );

      for (const filepath of convertedTargetImages) {
        const filepathExt = path.extname(filepath).slice(1);
        const metadata = await sharp(filepath).metadata();
        if (filepathExt === "png") {
          strictEqual(metadata.format, "png");
        } else if (filepathExt === "webp") {
          strictEqual(metadata.format, "webp");
        }
      }
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting images with staged files override and populated staged files, excluded files override and populated excluded files file, set --create-fallback-image", () => {
  it(
    "should convert all images in image glob and ignore staged files and exclusions",
    async () => {
      const imageGlob = "./spec/converter/images/{PNG,BMP,WebP}/*";
      const excludeImageGlob = "./spec/converter/images/{PNG,BMP}/*.(png|bmp)";
      const expectedConvertedImagesGlob = imageGlob;

      const excludedImages = await globby(path.normalize(excludeImageGlob));
      const expectedConvertedImages = await globby(
        path.normalize(expectedConvertedImagesGlob)
      );

      await fsp.writeFile(
        exclusions_path,
        excludedImages.join(os.EOL) + os.EOL
      );
      await fsp.writeFile(staged_files_path, "test/path/example.ext" + os.EOL);

      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--override-excluded-files",
        "--override-staged-files",
        "--create-fallback-image",
      ];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedSourceImages = (
        await fsp.readFile(converted_source_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);
      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, expectedConvertedImages.length);
      expect(convertedSourceImages).toEqual(
        jasmine.arrayWithExactContents(expectedConvertedImages)
      );

      for (const filepath of convertedTargetImages) {
        const filepathExt = path.extname(filepath).slice(1);
        const metadata = await sharp(filepath).metadata();
        if (filepathExt === "png") {
          strictEqual(metadata.format, "png");
        } else if (filepathExt === "webp") {
          strictEqual(metadata.format, "webp");
        }
      }
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting images with staged files override and non-existing staged files, excluded files override and populated excluded files file, set --create-fallback-image", () => {
  it(
    "should convert all images in image glob, not require staged files, and ignore exclusions",
    async () => {
      await fsp.unlink(staged_files_path);

      const imageGlob = "./spec/converter/images/{PNG,BMP,WebP}/*";
      const excludeImageGlob = "./spec/converter/images/{PNG,BMP}/*.(png|bmp)";
      const expectedConvertedImagesGlob = imageGlob;

      const excludedImages = await globby(path.normalize(excludeImageGlob));
      const expectedConvertedImages = await globby(
        path.normalize(expectedConvertedImagesGlob)
      );

      await fsp.writeFile(
        exclusions_path,
        excludedImages.join(os.EOL) + os.EOL
      );

      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--override-excluded-files",
        "--override-staged-files",
        "--create-fallback-image",
      ];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedSourceImages = (
        await fsp.readFile(converted_source_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);
      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(convertedTargetImages.length, expectedConvertedImages.length);
      expect(convertedSourceImages).toEqual(
        jasmine.arrayWithExactContents(expectedConvertedImages)
      );

      for (const filepath of convertedTargetImages) {
        const filepathExt = path.extname(filepath).slice(1);
        const metadata = await sharp(filepath).metadata();
        if (filepathExt === "png") {
          strictEqual(metadata.format, "png");
        } else if (filepathExt === "webp") {
          strictEqual(metadata.format, "webp");
        }
      }
    },
    MAX_SAFE_TIMEOUT
  );
});

describe("Converting images with staged files and excluded files, set --create-fallback-image", () => {
  it(
    "should only convert images listed in staged files and should not convert excluded images",
    async () => {
      const imageGlob = "./spec/converter/images/**/*";
      const excludeImageGlob =
        "./spec/converter/images/WebP/example-animated-webp.webp";
      const stagedImageGlob = "./spec/converter/images/{PNG,BMP,WebP}/*";

      const excludedImages = await globby(path.normalize(excludeImageGlob));
      const stagedImages = await globby(path.normalize(stagedImageGlob));

      await fsp.writeFile(
        exclusions_path,
        excludedImages.join(os.EOL) + os.EOL
      );
      await fsp.writeFile(
        staged_files_path,
        stagedImages.join(os.EOL) + os.EOL
      );

      const argv = [
        "node",
        "./lib/image-converter.js",
        "-i",
        imageGlob,
        "--create-fallback-image",
      ];

      const imageConverter = new ImageConverter(argv);
      await imageConverter.runProgram();

      const convertedSourceImages = (
        await fsp.readFile(converted_source_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);
      const convertedTargetImages = (
        await fsp.readFile(converted_target_image_files_path, "utf-8")
      )
        .trim()
        .split(/[\r\n]/);

      strictEqual(
        convertedTargetImages.length,
        stagedImages.length - excludedImages.length
      );
      expect(convertedSourceImages).toEqual(
        jasmine.arrayWithExactContents(
          stagedImages.filter((stagedFile) => {
            return !excludedImages.includes(stagedFile);
          })
        )
      );
      expect(convertedSourceImages).not.toEqual(
        jasmine.arrayContaining(excludedImages)
      );

      for (const filepath of convertedTargetImages) {
        const filepathExt = path.extname(filepath).slice(1);
        const metadata = await sharp(filepath).metadata();
        if (filepathExt === "png") {
          strictEqual(metadata.format, "png");
        } else if (filepathExt === "webp") {
          strictEqual(metadata.format, "webp");
        }
      }
    },
    MAX_SAFE_TIMEOUT
  );
});
