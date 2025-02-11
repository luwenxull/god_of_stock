import fs from "fs";

export async function POST(request) {
  const records = await request.json();
  for (const [type, data] of Object.entries(records)) {
    for (const val of data) {
      let obj = {};
      try {
        obj = JSON.parse(fs.readFileSync(`${process.cwd()}/data/ent_v2/${val.SECURITY_CODE}.json`, "utf8"));
      } catch (e) {
        // console.error(e.message);
      }
      if (!obj[type]) {
        obj[type] = {}; // 写入到对应的报表字段
      }
      obj[type][val.REPORT_DATE.split(" ")[0]] = Object.entries(val).reduce((acc, [key, value]) => {
        if (value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {});
      fs.writeFileSync(`${process.cwd()}/data/ent_v2/${val.SECURITY_CODE}.json`, JSON.stringify(obj));
    }
  }
  return new Response("OK");
}
