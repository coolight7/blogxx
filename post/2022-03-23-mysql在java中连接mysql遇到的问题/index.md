---
title: "[mysql]用JAVA连接mysql出错，但账号密码都正确，在控制台也能使用？"
date: "2022-03-23"
categories: 
  - "java"
  - "软件工具"
tags: 
  - "java"
  - "mysql"
---
# [mysql]用JAVA连接mysql出错，但账号密码都正确，在控制台也能使用？

- 检查账号的访问权限，localhost则只能在本机连接使用
- 如果访问正确的，我有遇到过一次比较玄乎的，在创建账号后需要修改账号对已有数据库的访问权限，然后才能在java连接时使用，但在cmd命令行是可以直接使用的。
