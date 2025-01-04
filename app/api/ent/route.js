import fs from 'fs';

export async function GET() {
  return Response.json(
    JSON.parse(fs.readFileSync(`${process.cwd()}/data/industry.v2.json`, 'utf8'))
  );
}