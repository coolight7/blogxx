---
title: "[HTML/CSS]audio音乐进度条（一）外观"
date: "2022-05-26"
categories: 
  - "html-css-js"
tags: 
  - "audio"
  - "css"
  - "html"
---
# [HTML/CSS]audio音乐进度条（一）外观

## 预期效果

![](images/image-40.png)

> 由于audio标签自带的控制面板样式可能不合我们的心意，很多时候会想把自定义音乐播放器的样式，其中进度条也是不可少的。

- 最终将会实现如图的效果，并加上拖动进度条功能，显示已加载的比例条（图中黄色条）

* * *

## 实现

- 首当其冲的当然是一个<span>作为**外框**
- 然后搞一个<div>布局包住**播放进度条**和**加载进度条**
- 最后加入两个<span>作为进度条：

```
<span id="cmusic_control_span_progressBar">
    <div class="cmusic_displayFlex_class cmusic_control_progress_div">
        <span id="cmusic_control_span_loadProgress" style="width:80%"></span>
        <span id="cmusic_control_span_progress" style="width:50%"></span>
    </div>
</span>
```

- 给他俩搞个CSS样式
    
    - 从预览图里我们可以发现，两个进度条是重叠的，所以显然他们的定位position要设置为绝对定位absolute。
    - 然后给外框添加内阴影，显得是凹进去的一个凹槽
    - 再把里面的进度条调小一些、再居中，并给与渐变色，会显得比较有青春气息
    
    - 由于代码是从项目里拉出来的，类名啥的会长一些：

```
/*外框*/
#cmusic_control_span_progressBar{
    border-radius: 50px;
    height: 20px;
    width: 100%;
    display: inline-flex;
    align-items: center;
    position: relative;
    background: transparent;
    box-shadow: inset 2px 2px 4px #bcc5d6,
        inset -2px -2px 5px #feffff;
    border: 2px solid #d0f4ff;
    justify-content: center;
    transition: all 0.8s ease;
}
/*布局类*/
.cmusic_displayFlex_class {
    width: 100%;
    display: flex;
    margin-left: auto;
    margin-right: auto;
}
.cmusic_control_progress_div {
    position:absolute;
    width:94% !important;
    height:100%;
    align-items: center;
}
/*进度条*/
#cmusic_control_span_progress,
#cmusic_control_span_loadProgress{
    background: linear-gradient(90deg, #c4f4fe, #66ccff);
    border-radius: 50px;
    position: absolute;
    height: 60%;
    pointer-events: none;
    transition: width 0.5s ease;
    box-shadow: 2px 2px 10px #ccd3ff,
    -2px -2px 10px #ccd3ff;
}
/*加载进度条*/
#cmusic_control_span_loadProgress {
    background: linear-gradient(90deg, #abecd6, #fff9d2);
}
```

- 目前效果：

/\*外框\*/ #cmusic\_control\_span\_progressBar{ border-radius: 50px; height: 20px; width: 100%; display: inline-flex; align-items: center; position: relative; background: transparent; box-shadow: inset 2px 2px 4px #bcc5d6, inset -2px -2px 5px #feffff; border: 2px solid #d0f4ff; justify-content: center; transition: all 0.8s ease; } /\*布局类\*/ .cmusic\_displayFlex\_class { width: 100%; display: flex; margin-left: auto; margin-right: auto; } .cmusic\_control\_progress\_div { position:absolute; width:94% !important; height:100%; align-items: center; } /\*进度条\*/ #cmusic\_control\_span\_progress, #cmusic\_control\_span\_loadProgress{ background: linear-gradient(90deg, #c4f4fe, #66ccff); border-radius: 50px; position: absolute; height: 60%; pointer-events: none; transition: width 0.5s ease; box-shadow: 2px 2px 10px #ccd3ff, -2px -2px 10px #ccd3ff; } /\*加载进度条\*/ #cmusic\_control\_span\_loadProgress { background: linear-gradient(90deg, #abecd6, #fff9d2); }

- 这样基本的样子就有了，其实相当简单，就是css要搞多一点

* * *

## 目录

> 本文我们聊了如何搞出进度条的外观，接下来我们将聊聊如何让进度条跟随<audio>的已播放时长改变播放进度

- 外观
- 跟随已播放时长改变播放进度
