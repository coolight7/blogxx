---
title: "[c++]随机数生成rand()"
date: "2022-09-14"
categories: 
  - "c"
  - "编程语言"
tags: 
  - "c"
---
# [c++]随机数生成rand()

## rand()

> 在以往的c/c++中生成随机数是使用rand()函数，但它也有一些使用的注意事项

## 头文件

```
#include <stdlib.h>
```

## 使用

### 随机数范围

- rand()的返回值范围在 \[0, RAND\_MAX\]
- RAND\_MAX是一个宏定义，在stdlib.h中，在部分系统中值为32768
- 如果需要其他范围，则需要自己运算，例如：
    
    - \[a,b) 的随机整数，使用 (rand() % (b-a))+ a;
    - \[a,b\] 的随机整数，使用 (rand() % (b-a+1))+ a;
    
    - (a,b\] 的随机整数，使用 (rand() % (b-a))+ a + 1;

### 需要srand()初始化种子

- void srand(unsigned int seed);
- 如果不使用srand()初始化，然后直接调用rand()的话，会自动调用srand(1)进行初始化，因此你会发现，将写好的程序重复运行多次，每次生成的随机数是一样的。
- 我们一般是使用时间戳进行初始化，如：

```
#include <time.h>
#include <stdlib.h>

int main() {
    srand(time(nullptr)); //初始化种子
    rand();               //获取随机数
    return 0;
}
```

### 多线程时

- 在多线程中，对于rand()来说每个线程都是独立的，因此需要在每一个需要生成随机数的线程都进行初始化。
    - 比如，假设程序现在有线程 main, a, b, c
    - 其中main, a线程各自调用了srand(time(nullptr));进行初始化种子，而b，c线程没有
    - 那么main，a线程中调用rand()才能得到不同随机数
    - 而在b, c中，会默认调用srand(1)，因此这俩线程中生成的随机数是一样的。

## c++11\_random

- 如果你可以使用c++11标准，应该考虑使用<random>库的新方法获取随机数，功能更强更省心，他们的使用方法需要再了解：
    - 产生均匀分布的整数：uniform\_int\_distribution
    - 产生均匀分布的实数：uniform\_real\_distribution
    - 产生正态分布的实数：normal\_distribution
    - 生成二项分布的布尔值：bernoulli\_distribution
