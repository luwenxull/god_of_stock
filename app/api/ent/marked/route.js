import fs from "fs";
import zlib from "zlib";

export async function GET(request) {
  return new Promise((rsv, rjc) => {
    fs.readFile(`${process.cwd()}/data/marked.json`, "utf8", (err, data) => {
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

// 可能会有同时写入的情况，这里没有做并发控制
export async function POST(request) {
  const code = request.nextUrl.searchParams.get("code");
  return new Promise((rsv, rjc) => {
    fs.readFile(`${process.cwd()}/data/marked.json`, "utf8", (err, data) => {
      if (err) {
        reject(err);
      }
      const marked = JSON.parse(data);
      marked[code] = 1;
      fs.writeFile(`${process.cwd()}/data/marked.json`, JSON.stringify(marked), "utf8", (err) => {
        if (err) {
          rjc(err);
        } else {
          rsv(Response.json(marked));
        }
      });
    });
  });
}

export async function DELETE(request) {
  const code = request.nextUrl.searchParams.get("code");
  return new Promise((rsv, rjc) => {
    fs.readFile(`${process.cwd()}/data/marked.json`, "utf8", (err, data) => {
      if (err) {
        reject(err);
      }
      const marked = JSON.parse(data);
      delete marked[code];
      fs.writeFile(`${process.cwd()}/data/marked.json`, JSON.stringify(marked), "utf8", (err) => {
        if (err) {
          rjc(err);
        } else {
          rsv(Response.json(marked));
        }
      });
    });
  });
}
