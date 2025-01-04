const fs = require('fs');
const path = require('path');

function scan_directory(directoryPath, callback) {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error(`无法读取目录: ${err.message}`);
      throw err;
    }
    files.forEach((file, i) => {
      const file_path = path.join(directoryPath, file);
      const stats = fs.statSync(file_path);
      if (!stats.isDirectory()) {
        callback(file_path);
      }
    });
  });
}

function start(type) {
  scan_directory(type, file_path => {
    if (!file_path.endsWith('.json')) return;
    console.group(`正在处理: ${file_path}`);
    for (const val of JSON.parse(fs.readFileSync(file_path, 'utf8'))) {
      if (val === null) continue;
      let obj = {};
      try {
        obj = JSON.parse(fs.readFileSync(`ent/${val.SECCODE}.json`, 'utf8'));
      } catch (e) {
        console.error(e.message);
      }
      if (!obj[type]) {
        obj[type] = {}; // 写入到对应的报表字段
      }
      if (val.ENDDATE !== val.F001D) {
        console.error(`报告年度与截止日期不一致: ${val.ENDDATE} ${val.F001D}`);
      }
      obj[type][val.ENDDATE] = val;
      fs.writeFileSync(`ent/${val.SECCODE}.json`, JSON.stringify(obj));
    }
    console.groupEnd();
  });
}

// start('balance');
start('profit')
