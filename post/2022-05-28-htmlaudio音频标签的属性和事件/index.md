---
title: "[HTML]audio音频标签的属性和事件"
date: "2022-05-28"
categories: 
  - "html-css-js"
tags: 
  - "audio"
  - "html"
---

> <audio>是HTML5新加入的用于播放音频的标签，HTML5已经得到广泛的支持，所以我们可以放心使用这个标签；利用它，可以轻松地在网页上播放音频，制作音乐播放器等。下面我们来聊聊它的属性和事件

## 概念

### 元数据

- 歌曲元数据是帮助用户理解音乐类型的东西，这样他们就可以决定是否要听这首歌
- 它可以包含多种类型的信息，如音乐**时长**、**类型**、**标题**、**艺术家**、**专辑名称**、评级、内容、描述、演员、导演、对歌曲的评论、流派、标签、跟踪器编号等。
- 如果歌曲没有音乐元数据信息，可以通过在线网站或元数据软件手动或自动添加

* * *

## 属性

### 兼容性提示

- 可以在<audio></audio>标签中间写文字，当浏览器不支持<audio>时，就会显示这串文字（注意只是显示里面的文字，并不会显示标签<audio></audio>）。
- **示例：**

```
<audio>
  能看到这段话，说明您的浏览器不支持 audio 标签捏
</audio>
```

### controls默认音乐控制面板

- 如果出现该属性，则将显示浏览器默认的音乐控制面板（不同浏览器不一样）
- 取值只有一个，即 controls="controls" 可简写为 controls
    - 如果写 controls="none" 等其他值，也等同于显示音乐控制面板
- **示例1：**

```
<audio controls>
  能看到这段话，说明您的浏览器不支持 audio 标签捏
</audio>
```

- **示例2：**

```
<audio controls="controls">
  能看到这段话，说明您的浏览器不支持 audio 标签捏
</audio>
```

### src音频文件链接

- src属性用于指定音频文件的链接
- **注意：**
    - 浏览器支持的音频文件格式可能各不相同，可能有mp3，wav，ogg，m4a，aac ......
    - 综合考虑兼容性和文件大小的话，建议使用mp3
    - 具体浏览器是否支持，可以调用后面介绍的canplaytype(type)函数检查。
- **示例：**

```
<audio src="./song.mp3" controls>
  能看到这段话，说明您的浏览器不支持 audio 标签捏
</audio>
```

### source资源文件标签

- 除了上面的src属性可以指定资源文件链接，还可以在audio标签内写多个source标签来指定资源文件标签，但并不是说会顺着循环播放，而是浏览器会选择第一个支持的格式来进行播放。
- **示例：**

```

<audio controls>
    <source src="./song.ogg" type="audio/ogg">
    <source src="./song.mp3" type="audio/mpeg">
    能看到这段话，说明您的浏览器不支持 audio 标签捏
</audio>
```

### autoplay自动播放

- 如果存在该属性，则音频在加载就绪后就会自动开始播放
- 取值只有一个：autoplay="autoplay"，可简写为 autoplay
    - 如果写 autoplay="none" 等其他值，等价于启用自动播放
    - 因此如果需要控制，建议使用 js 调用 后面介绍的 play() 函数实现
- **注意：**话是说可以自动播放，但目前很多浏览器由于用户体验，节省流量等原因，在一开始进入页面后并不会让音频自动播放，而是需要用户和页面有交互之后（即进行了点击（单击 onclick，双击 ondblclick，按下 onmousedown，松开 onmouseup，右击 oncontextmenu 等），键盘输入（（按下 onkeydown，松开 onkeyup 等））等操作）才有用。具体则要看浏览器各自的规则。
    
    - 在交互前使用autoplay可能会报错：DOMException: play() failed because the user didn't interact with the document first。
    
    - **部分事件不算用户发生了交互**（onmouseenter，onmouseleave，onmouseover，onmouseout）
    - 对于<video>标签，可以设置muted静音后可以自动播放，但<audio>不行
    - **解决办法**：显然我们需要用户的交互动作，那么就需要在播放之前引导用户进行交互，可以是一个欢迎弹窗，教程弹窗等引导点击关闭。或是提供播放按钮，让用户点击后才进行播放。
- **示例1：**

```
<audio autoplay>
  您的浏览器不支持 audio 标签捏
</audio>
```

- **示例2：**

```
<audio autoplay="autoplay">
  您的浏览器不支持 audio 标签捏
</audio>
```

### loop开启循环

- 有这个属性的时候，就会循环播放指定的音频文件
- 取值只有一个，即 loop="loop" ，可简写为 loop
    - 如果写 loop="none" 等其他值，等价于开启循环
- **示例：**

```
<audio loop src="./song.mp3">
  您的浏览器不支持 audio 标签捏
</audio>
```

### muted静音

- 存在这个属性时，则默认静音
- 注意只是默认静音，可以通过控制面板或js调节音量来取消静音
- 取值只有一个，即 muted="muted" ，可简写为 muted
- **示例：**

