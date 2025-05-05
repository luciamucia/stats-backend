// Usage: node hourly_to_15min.js input.csv output.csv
const fs = require('fs');
const path = require('path');

if (process.argv.length < 4) {
  console.error('Usage: node hourly_to_15min.js input.csv output.csv');
  process.exit(1);
}

const inputPath = process.argv[2];
const outputPath = process.argv[3];

const parseLine = line => {
  const [hour, production, consumption] = line.split(',');
  return { hour, production: parseFloat(production), consumption: parseFloat(consumption) };
};

const formatDate = (date) => {
  // YYYY-MM-DD HH:mm
  return date.toISOString().replace('T', ' ').slice(0, 16);
};

const lines = fs.readFileSync(inputPath, 'utf8').split(/\r?\n/).filter(Boolean);
const header = lines[0];
const data = lines.slice(1).map(parseLine);

const result = [header];
for (let i = 0; i < data.length - 1; i++) {
  const curr = data[i];
  const next = data[i + 1];
  const currDate = new Date(curr.hour.replace(' ', 'T'));
  result.push(`${curr.hour},${curr.production},${curr.consumption}`);
  for (let q = 1; q < 4; q++) {
    const d = new Date(currDate.getTime() + q * 15 * 60 * 1000);
    const prod = curr.production + (next.production - curr.production) * (q / 4);
    const cons = curr.consumption + (next.consumption - curr.consumption) * (q / 4);
    result.push(`${formatDate(d)},${+prod.toFixed(4)},${+cons.toFixed(4)}`);
  }
}
// Add last hour
const last = data[data.length - 1];
result.push(`${last.hour},${last.production},${last.consumption}`);

fs.writeFileSync(outputPath, result.join('\n'));
console.log('Done! Output:', outputPath);
