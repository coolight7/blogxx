---
title: "[linux/动态库]lib64/libc.so.6: version `GLIBC_x.xx' not found的解决和ls/mv等基础命令段错误救火"
date: "2024-08-12"
tags: 
  - "ldconfig"
  - "libc6"
  - "linux"
  - "ubuntu"
---
# [linux/动态库]lib64/libc.so.6: version `GLIBC_x.xx' not found的解决和ls/mv等基础命令段错误救火

## GLIBC 不匹配

- 最近遇到了这个问题，原因是程序/动态库是在高版本Ubuntu22编译出来的，然后复制到了低版本的Ubuntu20中希望运行，然后就报了这个错误。

- 了解原因后，解决办法分两种：
    - 在低版本重新编译
    
    - 在目标设备（低版本Ubuntu20）上添加高版本Ubuntu22的apt源，更新其libc。这里聊聊第二种。

- 找原因的过程中，还尝试过直接将高版本Ubuntu22上的libc.so替换到低版本的Ubuntu20上，结果ls、mv、rm等命令全都报段错误了，只剩下cd能用，文章后面聊聊这个和当时的救火的办法。

## apt更新libc6

- 添加高版本的apt源其实有点玩火，但能救急

- 添加高版本Ubuntu22的apt源：

```
$ sudo vi /etc/apt/sources.list
```

- 添加行：

```
deb http://th.archive.ubuntu.com/ubuntu jammy main  
```

- 保存后apt更新并更新libc：

```
$ sudo apt update
$ sudo apt install libc6
```

- 然后就ok了，如果提示找不到libcxx\_xxx的某个版本，可以编译安装新版本的gcc解决。

## ls/mv等基础命令段错误救火

- 一开始是在Ubuntu22上编译得到了程序和一些动态库，然后把程序和动态库复制到ubuntu20上运行，此时就报错提示找不到libc6和libcxx的一些版本。

- 然后就尝试把 libcxx 复制过来到 /usr/local/lib64 中，此时只剩下 libc6 的报错

- 接着就试试同样的把ubuntu22 上的 libc6 复制到 /usr/local/lib64 上，在 ldconfig 中该路径是动态库的优先搜索路径，此时程序执行时就会优先搜索该路径下的 libc6 和 libcxx

- 也就是这时，ls/mv/rm等基础命令全部段错误！！！只剩下cd/export等小部分命令可用

- 这说明是复制过来的 libc6 不能用出毛病了，此时千万不能断开ssh连接，不然就臭了。

- 然后设置更高优先级的动态库搜索路径变量 LD\_LIBARY\_PATH 让它优先搜索使用原本的 libc6 所在路径：

```
$ export LD_LIBARY_PATH=/usr/lib/x86_64-linux-gnu:$LD_LIBARY_PATH
```

- 接着赶紧把复制过来的 libc6.so 删掉。等测试正常后即可取消掉该环境变量：

```
$ unset LD_LIBARY_PATH
```
