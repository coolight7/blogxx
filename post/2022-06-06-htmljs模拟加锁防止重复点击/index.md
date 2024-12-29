---
title: "[HTML/JS]模拟加锁防止重复点击"
date: "2022-06-06"
categories: 
  - "html-css-js"
tags: 
  - "html"
  - "js"
---

> 由于用户的网络环境等各种原因，防止按钮重复点击，表单重复提交等都是减少bug发生，降低服务器压力等相当有效的方法。下面来聊聊通过模拟我们在操作系统里类似加锁的思想来防止重复点击。

## 思路

- 声明一个锁（布尔值），用来标识按钮，变量是否被锁上
- 当按钮按下后，把布尔值设置为false，即标记为已锁上
- 设置一个延时函数setTimeout()，等待一段时间后再把这个锁归还，设置布尔值为true
- 显然我们的按钮点击事件一开始就应该判断锁是否被锁上，是则直接结束。否则才能正常执行

* * *

## 示例

- HTML / JS

```
<div style="width:100%;display:flex;justify-content: center;background:#66ccff;border-radius:10px;border 1px solid #66ccff;">
    <button onclick="btn_click()" style="border-radius:10px;">
        点死我
    </button>
</div>


<script>
//锁变量
let lock = true;
//按钮点击执行函数
function btn_click() {
    if(lock == false) { 
        return;
    }
    //加锁
    lock = false;
    //执行按钮点击本应执行的事情
    alert("点了一下我捏");
    //限制间隔5000毫秒（即5秒）只能执行一次
    setTimeout(function(){
        //解锁
        lock = true;
    },5000);
}
</script>
```

- 效果（每隔5秒只会执行一次按钮点击应该执行的事情）：

点死我

<script>let lock = true; <div></div> function btn_click() { if(lock == false) { return; } lock = false; alert("点了一下我捏"); //限制间隔5000毫秒（即5秒）只能执行一次 setTimeout(function(){ lock = true; },5000); }</script>

* * *

## 结语

- 本文的例子思路和实现都是相当简单的，但确是很实用的方法。
- 另外，从这个思路出发，还能解决一些类似的问题，比如：
    - 音乐进度条的拖动。由于拖动的报告率太高，导致拖动过程界面卡顿，音乐的播放也很卡顿，那就可以用这个思路，每一段时间内只对应响应一次。
    - 降低输入框的响应。
- 后续我们再聊聊上面这些例子的解决方法实现。他们本质都是这个模拟加锁的思路，但可能有些需要一些细节上不同的处理。
