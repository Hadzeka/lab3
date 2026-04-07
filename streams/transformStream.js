import { Transform } from 'stream';

export function createTransformStream(taskFn) {
  let inputData = '';
  return new Transform({
    transform(chunk, encoding, callback) {
      inputData += chunk.toString();
      callback();
    },
    flush(callback) {
      try {
        const parsed = JSON.parse(inputData);
        const result = taskFn(parsed);
        // Всегда преобразуем результат в строку
        this.push(String(result));
        callback();
      } catch (err) {
        callback(err);
      }
    }
  });
}