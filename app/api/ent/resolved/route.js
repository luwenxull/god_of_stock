import fs from "fs";
import zlib from "zlib";

export async function GET() {
  return new Promise((rsv, rjc) => {
    fs.readdir(`${process.cwd()}/data/ent_v2`, "utf8", (err, data) => {
      if (err) {
        rjc(err);
      } else {
        zlib.gzip(JSON.stringify(data.map((file) => file.replace(".json", ""))), (err, result) => {
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
      }
    });
  });
}
