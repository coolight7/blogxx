---
title: "mysql 内存占用高排查"
date: "2025-01-06"
tags: 
  - "mysql"
---
# mysql 内存占用高排查
- 最近发现 mysql 的内存占用一直在逐渐增加，一开始重启完是 400 MB 左右，后面几天时间内就涨到了 2.4 G，然而跟着一些博客排查mysql内部却没发现什么问题。这里记录最终有效的操作。

## glibc 内存碎片
- 部分博客提到了 mysql 默认使用的 glibc 存在内存碎片问题，导致内存并未归还给系统，因此逐渐升高。
- 我们可以手动触发其回收，但注意，生产环境谨慎使用：
```sh
gdb --batch --pid `pidof mysqld` --ex 'call malloc_trim(0)' 
``` 
- 这个的效果很明显，直接从 2.4 g 降低到 1.5 g
- 也有博客提到可以更换使用 jmalloc 解决。

## 关闭 PFS 
- PFS（performance schema）是 mysql 的性能监控工具，但它也会占用内存和额外的 CPU。
- 可以修改 /etc/mysql/my.cnf 文件：
```txt
[mysqld]
performance_schema = OFF
```
- 然后重启 mysqld ：
```sh
sudo systemctl restart mysql
```
- 我这边已经关闭，等过一段时间看看效果。