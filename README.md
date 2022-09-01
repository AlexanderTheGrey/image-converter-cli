# Image Converter CLI

A TypeScript command-line based image converter used to convert JPEG, PNG, GIF, TIFF, BMP, and SVG images to the web-optimized WebP format. It's primarily designed for use in pre-commit hooks.

## Install

```
npm install image-converter-cli
```

## Usage

### Command-line

```
image-converter-cli -i <image-glob> [OPTIONS]...
```

<span style="color:#2B65EC"></span>

### Module

<details>
  <summary><b><u><font size="+1">ECMAScript</font></u></b></summary>

```TypeScript
import { ImageConverter }

const argv = [
    "node",
    "image-converter",
    "-i",
    "<image-glob>",
    "OPTION 1",
    "OPTION 2",
    "OPTION 3..."
];

/*
If using staged files, populate .image-converter-temp/.staged_files

 If using exclusions file, populate .image-converter-temp/.converter_exclusions
 */

const imageConverterObj = new ImageConverter(argv);
await imageConverterObj.runProgram();
```

</details>

<br>

<details>
  <summary><b><u><font size="+1">CommonJS and ECMAScript using a dynamic import</font></u></b></summary>

```TypeScript
(async () => {
	const { imageConverter } = await import("ImageConverter");

    const argv = [
        "node",
        "image-converter",
        "-i",
        "<image-glob>",
        "OPTION 1",
        "OPTION 2",
        "OPTION 3..."
    ];

    /*
    If using staged files, populate .image-converter-temp/.staged_files

    If using exclusions file, populate .image-converter-temp/.converter_exclusions
    */

    const imageConverterObj = new ImageConverter(argv);
    await imageConverterObj.runProgram();
})();
```

</details>

<br>

## Use in a pre-commit hook

<details>
  <summary><b><u><font size="+1">Example of command-line use in a POSIX shell script (Apache-2.0 License)</font></u></b></summary>

```sh
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"
reject_commit=0
code_change=0
converterDir=./.image-converter-temp
bold=$(tput bold)
red=$(tput setaf 1)
redbg=$(tput setab 1)
green=$(tput setaf 2)
blue=$(tput setaf 4)
bluebg=$(tput setab 4)
yellow=$(tput setaf 3)
cyan=$(tput setaf 6)
normal=$(tput sgr0)
mkdir -p "$converterDir/"
git diff --name-status --staged --diff-filter=AMR | awk -F '\t' '$1 ~ /(A|M)/ {print $2}; $1 ~ /R100/ {print $3};' > "$converterDir/.staged_files"
sed -e '/^[[:blank:]]*#.*$/d' -e '/^[[:blank:]]*$/d' "./.converterignore" > "$converterDir/.converter_exclusions"
image-converter -i './{src,public}/**/*.(jpeg|jpg|jpe|jif|jfif|jfi|png|gif|tiff|tif|bmp|webp|heif|heifs|heic|heics|avci|avcs|avif|avifs)' -c './{src,public}/**/*.(js|vue|html)'
rm -f "$converterDir/.staged_files" "$converterDir/.converter_exclusions"
if [ -e "$converterDir/.conversion" ]; then
    printf "\n%s\n" "${blue}Searching for non-WebP image extensions in code files...${normal}"
    rm -f "$converterDir/.conversion"
    current_date=$(date +"%Y-%m-%d_%H:%M:%S")
    mkdir -p "./.image_backup/$current_date"
    while read -r imagePath; do
        git restore --staged "$imagePath"
        mv -- "$imagePath" "./.image_backup/$current_date"
    done < "$converterDir/.converted_source_image_files"
    if [ -e "$converterDir/.code_search_files" ]; then
        sed -i.bak -E 's/[^a-zA-Z 0-9]/\\&/g' "$converterDir/.converted_source_image_files"
        rm -f "$converterDir/.converted_source_image_files.bak"
        while read -r imagePath; do
            basename="${imagePath##*/}"
            filenameTemp="${basename%.*}"
            filename="${filenameTemp%\\}"
            ext="${basename##*.}"
            while read -r codePath; do
                sed -i.bak -E "s/($filename).$ext/\1\.webp/g w $converterDir/.changes" "./$codePath"
                if [ -s "$converterDir/.changes" ]; then
                    printf "%s\n\n" "${cyan}Updated $codePath${normal}"
                    if [ $code_change -eq 0 ]; then
                        mkdir -p "./.code_backup/$current_date"
                        code_change=1
                    fi
                    mv -- "./$codePath.bak" "./.code_backup/$current_date/${codePath##*/}"
                else
                    rm -f "./$codePath.bak"
                fi
            done < "$converterDir/.code_search_files"
        done < "$converterDir/.converted_source_image_files"
    fi
    rm -f "$converterDir/.converted_source_image_files" "$converterDir/.converted_target_image_files" "$converterDir/.code_search_files" "$converterDir/.changes"
    if [ $code_change -eq 1 ]; then
        if ! [ -e "$converterDir/.converter_errors" ]; then
            printf "%s\n" "${green}Successfully converted images and changed their references in code.${normal}"
        else
            printf "%s\n" "${green}Successfully converted some images and changed their references in code.${normal}"
        fi
        printf "\n%s\n%s\n\n" "${cyan}Original image files located at:" "$PWD/.image_backup/$current_date/${normal}"
        printf "\n%s\n%s\n\n" "${cyan}Original code files located at:" "$PWD/.code_backup/$current_date/${normal}"
        printf "%s\n" "${bold}${bluebg}Review the converted images/code changes and re-commit.${normal}"
        printf "%s\n" "${bold}${blue}Use \"git diff\" to examine changes.${normal}"
    else
        printf "%s\n" "${yellow}No code files need updating.${normal}"
        if ! [ -e "$converterDir/.converter_errors" ]; then
            printf "\n%s\n" "${green}Successfully converted images.${normal}"
        else
            printf "\n%s\n" "${green}Successfully converted some images.${normal}"
        fi
        printf "\n%s\n%s\n\n" "${cyan}Original image files located at:" "$PWD/.image_backup/$current_date/${normal}"
        printf "%s\n" "${bold}${bluebg}Review the converted images and re-commit.${normal}"
    fi
    reject_commit=1
fi
if [ -e "$converterDir/.converter_errors" ]; then
    printf "\n%s\n" "${bold}${red}Errors occured:${normal}"
     while read -r errorImagePath; do
        printf "%s\n" "${red}$errorImagePath${normal}"
        git restore --staged $errorImagePath
     done < "$converterDir/.converter_errors"
    printf "%s\n\n" "${bold}${redbg}Fix errors and re-commit.${normal}"
    rm -f "$converterDir/.converter_errors"
    reject_commit=1
fi
rm -rf "$converterDir/"
if [ $reject_commit -eq 1 ]; then
    exit 1
else
    npx pretty-quick --staged
    npm run lint
    # Do anything else that normally would occur in the pre-commit hook
fi
```

