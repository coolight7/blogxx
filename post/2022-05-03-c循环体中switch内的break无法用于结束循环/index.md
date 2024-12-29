---
title: "[c/c++]循环体中switch内的break无法用于结束循环"
date: "2022-05-03"
categories: 
  - "c"
tags: 
  - "c"
---
# [c/c++]循环体中switch内的break无法用于结束循环

> 循环内如果有switch的话，switch内的break无法用于结束循环，而是会终止switch的执行。

## 解决方法：

- 在switch内需要结束循环时搞一个控制值，用于控制循环
- 如 for(;i;); 中的i，一开始置1等非0值令循环可以执行，在需要结束循环的case里可以写i = 0;continue;
- 也就是说，switch中的continue仍然是对循环有效果的，会马上进入新一轮的循环，而跳过continue后面的语句。
