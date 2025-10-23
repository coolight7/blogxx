---
title: "ffmpeg-av_xx2str头文件宏c++编译失败"
date: "2025-10-23"
tags: 
  - "ffmpeg"
  - "av_err2str"
  - "av_ts2timestr"
  - "av_ts2str"
  - "#define"
  - "c++"
  - ""
---
# 前言
- ffmpeg的头文件中定义了一些宏，调用函数时用c的复合字面量临时创建数组处理后直接返回，由于这个临时变量在语句结束后其内存可能被后续的栈变量覆盖占用，因此是不安全的，只能像注释说的立马使用或拷贝，不能保存其指针
- 如下代码中的宏 `#define av_err2str(errnum)` 内调用函数时，参数是临时创建了一个char数组，并将数组每一个内容初始化为0，然后调用函数`av_make_error_string`：
```c
static inline char*
    av_make_error_string(char* errbuf, size_t errbuf_size, int errnum) {
    av_strerror(errnum, errbuf, errbuf_size);
    return errbuf;
}

/**
 * Convenience macro, the return value should be used only directly in
 * function arguments but never stand-alone.
 */
#define av_err2str(errnum)                   \
    av_make_error_string(                    \
        (char[AV_ERROR_MAX_STRING_SIZE]){0}, \
        AV_ERROR_MAX_STRING_SIZE,            \
        errnum                               \
    )
```
- 但在 c++ 直接是编译不通过, 在windows的msvc编译错误提示，不过翻译很难看...：
```sh
error C4576: 后跟初始值设定项列表的带圆括号类型是一个非标准的显式类型转换语法
```
- 所以下面主要是改一下，既要c++能编译，并且得保证线程安全

## 修改
- 有别的博客提到直接改用全局变量，但可能有线程安全问题，如果声明为 `thread_local` 可以让每个线程有一份变量内存，避免问题，但是不能直接拿它返回的指针存储后一直用，有别的函数一调用，它的内容就变了：

- 另外如果有协程、异步回调，也就是存在同一个线程中切换代码位置执行，有可能出现A函数异步调用B函数，B函数调用`av_err2str` 写入线程全局变量，但注意这时候是异步的，B结束后并不是一定会直接回到A，此时如果有个异步的C调用了B，那就会再次调用`av_err2str`覆盖线程全局变量的内容，异步示例：
```c++
future<const char*> B() async {
    // 修改线程全局变量
    return av_err2str();
}

void A() async {
    auto str = await B();
}

void C() async {
    auto str = await B();
}

int main() async {
    // 启动 A()、C()，可能其函数内出现交替执行
    await [
        A(),
        C()
    ];
    return 0;
}
```
- 所以我认为还是应该保持作为局部变量，先保证可靠再探索速度
- 直接写一个函数覆盖，然后把宏 undef 掉即可，至于考虑优化掉 string 的就是后话了，函数重写保证可靠后根据自己的项目考虑最优解：
```c++
#pragma once

extern "C" {
#include "libavutil/error.h"
#include "libavutil/timestamp.h"
}
#undef av_err2str
#undef av_ts2timestr
#undef av_ts2str

#include <string>

static inline std::string av_err2str(int errnum) {
    char av_error[AV_ERROR_MAX_STRING_SIZE] = {0};
    return std::string{
        av_make_error_string(av_error, AV_ERROR_MAX_STRING_SIZE, errnum)
    };
}

static inline std::string av_ts2timestr(int64_t ts, const AVRational* tb) {
    char av_error[AV_TS_MAX_STRING_SIZE] = {0};
    return std::string{av_ts_make_time_string(av_error, ts, tb)};
}

static inline std::string av_ts2str(int64_t ts) {
    char av_error[AV_TS_MAX_STRING_SIZE] = {0};
    return std::string{av_ts_make_string(av_error, ts)};
}
```