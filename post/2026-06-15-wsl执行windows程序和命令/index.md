---
title: "wsl执行windows程序和命令"
date: "2026-06-15"
tags: 
  - "wsl"
  - "windows"
---
# 前言
- WSL中可以直接执行 windows 中的程序，跟在 win 上的 cmd 是差不多的，大多内置程序放在 `/mnt/c/WINDOWS/system32/`，可以在 WSL 执行 `which cmd.exe` 看看:
```sh
$ which cmd.exe
/mnt/c/WINDOWS/system32/cmd.exe
```
- 如果想在windows打开文件管理器查看 WSL 当前目录，可以执行: 
```sh
$ explorer.exe .
```
- 如果在linux程序中使用 `popen("cmd")` 执行了 windows 的命令，想拿到返回结果，可能需要字符编码转换，从 gbk 转向 utf8