---
title: "[HTML]列表项中的图片/a标签拖动导致排序"
date: "2022-07-16"
categories: 
  - "html-css-js"
tags: 
  - "html"
---
# [HTML]列表项中的图片/a标签拖动导致排序

## 问题

- 对列表项禁用拖动`<li draggable="false">...</li>`
- 但列表项内的图片`<img>`和`<a>`仍能拖动并导致列表拖拽排序

## 解决方法

- 在`<img>` 和 `<a>` 内添加 draggable="false"
- 即`<img draggable="false" /> <a draggable="false" />`
