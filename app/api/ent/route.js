import fs from "fs";
import zlib from "zlib";

export async function GET(request) {
  return new Promise((rsv, rjc) => {
    const type = request.nextUrl.searchParams.get("type") || 'SHENWAN';
    fs.readFile(`${process.cwd()}/data/ents.${type.toLowerCase()}.json`, "utf8", (err, data) => {
      if (err) {
        reject(err);
      }
      zlib.gzip(data, (err, result) => {
        if (err) {
          rjc(err);
        } else {
          rsv(
            new Response(result, {
              headers: {
                "Content-Type": "application/json",
                "Content-Encoding": "gzip",
              },
            })
          );
        }
      });
    });
  });
}
