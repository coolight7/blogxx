---
title: "[vue3]audio音乐进度条（二）跟随播放进度"
date: "2022-05-26"
categories: 
  - "html-css-js"
  - "vue"
tags: 
  - "css"
  - "html"
  - "js"
  - "vue"
---

> 上一期我们介绍了外观设计，这把我们聊聊让进度条跟随播放进度走

## 预期效果

![](images/progress.gif)

* * *

## 准备

- 在此之前，你需要有以下基础：
    - HTML/CSS/JS
    - [了解一些<audio>标签的属性和事件](https://blog.coolight.cool/htmlaudio%e9%9f%b3%e9%a2%91%e6%a0%87%e7%ad%be%e7%9a%84%e5%b1%9e%e6%80%a7%e5%92%8c%e4%ba%8b%e4%bb%b6/)
    - Vue（数据绑定和事件绑定）

* * *

## 实现

- 还是上次的那个Html/css，但我们这把加入了：
    
    - 最外围用div包裹，用于创建vue
    - 添加了<audio>
        
        - 显示音乐标签面板 （controls）
        - 默认静音 （muted）
        - 绑定事件：播放时长更新事件 timeupdate
        
        - 绑定数据：音频文件资源链接 src
    
    - 两个vue数据绑定
        - cmusic\_control\_loadProgress\_style (加载进度条长度)
        - cmusic\_control\_progress\_style （播放进度条长度）
    - 修改部分css样式
- HTML：

```
<div id="root_div" class="cmusic_displayFlex_class" style="height:150px;justify-content:space-between;align-items: center;">
    <!-- 音频 -->
    <audio id="cmusic_audio" ref="cmusic_audio" controls muted
        @timeupdate="audio_lengthChange()" :src="url_audio">
    </audio>

    <span id="cmusic_control_span_progressBar">
        <div class="cmusic_displayFlex_class cmusic_control_progress_div" style="flex-direction: row;">
            <span id="cmusic_control_span_loadProgress" :style="cmusic_control_loadProgress_style"></span>
            <span id="cmusic_control_span_progress" :style="cmusic_control_progress_style"></span>
        </div>
    </span>
<div>
```

- CSS：

```
<style>
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
    flex-direction: column;
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
    width:100%;
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
</style>
```

- 并在script标签内写js/vue代码：

```
<!-- 引入vue -->
<script src="https://unpkg.com/vue@3.2.33"></script>
<script>
const { createApp } = Vue

var cmusic_json = {
    //数据
    data() {
        return {
            url_audio:"https://blog.coolight.cool/wp-content/uploads/2022/05/大喜_洛天依.m4a",
            cmusic_control_loadProgress_style:"width:80%",
            cmusic_control_progress_style:"width:50%"
        }
    },
    //函数
    methods:{
        //监听播放时长，修改进度条长度
        audio_lengthChange:function(){
            let caudio = this.$refs.cmusic_audio;
            //duration是音频总时长
            //如果音频元数据加载完成，才能获得其总时长，后续才能进行计算
            if (!isNaN(caudio.duration)){
                this.cmusic_control_progress_style = "width:" + (parseInt(caudio.currentTime / caudio.duration * 100)).toString() + "%;";
            }else{
                this.cmusic_control_progress_style = "width:0%;";
            }
        }
    }
};

var cmusic_app = Vue.createApp(cmusic_json);
var cmusic_vue = cmusic_app.mount("#root_div");
</script>
```

- 最终效果：
    - 默认是静音的，可以点击播放试试

/\*外框\*/ #cmusic\_control\_span\_progressBar{ border-radius: 50px; height: 20px; width: 100%; display: inline-flex; align-items: center; position: relative; background: transparent; box-shadow: inset 2px 2px 4px #bcc5d6, inset -2px -2px 5px #feffff; border: 2px solid #d0f4ff; justify-content: center; transition: all 0.8s ease; } /\*布局类\*/ .cmusic\_displayFlex\_class { width: 100%; display: flex; flex-direction: column; margin-left: auto; margin-right: auto; } .cmusic\_control\_progress\_div { position:absolute; width:94% !important; height:100%; align-items: center; } /\*进度条\*/ #cmusic\_control\_span\_progress, #cmusic\_control\_span\_loadProgress{ background: linear-gradient(90deg, #c4f4fe, #66ccff); border-radius: 50px; position: absolute; width:100%; height: 60%; pointer-events: none; transition: width 0.5s ease; box-shadow: 2px 2px 10px #ccd3ff, -2px -2px 10px #ccd3ff; } /\*加载进度条\*/ #cmusic\_control\_span\_loadProgress { background: linear-gradient(90deg, #abecd6, #fff9d2); }

<script src="https://unpkg.com/vue@3.2.33"></script>

<script>const { createApp } = Vue <div></div> var cmusic_json = { //数据 data() { return { url_audio:"https://blog.coolight.cool/wp-content/uploads/2022/05/大喜_洛天依.m4a", cmusic_control_loadProgress_style:"width:80%", cmusic_control_progress_style:"width:50%" } }, //函数 methods:{ //监听播放时长，修改进度条长度 audio_lengthChange:function(){ let caudio = this.$refs.cmusic_audio; //duration是音频总时长 //如果音频元数据加载完成，才能获得其总时长，后续才能进行计算 if (!isNaN(caudio.duration)){ this.cmusic_control_progress_style = "width:" + (parseInt(caudio.currentTime / caudio.duration * 100)).toString() + "%;"; }else{ this.cmusic_control_progress_style = "width:0%;"; } } } }; <div></div> var cmusic_app = Vue.createApp(cmusic_json); var cmusic_vue = cmusic_app.mount("#root_div");</script>