</details>

<br>

## Ignoring Files

The root directory can contain a <span style="color:#2B65EC">.converterignore</span>, which uses the same syntax as <span style="color:#2B65EC">.gitignore</span>. The contents of this must be copied to <span style="color:#2B65EC">.image-converter-temp/.converter_exclusions</span> (with comments removed, if applicable) for the image converter to know about it.

## Temporary Files

A temporary folder, <span style="color:#2B65EC">.image-converter-temp</span> is created in the project's root directory. There are seven temporary files located within this directory to be used in the pre-commit hook:

## <span style="color:#2B65EC">.conversion</span>

A file created when a successful conversion happens.

## <span style="color:#2B65EC">.code_search_files</span>

Created only if the `-c, --code-glob` option was used. Contains the code files that the code glob found. The pre-commit script can search for relevant extensions and replace them.

## <span style="color:#2B65EC">.staged_files</span>

This file needs to be populated by your pre-commit script (if not overriden). POSIX shell example for getting all added, modified, and renamed files and copying them to <span style="color:#2B65EC">.staged_files</span> file within the temporary directory:

```sh
git diff --name-status --staged --diff-filter=AMR | awk -F '\t' '$1 ~ /(A|M)/ {print $2}; $1 ~ /R100/ {print $3};' > "./.image-converter-temp/.staged_files"
```

## <span style="color:#2B65EC">.converter_exclusions</span>

The contents of <span style="color:#2B65EC">.converterignore</span> should be copied to the image-conveter-temp directory by your pre-commit hook as <span style="color:#2B65EC">.converter_exclusions</span> (unless `--override-excluded-files` is used). POSIX shell example that removes all comment lines which start with "#" in <span style="color:#2B65EC">.converterignore</span> and copies the output to <span style="color:#2B65EC">.converter_exclusions</span> file within the temporary directory:

```sh
sed -e '/^[[:blank:]]*#.*$/d' -e '/^[[:blank:]]*$/d' "./.converterignore" > "./.image-converter-temp/.converter_exclusions"
```

## <span style="color:#2B65EC">.converted_source_image_files</span>

Contains the source images of successfully converted files.

## <span style="color:#2B65EC">.converted_target_image_files</span>

Contains the successfully converted files.

## <span style="color:#2B65EC">.converter_errors</span>

Contains all images that experienced errors when converting.

## CLI Options

### `-v, --version`

Output the version number.

### `-i, --image-glob <value>`

Glob to search image files.

### `-c, --code-glob <value>`

Glob to search code files.

### `--process-svg-files`

Process SVG files.

### `--override-staged-files`

Don't exclude unstaged files.

### `--override-excluded-files`

Don't exclude files from exclusions list.

### `--create-fallback-image`

Create a PNG/GIF file if a JPEG, PNG, GIF, TIFF, or BMP file doesn't exist.

### `-h, --help`

Display help for command.

## Example Run

```sh
image-converter -i './{src,public}/**/*.(jpeg|jpg|jpe|jif|jfif|jfi|png|gif|tiff|tif|bmp|webp|heif|heifs|heic|heics|avci|avcs|avif|avifs)' -c './{src,public}/**/*.(js|vue|html)'
```

#### Note: Glob options must be single quoted to avoid interpretation by the shell
