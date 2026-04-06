#!/usr/bin/env node

import { program } from 'commander';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createInterface } from 'readline';
import { createTransformStream } from './streams/transformStream.js';
import { dashatize } from './tasks/dashatize.js';

program
  .option('-i, --input <path>', 'input file path')
  .option('-o, --output <path>', 'output file path')
  .requiredOption('-t, --task <task>', 'task name (must be "dashatize")')
  .parse(process.argv);

const options = program.opts();

if (options.task !== 'dashatize') {
  console.error(`Unknown task: ${options.task}. Only "dashatize" is implemented.`);
  process.exit(1);
}

const taskFn = dashatize;

// ---------- Режим с файлом ----------
if (options.input) {
  let inputStream, outputStream;
  try {
    inputStream = createReadStream(options.input);
    inputStream.on('error', (err) => {
      console.error(`Cannot read input file: ${err.message}`);
      process.exit(1);
    });
    outputStream = options.output
      ? createWriteStream(options.output)
      : process.stdout;
    outputStream.on('error', (err) => {
      console.error(`Cannot write to output: ${err.message}`);
      process.exit(1);
    });
  } catch (err) {
    console.error(`File error: ${err.message}`);
    process.exit(1);
  }

  const transformStream = createTransformStream(taskFn);
  try {
    await pipeline(inputStream, transformStream, outputStream);
  } catch (err) {
    console.error(`Operation failed: ${err.message}`);
    process.exit(1);
  }
  process.exit(0);
}

// ---------- Интерактивный режим (без -i) ----------
let outputStream;
if (options.output) {
  outputStream = createWriteStream(options.output, { flags: 'a' });
  outputStream.on('error', (err) => {
    console.error(`Cannot write to output file: ${err.message}`);
    process.exit(1);
  });
} else {
  outputStream = process.stdout;
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  prompt: '> '
});

console.log(`Task: dashatize. Enter an integer (e.g., 274) or a JSON number. Type "exit" to quit.`);
rl.prompt();

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (trimmed === '') {
    rl.prompt();
    return;
  }
  if (trimmed === 'exit') {
    rl.close();
    return;
  }

  try {
    let num;
    try {
      num = JSON.parse(trimmed);
    } catch {
      num = Number(trimmed);
    }
    const result = taskFn(num);
    outputStream.write(result + '\n');
  } catch (err) {
    console.error(`Invalid input: ${err.message}`);
  }
  rl.prompt();
});

rl.on('close', () => {
  outputStream.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nExiting...');
  rl.close();
});