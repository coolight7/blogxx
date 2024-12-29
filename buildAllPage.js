const fs = require("fs");
const path = require("path");

const dirPath = "./post/";
const allpageFilePath = "./page/allpage/index.md";

var pagelist = [];

const readMeta = function(str, start, end) {
    const start_tag = start;
    const end_tag = end;
    var start_index = str.indexOf(start_tag);
    if (start_index >= 0) {
        var end_index = str.indexOf(end_tag, start_index + start_tag.length);
        if (end_index >= 0) {
            return str.substring(start_index + start_tag.length, end_index);
        }
    }
    return null;
}

const readInfo = async function (name) {
    // 获取完整的文件路径
    const itemDirPath = path.join(dirPath, name);
    return new Promise((resolve) => {
        fs.stat(itemDirPath, (err, stats) => {
            if (err) {
                resolve(false);
                return console.error('Error getting stats of file: ' + err);
            }
            if (stats.isDirectory()) {
                fs.readFile(itemDirPath + "/index.md", (err, data) => {
                    if (err) {
                        resolve(false);
                        return console.error('Error reading file: '+ err);
                    }
                    var str = data.toString();
                    var title = readMeta(str, 'title: "', '"\n');
                    const dateStr = readMeta(str, 'date: "', '"\n');
                    if (!dateStr) {
                        console.error('Error parsing date: '+ itemDirPath);
                        process.exit(-1);
                    }
                    title = title.replace("[", "\\[");
                    title = title.replace("]", "\\]");
                    pagelist.push({
                        "title": title,
                        "dirname": name,
                        "date": dateStr ? Date.parse(dateStr) : null,
                        "dateStr": dateStr,
                    });
                    resolve(true);
                });
                return;
            }
            resolve(false);
        });
    });
}

fs.readdir(dirPath, async (err, files) => {
    if (err) {
        return console.error('Unable to scan directory: ' + err);
    }
    for (var i = 0; i < files.length; ++i) {
        var item = files[i];
        await readInfo(item);
    }
    pagelist.sort((left, right) => {
        if (!left.date) {
            return -1;
        }
        if (!right.date) {
            return 1;
        }
        return (right.date - left.date);
    });
    const newDate = pagelist[0].dateStr;
    const oldDate = pagelist[pagelist.length - 1].dateStr;
    var result = 
`
# 全部文章
---
> [!TIP]
> 共 ${pagelist.length} 篇文章
> 最新文章于 ${newDate}
> 最早文章于 ${oldDate}

`;
    for (var i = 0; i < pagelist.length; ++i) {
        var item = pagelist[i];
        result += `- [${item.title}](/port/${item.dirname}/)\n`;
    }
    // 写入
    fs.writeFile(allpageFilePath, result, (err) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log("写入完成：\n" + allpageFilePath);
    });
})
