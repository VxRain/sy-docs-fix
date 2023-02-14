/**
 * @file 检测思源笔记哪些文档的ID和文件名不同，自动重命名修复
 */

import * as fs from "fs";
import * as path from "path";
import parseArgs from "minimist";

const argv = parseArgs(process.argv.slice(2)) as { t: string };
const targetPath = argv.t;

/**
 * 获取所有的sy文件路径
 * @param filePath 目标路径
 */
function getAllSyFiles(filePath: string) {
  const allSyFiles = [] as string[];
  fs.readdirSync(filePath).forEach((fileName) => {
    // 获取绝对路径
    const fullPath = path.join(filePath, fileName);
    const stats = fs.statSync(fullPath);
    if (stats.isFile() && fileName.endsWith(".sy")) {
      allSyFiles.push(fullPath);
    } else if (stats.isDirectory()) {
      // 递归
      allSyFiles.push(...getAllSyFiles(fullPath));
    }
  });
  return allSyFiles;
}

/**
 * 检查文件名和文档ID是否相同
 * @param fullPath 文件所处路径
 */
function checkDoc(fullPath: string) {
  const file = fs.readFileSync(fullPath);
  // 去掉后缀的文件名
  const fileName = path.basename(fullPath, ".sy");
  const json = JSON.parse(file.toString());
  if (json.ID !== fileName) {
    return { isPass: false, json };
  }

  return { isPass: true, json };
}

(async () => {
  if (!targetPath) throw new Error("请使用 -t 指定思源笔记的数据目录（SiYuan/data）");

  const files = getAllSyFiles(targetPath);
  let fixCount = 0;
  for (let f of files) {
    const { isPass, json } = checkDoc(f);
    if (!isPass) {
      const oldName = path.basename(f);
      const newName = json.ID + ".sy";
      console.log(`需修正，原文件名${oldName}，应为${newName}`);
      fs.renameSync(f, f.replace(oldName, newName));
      fixCount++;
    }
  }
  console.log(`处理完成，修正了${fixCount}个文件`);
})();
