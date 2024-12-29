---
title: "[flutter]监听系统主题改变"
date: "2022-12-26"
categories: 
  - "flutter-dart"
tags: 
  - "flutter"
  - "主题"
---

> 项目需要跟随系统主题变化，修改一些自定义组件的样式，但百度一直没找到可以监听系统主题变化的方法，而 MaterialApp 是有一个设置ThemeMode.system，使得app可以跟随系统主题变化而切换使用传入的theme和darkTheme，因此我就去看了看里面的源码，找到了监听系统主题变化的函数绑定方法。

## 解决

- 首先需要import标准库，flutter自带的，不需要pub等方式下载：

```
import 'dart:ui' as ui;
```

- 系统主题变化**函数绑定**：
    - 直接把下面代码中的onPlatformBrightnessChanged 赋值一个我们想执行的函数即可

```
    ui.PlatformDispatcher.instance.onPlatformBrightnessChanged = () {
      // 设置跟随系统主题变化
      followingSystem();
    };
```

- \-
    - 如果想**取消监听**，则同样把它赋值为null

```
ui.PlatformDispatcher.instance.onPlatformBrightnessChanged = null;
```

- \-
    - 如果想**判断现在是否有在监听**，则判断它是否不为null

```
if(null == ui.PlatformDispatcher.instance.onPlatformBrightnessChanged) {
    // 当前没有在监听
} else {
    // 有在监听
}
```

- \-
    - **注意 onPlatformBrightnessChanged 其实就是一个变量而已**，你如果给它赋值好几次，那显然它的值就是最后一次赋值的结果
    
    - 因此重复赋值并不会让它能执行多个函数
    
    - 如果需要执行多个函数，应当把这些函数放进一个函数里，然后把它赋值给 onPlatformBrightnessChanged ：

```
    ui.PlatformDispatcher.instance.onPlatformBrightnessChanged = () {
       fun1();
       fun2();
       fun3();
       fun4();
       ......
    };
```

- 系统主题变化时会执行 onPlatformBrightnessChanged 绑定的函数，那么我**怎么知道现在系统的主题是什么类型**呢？
    - 可以使用如下代码判断：

```
if(ui.PlatformDispatcher.instance.platformBrightness == Brightness.dark) {
    // 系统已经转变为夜间模式
    // app跟随修改主题为夜间
} else {
    // 系统已经转变为白天模式
    // app跟随修改主题为白天
}
```

- 还有一个问题需要注意，**启动app时，并不会触发上面绑定的函数**
    - 假设我们给app的默认主题是白天模式，此时系统已经是夜间模式，然后用户启动app，此时并不会触发 onPlatformBrightnessChanged ，因此app呈现的还是白天模式
    
    - 解决方法：显然就是进入app时，我们手动执行一次判断系统主题，跟随变化，然后绑定监听函数即可：

```
// 进入app时手动调用一次 followingSystem(), 然后调用 setFollowingSystem() 绑定监听函数

  void followingSystem() {
    if (ui.PlatformDispatcher.instance.platformBrightness == Brightness.dark) {
      // app跟随修改主题为夜间
    } else {
      // app跟随修改主题为白天
    }
  }

  // 设置跟随系统主题变化
  void setFollowingSystem() {
    ui.PlatformDispatcher.instance.onPlatformBrightnessChanged = () {
      followingSystem();
    };
  }
```
