---
title: "[c++] lambda递归"
date: "2023-09-25"
categories: 
  - "c"
---
# [c++] lambda递归

## lambda表达式

- 也就是匿名函数，我们可以在全局区、函数内、就像声明变量一样来声明一个函数出来用，而普通函数并不能在函数内声明。

- 示例：

```
int main() {
    // 声明
    auto fun = []() {
        cout << 123 << endl;
    };
    // 调用
    fun();
    return 0;
}
```

## 递归

- 对于普通函数，递归调用很简单，我们可以在函数内直接调用函数自己。

```
int hello(int value) {
    if(value < 0) {
        return 0;
    }
    cout << value << endl;
    hello(value - 1);
}
```

## lambda递归

- 对于 lambda 实现递归，由于它是匿名函数，本身没有函数名，我们是把他赋值给了一个变量。

- 但要注意的是，像下面这样直接调用是不行的：

- 因为在 声明lambda表达式时，变量fun应当视为还没声明，fun需要等lambda表达式构造完成后赋值过来才算完成声明，因此在 lambda 内是不能访问 fun 这个变量的。

```
int main() {
    auto fun = [&fun](int value) {
        if(value < 0) { 
             return;
        }
        cout << value << endl;
        // 这里是不行的！！！
        fun(value - 1);
    };
    fun(10);
    return 0;
}
```

- 既然如此，我们可以在lambda表达式前先声明一个 “容器”，让它去保存lambda，并且在声明 lambda时，由于这个容器是之前声明好的，因此可以引用捕获它，然后在 lambda内取到自己调用即可：

```

#include <iostream>
#include <functional>
using namespace std;

int main() {
    int i = 10;
    std::function<void()> myfun;
    myfun = [&myfun, &i]() {
        if (i < 0) {
            return;
        }
        cout << i << endl;
        --i;
        myfun();
    };
    myfun();
    return 0;
}
```
