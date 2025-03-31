// 自定义函数，用于左侧填充零
function padWithZeros(num, totalLength) {
    var str = String(num); // 转换为字符串
    while (str.length < totalLength) {
        str = '0' + str; // 在左侧添加零
    }
    return str; // 返回填充后的字符串
}

// 定义函数以将矩形坐标转换为百分比
function rectToPercentage(rect, pageWidth, pageHeight) {
    return [
        rect[0] / pageWidth,  // x0
        (pageHeight - rect[3]) / pageHeight,  // y0
    ];
}


// 将富文本内容转换为纯文本，并用【】括号表示加粗的文字
function convertRichTextToPlainText(richText) {
    if (!Array.isArray(richText)) return "";

    var plainText = "";

    // 遍历 richText 数组中的每个 span
    for (var i = 0; i < richText.length; i++) {
        var span = richText[i];
        var text = span.text || ""; // 获取文本内容

        // 检查是否加粗,一般400以上为加粗
        if (span.fontWeight>400) {
            text = "【" + text + "】"; // 用【】括号包裹加粗的文字
        }

        plainText += text; // 拼接到最终的纯文本中
    }
    return plainText;
}

// 提取注释的主要函数
function extractAnnotations() {
    var annotations = [];
    var totalPages = this.numPages; // 获取PDF的总页数

    for (var pageNum = 0; pageNum < totalPages; pageNum++) {
        var pageAnnotations = extractPageAnnotations(pageNum);
        annotations = annotations.concat(pageAnnotations);
    }

    annotations = sortAnnotations(annotations);
    assignAnnotationIndices(annotations);

    return annotations;
}

// 提取单页注释
function extractPageAnnotations(pageNum) {
    var annotations = [];
    var annots = this.getAnnots(pageNum); // 获取当前页的注释

    if (annots) {
        var pageBox = this.getPageBox("Crop", pageNum); // 获取裁切框（左、下、右、上）的坐标
        var pageWidth = pageBox[2] - pageBox[0]; // 计算页面宽度
        var pageHeight = pageBox[1] - pageBox[3]; // 计算页面高度

        for (var i = 0; i < annots.length; i++) {
            var annot = annots[i];
            annotations.push(processAnnotation(annot, pageNum, pageWidth, pageHeight));
        }
    }

    return annotations;
}

// 处理单个注释
function processAnnotation(annot, pageNum, pageWidth, pageHeight) {
    var richContent = annot.richContents || annot.contents || ""; // 获取富文本内容或普通内容
    var plainContent = convertRichTextToPlainText(richContent); // 转换为纯文本

    return {
        page: pageNum + 1, // 页码从1开始
        type: annot.type, // 注释类型
        content: plainContent, // 使用转换后的纯文本内容
        coordinates_percentage: rectToPercentage(annot.rect, pageWidth, pageHeight), // 注释坐标百分比
        creation_date: annot.creationDate || "" // 注释创建日期
    };
}

// 对注释进行排序
function sortAnnotations(annotations) {
    return annotations.sort(function(a, b) {
        return a.page - b.page || (a.creation_date > b.creation_date ? 1 : -1);
    });
}

// 为注释分配索引
function assignAnnotationIndices(annotations) {
    var currentPage = null;
    var index = 1;

    for (var j = 0; j < annotations.length; j++) {
        if (annotations[j].page !== currentPage) {
            currentPage = annotations[j].page;
            index = 1; // 重置索引为1
        }
        annotations[j].index = index; // 添加索引字段
        index++;
    }
}

// 转换注释到output变量
function convertListToLptxt(totalPages, annotations) {
    // 初始化输出变量
    var output = "";

    // 写入文件头
    output += "1,0\n-\n框内\n框外\n-";

    // 创建一个字典来存储每个页面的注释
    var annotatedPages = {};

    // 遍历所有注释，标记注释所在的页面
    for (var i = 0; i < annotations.length; i++) {
        var annot = annotations[i];
        var page = annot.page;
        if (!annotatedPages[page]) {
            annotatedPages[page] = [];
        }
        annotatedPages[page].push(annot);
    }

    // 遍历所有页面
    for (var pageNum = 1; pageNum <= totalPages; pageNum++) {
        // 页码头格式化
        output += "\n>>>>>>>>[" + padWithZeros(pageNum, 3) + ".tif]<<<<<<<<"; 

        // 检查该页面是否有注释
        if (annotatedPages[pageNum]) {
            // 输出该页面的所有注释
            for (var j = 0; j < annotatedPages[pageNum].length; j++) {
                var annot = annotatedPages[pageNum][j];
                var formattedData = formatData(annot);
                output += formattedData;
            }
        }
    }

    // 返回输出内容
    return output;
}

// 格式化输出数据
function formatData(annot) {
    return "\n----------------[" + annot.index + "]----------------[" + annot.coordinates_percentage[0] + "," + annot.coordinates_percentage[1] + ",1]\n" + annot.content;
}

// 定义函数以将输出导出为LPTXT
function exportAnnotationsToLPTXT(output) {
    // 创建一个新的空白 PDF 文档
    var newDoc = app.newDoc(); // 创建新的文档

    // 在新文档中添加一个文本框
    var rect = [72, 72, 540, 780]; // 定义文本框的位置和大小（左、下、右、上）
    var field = newDoc.addField("outputField", "text", 0, rect);
    field.textSize = 10; // 设置文本大小
    field.multiline = true; // 允许多行文本
    field.value = output; // 将内容写入文本框

    // 保存新文档到用户文件夹
    var tempFilePath = app.getPath("user") + "/output.pdf"; // 使用用户文件夹路径
    newDoc.saveAs(tempFilePath); // 保存新文档

    // 关闭新文档
    newDoc.closeDoc(); // 使用 closeDoc() 方法关闭文档

    // 使用 exportAsText 导出为文本文件
    try {
        var tempDoc = app.openDoc(tempFilePath); // 重新打开新文档
        var txtFilePath = tempFilePath.replace(/\.pdf$/, ".txt"); // 确定导出文件的路径
        tempDoc.exportAsText(txtFilePath); // 导出为 TXT 文件
        app.alert("注释已成功导出为LP格式文本。", 3);
        tempDoc.closeDoc(); // 关闭导出的文档
    } catch (e) {
        app.alert("导出失败：" + e.message);
    }
}

// 主函数开始
var annotations = extractAnnotations(); // 提取注释
var totalPages = this.numPages;// 获取总页数
var output = convertListToLptxt(totalPages, annotations);
exportAnnotationsToLPTXT(output);
