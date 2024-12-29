---
title: "[c++模板] 用可变参数模板来实现 printf"
date: "2023-09-20"
categories: 
  - "c"
---

## 模板

- 使用模板我们就可以写一个函数，而它的参数可以接收多种类型。比如：

```
// 普通函数, 只能接受 int 类型参数，如果传入其他类型需要类型转换
int sum(int a, int b) {
    return (a + b);
}

double sum(double a, double b) {
    return (a + b);
}
```

- 由于不管是 int 参数、double参数，我们的 sum 函数求和内部代码都是一样的 (a + b)，那么写多遍就变得麻烦，因此我们可以用模板的代替，只写一次代码，然后编译器会帮我们生成多个版本出来：

```
// 模板
template<typename T>
T sum(T a, T b) {
    return (a + b);
}

// 编译会生成：
int sum(int a, int b) {
    return (a + b);
}
double sum(double a, double b) {
    return (a + b);
}
```

- c++的模板是编译期就会展开的，编译期会根据你使用到的类型，生成 template <int> ... 版本、template<double> ... 版本，而原本写的 template<T> ... 其实就是一个配置一样，运行时是不存在的，只是为了告诉编译期应该怎么生成代码。

## 可变参数模板

- 上面的求和只能2个数求和，那我如果有3个、4个、5个 ... 呢，难道要都写一遍吗：

```
int sum(int a, int b, int c) {
    return (a + b + c);
}

int sum(int a, int b, int c, int d) {
    return (a + b + c + d);
}
// ......
```

- 这时就可以请出可变参数模板来了，我们可以用三个点 来表示参数个数是不确定的：

```
template<typename T>
T sum(T... args) {
    // 展开求和
}
```

- 但展开这个参数包 args 并不是当成数组遍历的，而是需要通过递归来实现：

```
template<typename T>
T mysum(T item) {
    return item;
}
template<typename T>
T mysum(T item, T... args) {
    return mysum(item) + mysum(args);
}
/// 入口
template<typename T>
T sum(T... args) {
    return mysum(args);
}
```

- 最后一个函数 T sum(T... args) 才是我们暴露给用户使用的函数，而它其实是把参数包 args 转给了mysum(T item, T... args)，可见原本在 sum 的参数包被拆出第一个参数 item，和剩下的其他参数 args 调用 mysum，假如 args 不存在，则是直接调用了 mysum(T item)

- 而 mysum(T item, T... args) 干嘛了呢， 它将 item 传给 mysum(T item) 处理，并将剩下的传给了"自己"！是的，此时其实就是递归，但请注意，以往我们递归调用的是函数本身，但这次递归不一样，举个例子来看看：

- 假如我们现在要调用 sum 了：sum(1, 2, 3, 4, 5)，编译器就会生成接受5个参数的sum：

```
int sum(int arg0, int arg1, int arg2, int arg3, int arg4);
```

- 然后sum里面又调用了mysum，编译器接着按照mysum的声明，拆分sum传过来的5个参数为1 + 4生成：

```
int mysum(int item, int arg1, int arg2, int arg3, int arg4);
```

- 那接下来就看这个参数列表是 1+4 的mysum里面了，编译器先生成 mysum(T) 对应的 mysum(int)：

```
int mysum(int item);
```

- 然后1+4的mysum里还把剩下的4个参数递归传给了自己这个模板，那就得把 4 再拆分成 1 + 3 生成mysum

```
int mysum(int item, int arg2, int arg3, int arg4);
```

- 到这里你可能已经理解它是怎么拆参数包的了，虽然叫递归，但其实每一次拆包调用的并不是函数本身，而是源于同一个模板生成的少一个参数的函数。

- 再往下就是接着生成：

```
int mysum(int item, int arg3, int arg4);
int mysum(int item, int arg4);
```

- 最终参数包 args 只有一个参数时就不用再生成了，它会直接去调用之前生成的 mysum(T item)

## 不定类型数量

- 前面的可变参数模板还不够彻底，它生成的函数接受的类型只有一个 T，那我能不能每一个参数类型都不一样呢？那么就需要对 template 那一行动手脚了：

```
template<typename T1, typename T2, typename ...Args>
T1 mysum(T2 item, Args... args);
```

- 可以看到，template内，我们单独声明了 返回值类型是 T1，第一个参数类型是 T2，而后面的参数类型则不确定，因此用 typename...Args 声明，在 mysum 的参数列表中 (T2 item, Args... args)，Args...就表示args的数量是不确定的，由于Args本身类型数量也不确定，因此整体就表示 这里可以接受多个相同或不同类型的参数。

## 实现printf

- 有了上面的知识，实现printf就简单了，我们可以让它接收 第一个是字符串类型，然后加上多个任意类型的参数，并递归解析输出即可：

```
template<typename T>
int printNum(const std::string& str, int index, T&& item) {
	auto doShift = true;
	while (index < str.size()) {
		if (index == (str.size() - 1) || str[index] != '%') {
			cout << str[index];
			++index;
		}
		else if(doShift) {
			doShift = false;
			++index;
			switch (str[index]) {
			case 's':
			case 'd':
				cout << item;
				break;
			}
			++index;
		}
		else {
			return index - 1;
		}
	}
	return index - 1;
}

template<typename T, typename... Args>
int printNum(const std::string& str, int index, T&& item, Args&&... args) {
	index = printNum(str, index, item);
	return printNum(str, index + 1, std::forward<Args>(args)...);
}

template<typename ...Args>
void myPrintNum(const std::string& str, Args&&... args) {
	int index = 0;
	while (index < str.size()) {
		if (str[index] != '%') {
			cout << str[index];
			++index;
		}
		else {
			break;
		}
	}
	index = printNum(str, index, std::forward<Args>(args)...);
	++index;
	while (index < str.size()) {
		cout << str[index];
		++index;
	}
}

int main() {

        // 调用，参数数量允许和字符串内数量不同，不会出错
	myPrintNum("output: %d, %d, %d, %d  ---", 123, 100.123, true);
	return 0;
}
```
