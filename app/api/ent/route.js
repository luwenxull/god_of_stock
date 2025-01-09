import fs from "fs";

export async function GET() {
  return new Promise((resolve, reject) => {
    fs.readFile(`${process.cwd()}/data/ents.shenwan.json`, "utf8", (err, data) => {
      if (err) {
        reject(err);
      }
      resolve(Response.json(JSON.parse(data).filter((e) => !/^(20|900)/.test(e.SECCODE))));
    });
  });
}
