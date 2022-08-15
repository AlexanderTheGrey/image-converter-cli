import { Command } from "commander";
declare const conversion_boolean_path: string;
declare const code_search_files_path: string;
declare const staged_files_path: string;
declare const exclusions_path: string;
declare const converted_source_image_files_path: string;
declare const converted_target_image_files_path: string;
declare const error_path: string;
interface Options {
    imageGlob: string;
    codeGlob: string | undefined;
    processSvgFiles: boolean;
    overrideStagedFiles: boolean;
    overrideExcludedFiles: boolean;
    createFallbackImage: boolean;
}
declare class ImageConverter {
    options: Options;
    conversion_error: boolean;
    constructor(argv: string[]);
    getOptions(argv: string[]): Command;
    runProgram(): Promise<void>;
    processFiles(files: string[]): Promise<void>;
    processImage(inputFile: string, files: string[]): Promise<boolean>;
}
export { ImageConverter, conversion_boolean_path, code_search_files_path, staged_files_path, exclusions_path, converted_source_image_files_path, converted_target_image_files_path, error_path, };
