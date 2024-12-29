---
title: "[c++] 编译错误：fatal  error C1001: 内部编译器错误"
date: "2023-06-04"
categories: 
  - "c"
tags: 
  - "c"
---

- 这个是比较棘手的，因为具体原因未知，可能性也多。

- **强烈建议：**使用其他编译器编译一次，很可能可以得到错误原因！比如在windows环境，我们常用的是 vs自带的msvc，你可以尝试使用 mingw、clang；或者如果你的代码是支持跨端的，就可以复制项目到 linux/虚拟机 下用 gcc 编译看看。

- 下面我们来列举一些可能性。

## 头文件互相引用

- 比如说 A.h 里面 #include "B.h"，然后 B.h 里面也 #include "A.h"

- **1:** 第一个考虑的思路是把相关代码从 .h 迁移到 .cpp 中。

- **2:** 如果是因为一些声明之类的导致了需要互相引用，用第一个方法迁移仍然是不行的。这时应当使用前置声明，然后移除 include 语句：
    - 比如，假设 A.h :

```
...
# include "B.h"
class A {
    B* data_ptr = nullptr;
};
```

- \-
    - B.h :

```
...
#include "A.h"
class B {
    A* data_ptr = nullptr;
}
```

- 像上面这样的情况就可以在 A.h 中前置声明 class B; 然后直接删除 #include "B.h" 语句

- 这是在告诉编译器，有一个声明类叫做 B，如果在编译时遇到B这个符号就当成一个声明的类就好，然后等待后续的编译或链接再确定。因此就可以去除 #include "B.h" 语句，从而解决循环引用的问题。

- 改动后 A.h ：

```
...
class B;

class A {
    B* data_ptr = nullptr;
};
```

- B.h 不需要改动

## 变量访问权限定义有问题

- 最近遇到的就是这个，就是在给函数传参时，我写了这样一段代码：

```
#include <chrono>

void wow(std::chrono::seconds second) {
    ......
}

void hello(time_t num) {
    wow(const std::chrono::seconds(num));
}
```

- 哈哈不知道你是否发现了问题，在hello() 里我们调用了wow()，但传参是创建变量时写了个const ！！！就是这个导致了msvc编译失败了，我也是给gcc编译它才报出这个问题。

- 实际上还有类似于你在不当的位置使用了 类 的（protected/private）声明的变量或函数，或是static相关的一些访问权限问题。检查起来相当麻烦，所以最好还是放别的编译器跑一下看看。
