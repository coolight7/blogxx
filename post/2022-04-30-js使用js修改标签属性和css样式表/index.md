---
title: "[JS]使用JS修改标签属性和CSS样式表"
date: "2022-04-30"
categories: 
  - "html-css-js"
tags: 
  - "css"
  - "html"
  - "js"
---

## HTML标签的样式

- 可以定义其样式在标签的尖括号中（内联样式），或者是使用CSS样式表
- 例如：<div id="cooldiv" class="cdiv"><div>
    - 在尖括号中： <div id="cooldiv" class="cdiv" height="20"></div>
    - 使用CSS样式表：
        - #cooldiv { height:20px; }
        - .cdiv { height:20px; }

* * *

## JS方法

> 这里我们都以开头的div为例子（<div id="cooldiv" class="cdiv"><div>）

### 修改内联样式：

- 标签.setAttribute("属性名", "属性值")
    - 示例：

```
<script>
/*通过id定位*/
function temp_byId(){
    var mydiv = document.getElementById("cooldiv");
    mydiv.setAttribute("height", "20px");
}

/*通过类名定位*/
function temp_byClassName(){
    var mydivList = document.getElementsByClassName("cdiv");
    for(var i = mydivList.length; i--;){
        mydivList[i].setAttribute("height", "20px");
    }
}
</script>
```

- 标签.style.属性名 = "属性值";
    
    - 对于有!importent的属性，此语句无效
    
    - 示例：

```
<script>
function temp(){
    var mydiv = document.getElementById("cooldiv");

    mydiv.style.height = "20px";
    mydiv.style.backgroundColor="#66ccff";
    mydiv.style.color = "#66ccff";
}
</script>
```

### 修改样式表：

- 标签.style.cssText = ”CSS样式“;
    
    - 将多次改变样式属性的操作合并为一次操作（适用于单个存在的节点），减少页面重排
    - 使用cssText时会把原有的cssText清掉
        - 比如假设原来的style中有’display:none;’，那么执行完一句新的（标签.style.cssText = ”CSS样式“;）后，display就被删掉了。
        - 解决办法：cssText累加：标签.style.cssText +=" ; CSS样式";
        - 注意：后面添加的CSS样式之前有一个英文的分号 ';' 不能丢，否则这个累加的方法在IE中是无效的
    
    - 示例：

```
<script>
function temp(){
    var mydiv = document.getElementById("cooldiv");
    mydiv.style.cssText = " color:#66ccff; height:20px; ";
    /*累加cssText，如果直接等于，则上一句设置的color height会被删掉*/
    mydiv.style.cssText += "; width:20px; ";
}
</script>
```

- 插入<style>标签
    - 示例：

```
/*创建一个<style>标签*/
var mystyle = document.createElement('style');

/*写入<style>内的CSS样式表*/
mystyle.innerHTML =
'.cdiv {' +
'   color: blue;' +
'   background-color: #66ccff;' +
'   height: 20px;' +
'}';

// 获取第一个<script>标签
var ref = document.querySelector('script');
// 在第一个<script>标签前插入<style>标签
ref.parentNode.insertBefore(mystyle, ref);
```

- 给标签添加类
    - 一个标签可以有多个类，因此我们可以搞一个新的类，把样式写在这个类里，再把这个类加到想要修改的标签上即可
    - 标签.classList.add("新样式类名");
    - 相关的方法：
        - 标签.classList.add("类名") ; 添加一个类名
        - 标签.classList.remove("类名") ; 去掉一个类名
        - 标签.classList.toggle("类名"); 引号中的类名，有就删除，没有就添加，方便切换
        - 标签.contains("类名"); 判断一个类型是不是存在，返回true和false
    - 示例：

```
<style>
/*定义一个新样式类newDiv，写入想要的样式*/
.newDiv {
    color:#66ccff;
    height: 20px;
}
</style>

<script>
/*把新样式类newDiv加到标签上*/
function temp(){
    var mydiv = document.getElementById("cooldiv");
    mydiv.classList.add("newDiv");
}
</script>
```