```
<audio muted src="./song.mp3">
  您的浏览器不支持 audio 标签捏
</audio>
```

### preload预加载方式

- 设置音频的预加载方式
- 取值有三个：
    - preload="auto"，自动加载，页面加载后加载整个音频
    - preload="metadata"，自动加载，页面加载后只加载[元数据](#元数据)
    - preload="none"，不自动加载
    - preload=""，等价于 auto
- **注意**：autoplay属性优先级高于preload，若指定autoplay，则会忽略此属性，浏览器将自动加载音频以供播放。
- **示例：**

```
<audio preload="auto" src="./song.mp3">
  您的浏览器不支持 audio 标签捏
</audio>
```

* * *

## JS操作属性

### 只读

> 这部分属性只能读取，不能进行赋值修改

#### duration音频总时长

- 双精度浮点数double。返回音频的总时长，单位为**秒**。
- **注意：**如果音频元数据还没加载好，则这个值会是NaN
- **示例：**

```
const audioDOM = document.getElementById("audio");
if (isNaN(audioDOM.duration)) {
    // 未加载时的操作
} else {
    // 已加载时的操作
}
```

#### paused是否暂停

- 布尔值boolean。如果音频是暂停状态，则返回 true ；否则返回 false
- **示例：**

```
const audioDOM = document.getElementById("audio");
if (audioDOM.paused == true) {  //如果是暂停状态
    audioDOM.play();  //播放音频
} else {              //如果正在播放
    audioDOM.pause(); //暂停
}
```

#### ended是否播放完毕

- 布尔值boolean。音频播放完毕时，返回true，否则返回false
- 如果音频并没有开启loop循环，则可用这个属性判断是否播放完成。当然播放完毕时，会触发ended事件

#### currentSrc音频链接

- 字符串String。返回正在播放或加载的音频url链接，即浏览器在source标签里选择的文件。

#### buffered已缓存范围

- TimeRanges对象。表示浏览器已经缓存的音频范围
    - buffered.length，完全加载时为1，但还没有加载完成之前，它可能是0（为0即为未加载或者加载错误），可能是2，3，4（已经加载这么多段，但还没有加载完成）等等
    - buffered.start(index)，返回浮点数，表示缓存的第index这一段的开头是第几秒。
    - buffered.end(index)，返回浮点数，表示缓存的第index这一段的结尾是第几秒。
- **注意：**
    - 调用start(index) 和end(index)之前，你需要判断length是否大于0，否则容易报错。
    - 如果想以此做加载进度条，调用end(0)是不行的，因为在完全加载之前，它表示的是第一段加载的长度。建议这样写：buffered.end(buffered.length - 1)
- **示例（获取已加载的比例）：**

```
let audio = document.getElementById("audio");
let timeRanges = audio.buffered;
let num = 0;
/*获取已加载时长，然后除以歌曲时长，即可得到已加载比例*/
if(timeRanges.length > 0)
    num = parseInt(timeRanges.end(timeRanges.length - 1) * 100 / audio.duration);
if (num > 100)
    num = 100;
else if (num < 0)
    num = 0;
```

#### seekable可跳转范围

- TimeRanges对象。同buffered。

#### networkState网络范围

- 获取音频的网络范围
- 取值：
    - 0：NETWORK\_EMPTY，音频尚未初始化
    - 1：NETWORK\_IDLE，浏览器已选择好采用什么编码格式来播放媒体，但尚未建立网络连接
    - 2：NETWORK\_LOADING，浏览器正在加载
    - 3：NETWORK\_NO\_SOURCE，未找到音频资源

#### error发生错误

- MediaError对象。当发生错误时，会产生一个对象。如果目前没有错误，则返回null
- MediaError构成：
    - code 错误码：
        - MEDIA\_ERR\_ABORTED，音频加载加载过程中由于用户操作而被终止
        - MEDIA\_ERR\_NETWORK，确认音频资源可用，但是加载时出现网路错误，音频加载被终止
        - MEDIA\_ERR\_DECODE，确认音频资源可用，但是解码发生错误
        - MEDIA\_ERR\_SRC\_NOT\_SUPPORTED，音频格式不被支持或者资源不可用
    - message 错误描述信息

#### seeking是否移动或跳转播放进度

- 布尔值boolean，如果用户移动或者跳转了播放进度，则触发seeking事件，这个值会返回true
- 即使暂停状态，跳转和移动播放进度条也会触发。
- 示例：

```
<audio id="audio" controls src="song.mp3" onseeking="seeking">
  您的浏览器不支持 audio 标签捏
</audio>

<script>
seeking:function(){
    const audioDOM = document.getElementById("audio");
    console.log(audioDOM.seeking);
}
</script>
```

### 可读写

> 这部分属性可以读取，也可以赋值修改

#### currentTime已播放时长

- 双精度浮点数double，返回已经播放的时长，单位为**秒**。可以给它赋值修改，来实现快进，回退，跳转等功能
- 取值应在 **\[0, (duration)\]**
- **示例：**

```
const audioDOM = document.getElementById("audio");
if (audioDOM.currentTime > 5) {
    audioDOM.currentTime -= 5;
} else {
    audioDOM.currentTime = 0;
}
```

#### volume音量

- 双精度浮点数double，返回当前音量大小，默认为 1，值为0时为静音。可修改它来增大，降低音量
- 取值应在 **\[0, 1\]**

```
const audioDOM = document.getElementById("audio");
if (audioDOM.volume < 0.9) {
    audioDOM.volume += 0.1;
} else {
    audioDOM.volume = 1;
}
```

#### playbackRate播放速度

- 双精度浮点数double，返回当前播放速度，默认为 1，可以通过修改它来调速。
- 最大速度根据浏览器不同而可能不同，建议在2倍速以内
- 取值建议在 **\[0, 2\]**
    - 2：2倍速
    - 1.5：1.5倍速
    - 1：正常速度
    - 0.5：半速
    - **0：不动，但仍然在播放状态**
- **示例：**

```
const audioDOM = document.getElementById("audio");
if (audioDOM.playbackRate >= 2)
    audioDOM.playbackRate = 0.5;
else
    audioDOM.playbackRate += 0.25;
```

#### 标签属性控制

> 以下属性都会返回布尔值boolean，可读写设置对应的标签属性是否启用

- controls控制面板
- autoplay自动播放
- muted静音
- loop循环播放
- **示例：**

```
const audioDOM = document.getElementById("audio");
audioDOM.controls = true;
if(audioDOM.loop == false){
    audioDOM.loop = true;
}
```

* * *

## JS操作函数

### play()播放

- 调用该方法能让音频播放
- 注意：
    - **同 autoplay 属性一样，在调用之前，需要用户和界面有互动，否则将报错！**
- **示例：**

```
const audioDOM = document.getElementById("audio");
if (audioDOM.canPlay == true) {   //如果资源准备好可以播放
    if (audioDOM.paused == true)  //音频为暂停状态
        audioDOM.play();    //播放
    else
        audioDOM.pause();   //暂停
}
```

### pause()暂停

- 调用该方法能让正在播放的音频暂停
- 从 play() 的示例中已经很明显，我们可以通过paused来判断是否为暂停状态，不是则让它暂停，是则让它播放，由此则可以实现平常播放器中单个按钮实现暂停/播放功能

### load()加载

- 如果没有设置 preload ，则可以在js调用该函数来触发加载

* * *

## 事件

### 加载生命周期

#### loadstart开始加载

- 开始加载音频了

#### durationchange时长改变

- 音频的总时长改变了。一般就是加载好歌曲的元数据了，或者是切换audio标签的src资源，即切换歌曲的时候。

#### loadedmetadata元数据加载完毕

- 可以用作判断“音频初始化”的方法。当然初始化也可以用duration属性是否为NaN或者durationchange来判断。其中元数据就包含有歌曲总时长，标题，艺术家等信息。

#### loadeddata数据开始加载

- 音频的第一帧加载完成时触发，此时整个音频还未加载完。

#### progress加载中

- 每次浏览器一加载，就会触发这个事件。
- 注意这个事件并不是在加载完成前一直触发，浏览器一般一开始只会加载一部分，然后等你播放或跳跃到和已经加载的音频差不多或是已经超过的时候，才会开始再加载一部分，以此直到完成加载整个音频。
- 加载进度条的长度改变函数，就可以绑定在这个事件上。

#### canplay可以播放

- 音频可以播放了。音频只加载了一部分，但已经可以开始播放了
- 可以通过这个事件来设置加载动画。触发前启用加载动画，触发后移除加载动画

#### canplaythrough可以播放整个音频

- 浏览器预计在不停下来进行缓冲的情况下，能够持续播放音频时会触发

### 其他事件

#### timeupdate已播放时长更新

- 即 currentTime 更新了，最频繁是每250毫秒触发一次。
- 播放进度条长度改变函数就可以绑定在这个事件上

#### waiting等待资源中

- 由于没有数据而导致暂停时触发。
- 可用于绑定加载动画

#### playing播放中

- 从waiting状态转换到可以播放的状态时触发。

#### play播放

- play()方法被调用时触发。

#### pause暂停

- pause()方法被调用时触发。

#### ended结束

- 音频播放完毕后触发。
- 当设置了autoplay时，不会触发这个事件
- 利用这个事件，可以实现播放列表的循环播放，随机播放。当触发时，切换src资源链接，并等待加载触发canplay，然后play()播放。

#### volumechange音量改变

- 音量改变时触发。
- 音量条的函数可以绑定在这个事件上

#### ratechange播放速率改变

- 播放速度改变时触发。

#### error发生错误

- 发生错误时触发。
