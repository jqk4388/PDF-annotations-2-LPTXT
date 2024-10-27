# PDF-annotations-2-LPTXT

PDF注释导出带坐标的文本文件（[LabelPlus](https://github.com/LabelPlus "LabelPlus")格式）
两种实现方式
1. **（推荐）** Adobe Acrobat：只要能运行Adobe Acrobat Pro就可以运行脚本。
2. Python：Python环境运行脚本或者Windows下使用编译的exe，但是可能会有其他不可预料的错误。

# 使用方法
1. Adobe Acrobat Pro
- 更多工具中找到动作向导
- 管理自定义命令
- 导入XML命令文件
- 打开需要PDF文件，在动作向导工具中点击命令**PDF注释导出LPtxt**运行，弹出窗口保存LPtxt

2.Python
- Windows10 以上版本，exe直接运行
- MAC系统，脚本运行
 需要配置Python环境，pip安装需要的库
` pip install PyMuPDF`
执行extract_annotations_2_lptxt.py
- 运行后弹出窗口选择一个带注释的PDF，在PDF目录下导出同名TXT文件。
