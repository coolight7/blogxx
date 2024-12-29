---
title: "[screen]Linux上保持程序在关闭ssh窗口后继续运行"
date: "2022-02-26"
categories: 
  - "linux"
  - "软件工具"
tags: 
  - "linux"
  - "screen"
---

## Screen

> \* screen是Linux下的多重视窗管理程序。在使用SSH远程登录Linux时，如果连接中断（网络中断，直接关闭连ssh窗口等），重新连接时，系统将开一个新的session，无法恢复原来的session，而screen则可以解决这个问题 。
> 
> \* 这个软件就是本文的核心，通过它，我们就可以实现如frp等程序可以在关闭ssh窗口后仍然可以后台运行。

* * *

## 环境

- 腾讯云服务器 - Linux - ubuntu20.04
- screen
    - 版本：
        - \# screen -v
        - Screen version 4.08.00 (GNU) 05-Feb-20
    - 安装
        - \# sudo apt-get install screen

* * *

## 使用方法示例

> 这里我们用screen来维持frps的运行作示例来展示screen的使用方法。

- frps
    - 这是一个实现内网穿透的服务端。
    - 它默认情况下是需要保持ssh窗口的开启才能运行，一旦关闭ssh窗口，frps就会随之关闭。
- 首先让screen创建一个窗口
    - \# screen -S frps
    - 注意命令中的 -S 是大写的 S。
    - 命令中的第三部分frps只是一个名字而已，虽然创建的窗口是我们想用来保持frps运行的，但你可以随意起一个其他的名字，如abc，coolight等等。
- 然后直接运行frps
    - \# frps -c frps.ini
    - 你也可以运行其他软件。
- 到这里实际上已经完成了，接下来可以直接把ssh窗口关闭，然后测试一下frps（你运行的软件）是否还在运行。

* * *

## screen的常用命令

- \# screen -S 窗口名
    - 让screen创建一个窗口，使得把当前ssh窗口关闭后让screen保持这个窗口的运行。
- \# screen -ls
    - 列出所有screen维持的窗口。
- \# screen -r 窗口名
    - 回到这个窗口。
- 退出一个会话窗口
    - 回到那个窗口。
    - 直接执行 exit 即可。
