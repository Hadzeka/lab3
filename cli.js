#!/usr/bin/env node

import { program } from 'commander';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createInterface } from 'readline';
import { createTransformStream } from './streams/transformStream.js';
import { dashatize } from './tasks/dashatize.js';
import { countInversions } from './tasks/inversions.js';

program
  .option('-i, --input <path>', 'input file path')
  .option('-o, --output <path>', 'output file path')
  .requiredOption('-t, --task <task>', 'task name (dashatize or inversions)')
  .parse(process.argv);

const options = program.opts();

// Выбор функции задачи
function getTaskFunction(taskName) {
  switch (taskName) {
    case 'dashatize':
      return dashatize;
    case 'inversions':
      return countInversions;
    default:
      return null;
  }
}

const taskFn = getTaskFunction(options.task);
if (!taskFn) {
  console.error(`Unknown task: ${options.task}. Available: dashatize, inversions`);
  process.exit(1);
}

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

// Приветственное сообщение в зависимости от задачи
if (options.task === 'dashatize') {
  console.log(`Task: dashatize. Enter an integer (e.g., 274) or a JSON number. Type "exit" to quit.`);
} else {
  console.log(`Task: inversions. Enter an array as JSON (e.g., [4,1,2,3]). Type "exit" to quit.`);
}
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
    let parsedInput;
    try {
      parsedInput = JSON.parse(trimmed);
    } catch {
      // Если не JSON, для dashatize пробуем как число
      if (options.task === 'dashatize') {
        parsedInput = Number(trimmed);
      } else {
        throw new Error('Input must be a valid JSON array for inversions task');
      }
    }
    const result = taskFn(parsedInput);
    outputStream.write(String(result) + '\n');
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