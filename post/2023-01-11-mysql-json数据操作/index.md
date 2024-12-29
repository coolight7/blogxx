---
title: "[mysql] JSON数据操作"
date: "2023-01-11"
categories: 
  - "软件工具"
tags: 
  - "mysql"
---
# [mysql] JSON数据操作

## 前言

- 环境：
    - mysql Ver 8.0.29 for Win64 on x86\_64

- 最近被mysql的json操作函数坑了一把，顺便记录下之前折腾的一些东西。

## 在MySql中使用

### **声明json类型的字段**：

- sql示例：

```
create table test(
    uids json not null default ('[]')
);
```

- 注意：
    - 默认值需要使用小括号包裹的符合json格式的字符串，如果不使用小括号()则会得到如下错误：
        - ERROR 1101 (42000): BLOB, TEXT, GEOMETRY or JSON column 'uids' can't have a default value
    
    - 最外面使用引号使用 **单引号'** 或 **双引号"** 都是可以的，但最好是最外面使用一种，里面的json字符串使用一种，例如：

```
default ('[{"name":"coolight"}, {"name","洛天依"}]')
或
default ("[{'name':'coolight'}, {'name','洛天依'}]")
```

- **如果json由程序合成而来，尤其需要注意防止sql注入**

### Mysql中常用的操作json函数

- 贴个外链：[Mysql JSON 函数参考](https://www.sjkjc.com/mysql-ref/json-functions/)，里面有很多函数的信息，这里我们只拿一些后面会用到的出来说。

- **JSON\_length** ( json )
    - 返回 JSON 文档或者 JSON 文档中通过路径指定的节点的长度
    
    - 我们这里只用它来获取JSON数组的元素个数

- **JSON\_search** ( json, one\_or\_all, string )
    - 搜索json中第一次one或全部all和给定字符串string匹配的路径
    
    - 后面我们会使用很多函数参数 path，实际上，我们很多时候并不知道想修改的值在json中的路径，尤其是在json是一个数组的时候，因此我们可以使用这个函数，搜索想修改的元素的路径，然后传给其他函数去操作。

- **JSON\_unquote** ( json )
    - 把json字符串的引号去掉

- **JSON\_contains** ( json1, json2, path )
    - 检查 json1 中指定路径 path 位置是否包含了 json2
    
    - 在比较两个数组元素相同，仅允许元素顺序不同时，可以使用：

```
JSON_LENGTH(json1)=JSON_LENGTH(json2) and JSON_CONTAINS(json1, json2)
// 例如：
update test set enable=true where JSON_LENGTH(json1)=JSON_LENGTH(json2) and JSON_CONTAINS(json1, json2);
```

- **JSON\_array\_append** ( json, path, value )
    - 对json中指定路径path所在的数组添加元素value
    
    - 路径中 $ 表示 根，然后访问数组内容用 **\[下标\]**，访问对象内容用 **.值名称**

```
// 示例：在数组末尾追加元素
SELECT JSON_ARRAY_APPEND('[1, 2, 3]', '$', 4); 
// 得到 [1,2,3,4]

// 示例：对数组添加一个元素，如果已经存在则不添加
// ["1000000", "1000001", "1000002"]
update test set uids=json_array_append(uids, '$','1000001') where id=777 and JSON_CONTAINS(uids,JSON_ARRAY('1000001'))=0;
// 没有添加，注意where ... and 后面 使用JSON_CONTAINS判断了是否包含准备添加的元素
```

- **JSON\_remove** ( json, path0 \[, path1, ... \] )
    - 删除json中指定路径 path 的元素
    
    - 请注意，传入多个path时，它将从左往右依次删除，
    
    - 因此，执行：JSON\_remove( "\[0,1,2,3,4,5,6\]", "$\[0\]", "$\[2\]" )
        - 先删除元素0，得到 \[1,2,3,4,5,6\]
        
        - 然后删除当前下标为2的元素，即3，得到 \[1,2,4,5,6\]
    
    - 示例：
        - 删除一个没有重复元素的字符串数组中的一个元素
        
        - 注意这里uids是一个 id的字符串数组
        
        - JSON\_SEARCH的第三个参数需要是字符串类型

```
// ["1000000", "1000001", "1000002"]
update test set uids=json_remove(uids, JSON_UNQUOTE(JSON_SEARCH(uids, 'one','1000001'))) where id=777;
// ["1000000", "1000002"]
```

- 注意，数组中字符串类型和数值类型是不一样的，例如：
    - \['1','2','3'\] 和 \[1,2,3\] 是不同的。
    
    - 这在使用上面的那些函数去判断/添加/删除时尤其需要注意，否则可能出现添加使用的是数值类型，而查找/删除时使用元素的数值类型去搞，结果一直行不通，而两者的差别仅仅是传入元素时是否加了引号。（我之前就是这样的......）
    
    - 如果你是程序合成sql，可以自己添加或去除元素的引号来控制，而如果你使用了mysql的触发器，则可以使用 CAST 函数来转换，例如：

```
create TRIGGER auto_reset after insert on test for each row
BEGIN
    update test set uids=json_array_append(uids, '$', CAST(NEW.uid as char)) where id=NEW.id;
END;
```
