#!/usr/bin/env node
import { ImageConverter } from "../lib/image-converter.js";
const imageConverter = new ImageConverter(process.argv);
await imageConverter.runProgram();
