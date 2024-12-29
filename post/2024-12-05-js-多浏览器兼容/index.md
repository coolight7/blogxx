---
title: "JS 多浏览器兼容"
date: "2024-12-05"
categories: 
  - "html-css-js"
tags: 
  - "js"
  - "兼容性"
---
# JS 多浏览器兼容

## 前言

- 不同浏览器的不同版本对 JS 的兼容性都不太一样，JS 本身也分多个版本，所以适配起来还是想当麻烦的。尤其是 IE

- 文档：
    - **[MDN](https://developer.mozilla.org/)**
    
    - **[UDN](https://udn.realityripple.com/)**

## JS获取浏览器版本

```
// 获取指定浏览器的主版本号，如果不是指定浏览器，则返回0
        var getIEVersion = function () {
            var match = navigator.userAgent.match(/(?:MSIE |Trident\/.*; rv:)(\d+)/);
            return (match && match.length >= 2) ? parseInt(match[1]) : 0;
        }
        var getFireFoxVersion = function () {
            var match = navigator.userAgent.match(new RegExp('Firefox/([^)]+)'));
            return (match && match.length >= 2) ? parseInt(match[1]) : 0;
        }
        var getChromeVersion = function () {
            var relist = navigator.userAgent.match(/Chrome\/([\d]+)/);
            if (null == relist || relist.length <= 1) {
                return 0;
            }
            return parseInt(relist[1]);
        }
```

## 缺少原生 JS 的内置函数或类实现

- 可使用库补充一部分，如 [https://github.com/inexorabletash/polyfill/](https://github.com/inexorabletash/polyfill/)，或自己补充。

### document.getElementsByClassName

```
        if (!document.getElementsByClassName) {
            document.getElementsByClassName = function (className, element) {
                var children = (element || document).getElementsByTagName('*');
                var elements = new Array();
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    var classNames = child.className.split(' ');
                    for (var j = 0; j < classNames.length; j++) {
                        if (classNames[j] == className) {
                            elements.push(child);
                            break;
                        }
                    }
                }
                return elements;
            };
        }
```

### Function.prototype.bind

```
        if (!Function.prototype.bind) {
            // 兼容 ie，缺失 bind
            Function.prototype.bind = function (oThis) {
                if (typeof this !== "function") {
                    // closest thing possible to the ECMAScript 5 internal IsCallable function
                    throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
                }

                var aArgs = Array.prototype.slice.call(arguments, 1);
                var fToBind = this;
                var fNOP = function () { };
                var fBound = function () {
                    return fToBind.apply(
                        this instanceof fNOP && oThis
                            ? this
                            : oThis,
                        aArgs.concat(Array.prototype.slice.call(arguments))
                    );
                };

                if (this.prototype) {
                    fNOP.prototype = this.prototype;
                }
                fBound.prototype = new fNOP();
                return fBound;
            };
        }
```

### window.atob

```
        if (!window.atob) {
            window.atob = function (str) {
                var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
                var output = "";
                var len = str.length;
                if (str.charAt(len - 1) === "=") {
                    output += String.fromCharCode((parseInt(str.slice(len - 2, len), 16) << 2));
                } else if (str.charAt(len - 2) === "=") {
                    output += String.fromCharCode((parseInt(str.slice(len - 1), 16) << 4));
                } else {
                    for (var i = 0; i < len; i += 4) {
                        var byte1 = chars.indexOf(str.charAt(i));
                        var byte2 = chars.indexOf(str.charAt(i + 1));
                        var triplet = ((byte1 << 2) | (byte2 >> 4)) & 255;
                        output += String.fromCharCode(triplet);
                        if (i + 2 < len) {
                            var byte3 = chars.indexOf(str.charAt(i + 2));
                            if (byte3 !== 64) { // '=' is 64 in ASCII
                                triplet = (((byte2 & 15) << 4) | (byte3 >> 2)) & 255;
                                output += String.fromCharCode(triplet);
                            }
                        }
                        if (i + 3 < len) {
                            var byte4 = chars.indexOf(str.charAt(i + 3));
                            if (byte4 !== 64) {
                                triplet = (((byte3 & 3) << 6) | byte4) & 255;
                                output += String.fromCharCode(triplet);
                            }
                        }
                    }
                }
                return output;
            };
        }
        var atob = window.atob;
```

### window.btoa

```
        if (!window.btoa) {
            window.btoa = function (str) {
                var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
                var output = '';
                var i = 0;

                while (i < str.length) {
                    var byte1 = str.charCodeAt(i++);
                    var byte2 = str.charCodeAt(i++);
                    var byte3 = str.charCodeAt(i++);
                    var enc1 = byte1 >> 2;
                    var enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);
                    var enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
                    var enc4 = byte3 & 63;

                    if (isNaN(byte2)) {
                        enc3 = enc4 = 64;
                    } else if (isNaN(byte3)) {
                        enc4 = 64;
                    }

                    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
                }

                return output;
            };
        }
        var btoa = window.btoa;
```

## 问题

- **不使用 async，使用 Promise 代替**；由于 async/await 是 ES2017 才支持的，对于不支持的浏览器，解析时会认为 async 函数的 函数声明之前有未知符号，因此判定为JS语法/语义（syntax parse/semantic parse）解析错误，导致整片 JS 不执行。

- **不使用箭头函数 () => {}**；而是使用普通的函数声明方式：

```
var func = function() {}
function hello () {}
```

- **数组/map/函数参数 的最后一个元素不要添加逗号 ,** IE解析有问题

```
// 应当: 
[1, 2, 3] 
{a: 1, b: 2}
var obj = {
    a : 1,
    b : 2
}
hello(
    a,
    b
) 

// 而不是 
[1, 2, 3, ] 
{ a: 1, b: 2, }
var obj = {
    a : 1,
    b : 2,    
}
hello(
    a,
    b,
) 
```

- **变量声明使用 var**。不要声明变量不使用声明符号，不要使用 let/const

```
var data = 0; // ok
abc = 0;      // 不要，IE 部分版本不支持
let a = 0;    // 旧浏览器不支持
const b = 0;  // 旧浏览器不支持
```

- **额外添加的类对 \[\] 运算符的重载性能和兼容性问题**，建议不使用 \[\] 访问，而是使用 at() 等函数方式访问：
    - [https://github.com/inexorabletash/polyfill/](https://github.com/inexorabletash/polyfill/) 该库的 TypedArray 有自定义实现 Uint8Array/Uint16Array 等，但其 \[\] 运算符实现有性能问题限制，因此可以把源码中该 \[\] 实现删除，然后自己添加 at 函数实现使用。
    
    - 另一个问题是，部分浏览器上，polyfill实现的运算符重载有问题，data\[0\] 和 其内部维护的真实数组的内存不一样，因此可能出现 var data = Uint8Array(初始化数据); 结果打印 console.log(data\[0\]) 是 undefined，console.log(data.at(0)) 是正常的。更离谱的是 data\[0\] 允许被赋值，然后访问正常不报错，可能导致灵异 bug。

```
// 假设由于浏览器缺少支持 Uint8Array，自定义实现了一个 Uint8Array
function Uint8Array() { ... }

var data = Uint8Array();
console.log(data[0]);     // 不建议
console.log(data.at(0));  // 建议使用
```

- **JS 注释和字符串中不要写标签**；会导致浏览器解析错误，从而整个HTML异常，如：

```
<!DOCTYPE html>
<html lang="zh">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>页面</title>
    <script>
        // 浏览器会认为字符串中的 </script> 是当前块的结束，然后后面的就有问题了。
        var data = "<script> console.log(hello); </script>";
        body.appendChild(data);
    </script>
</head>

<body>
</body>

</html>
```

- **在 window.onload 中执行 document.write 覆盖了整个页面后之前声明的函数和变量被清理。**在其他浏览器中，覆盖后上一个页面的函数和变量是仍然存在且可访问的，但IE不同，这里可以把上一个页面所有需要执行的代码包裹在一个函数中，然后拼接给新页面：

```
var init_func = function () { ... }

init_func();

var createScriptBlock = function (func) {
    // - 直接写 script 标签会导致浏览器解析异常，因此拆分为多段字符串相加
    return "<" + "script" + ">" + "(" + func.toString() + ")();" + "</" + "script" + ">";
}
if (getIEVersion() > 0) {
    // - ie 使用整个覆盖页面后之前的页面 js 失效，因此需要在开头插入并再执行一次
    var headTagIndex = result.indexOf("</head>");
    if (headTagIndex < 0) {
        headTagIndex = 0;
    }
    result = result.slice(0, headTagIndex)
        + createScriptBlock(init_func)
        + result.slice(headTagIndex);
}
// 重新覆盖渲染页面内容
document.write(result);
document.close();
```

- **覆盖对象的变量**；部分 js 对象可能是只读的，如果想覆盖该变量可能需要尝试多种办法，有些可能覆盖失败但却不会报错，因此最好覆盖后检查一下：

```
var obj = {
    data : "123"
};

obj.data = "456";
obj["data"] = "456";

Object.defineProperty(obj, 'data', {
    value: "456"
});

Object.defineProperty(obj, 'data', {
    get: function () {
        return "456";
    }
});
```

- **事件触发**；JS 主动触发事件：

```
try {
    if (window.dispatchEvent && Event) {
        window.dispatchEvent(new Event('load'));
        return;
    }
} catch (e) { }
if (window.fireEvent) {
    window.fireEvent("onload");
}
```
