---
title: "[HTTP/C++]请求体form-data解析"
date: "2022-10-23"
categories: 
  - "c"
tags: 
  - "c"
  - "http"
---

## 预备知识

### URL编解码

- 常用于url链接和application/x-www-form-urlencoded格式的请求体中对参数进行编码

- 由于url的参数的样子是key1=value1&key2=value2，如果key或者value中包含= &等字符，就会导致解析时混乱了，因此需要一种编码来把这些可能引起歧义的符号替换掉

- 例如：http://localhost/src/components/global/Checkbox.vue?type=style&index=0
    
    - 这个链接中 ? 的后面就是参数部分，即 type=style&index=0
    
    - 这是两个键值对，type值为style，index值为0
    
    - 假如现在 type 的值为 a=b，那么参数部分最后组装成 type=a=b&index=0 ，可见已经有点歧义了，但由于&分割，兴许还能解析
    
    - 如果再假设type的值为 a&c=d，那组装后是 type=a&c=d&index=0，显然这个字符串给程序去解析的话，天王老子来了也会被解析为三个部分：type值为a，c值为d，index值为0

### 请求体编码格式

- Http协议中，请求体有多种格式，如：
    - **application/x-www-form-urlencoded**，相当常用的格式，即和url中的参数一样，是key=value格式的字符串，且这个字符串是经过url编码的，在解析之前需要进行url解码。
    
    - **multipart/form-data**，可以上传多个键值对/文件。具体格式下文将着重展开。
    
    - **application/json**，顾名思义，就是json格式的
    
    - **application/xml**，xml格式，即像HTML一般的标签
    
    - **text/plain**，文本
    
    - **application/octet-stream**，二进制数据，且仅能上传一个文件。如果传单个文件（图片、音视频）使用这个相当快乐，它并不需要解析，整个请求体就是文件，但需要使用其他方式上传文件的文件名等信息。

- 如果有请求体，则应该在请求头使用 Content-Type 说明使用的编码格式

* * *

## form-data格式

- 如果请求体是form-data格式，则在请求头中，我们应该能找到 Content-Type 的值为 multipart/form-data 且它后面会带一个 **boundary**：
    - Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW
    
    - 这里boundary是解析请求体用的

- 我们先来看看form-data格式的请求体的样子：

```
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="myfile"; filename="hello.gif" filename*=UTF-8''hello.gif
Content-Type: image/gif


{二进制数据}
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="mytext"

coolight
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

- 这个请求体示例中有两个部分：
    - 文件名为hello.gif的动态图
    
    - 一个键值对，键为mytext，值为coolight

- 刚刚在请求头的 Content-Type 中的boundary的值在请求体中是用来分割数据的，在boundary前加两个-，即：--{boundary}，并用它独占一行作为分隔标志。

- 注意最后一行分割标志的后面还有两个-，即 --{boundary}--

- 我们先看示例的第二部分，即键值对 mytext=coolight
    - 其格式如下，其中把换行**(\\r\\n)**标出：
    
    - 注意换行 \\r\\n 也是格式的一部分

```
--{boundary}(\r\n)
Content-Disposition: form-data; name="{key}"(\r\n)
(\r\n)
{value}(\r\n)
--{boundary}
```

- 然后是第一部分，上传文件时的格式：
    - 其中**与键值对格式不同的是**，在name后面多了个filename，再后面还有一个**可选**的filename\*。这是因为如果filename里面包含中文等非ASCII字符时，因客户端和服务端的编码不同而导致解析时filename乱码，因此可能会多传一个filename\*，指定使用的编码格式，如UTF-8，且注意它的值是编码方式后紧接着两个单引号'，然后直接是对应编码的filename，整个字符串两端没有双引号。
    
    - 注意 行Content-Type 之后还有两行才是数据。

```
--{boundary}(\r\n)
Content-Disposition: form-data; name="{key}"; filename="{filename}"(\r\n)[; filename*={编码方式}''{对应编码的filename}]
Content-Type: {文件格式}(\r\n)
(\r\n)
(\r\n)
{二进制数据}(\r\n)
--{boundary}
```

* * *

## c++解析

> 这里使用正则表达式标准库匹配，并使用string\_view减小开销。

```
#include <regex>
#include <string_view>
#include <map>

using std::string;
using std::multimap;
using std::string_view;

namespace mimicry {
	struct Http_form_data_s {
		bool isFile = false;	//是否为文件，否的话fileName和fileType是无效的
		//注意：fileName可能会包含./ ../等路径信息，此时可能会有一些危险的操作，建议截取最后一个/之后的文件名或自行命名
		std::string fileName;
		std::string fileName_CharEncoding;
		//有时可能文件名会乱码，因此请求中会有指定编码的文件名，对应字段 fileName*
		std::string fileName_;
		std::string fileType;
		std::string value;
	};

std::multimap<std::string, mimicry::Http_form_data_s>
read_form_data(const std::string& in_bound, const std::string& in_data) {
	std::multimap<std::string, mimicry::Http_form_data_s> remap;
	string_view view{ in_data };
	std::regex reg_name{"\\r\\nContent-Disposition:\\s*form-data;\\s*name=\"(.*)\"(?:\\s*;\\s*filename=\"(.*)\"(?:\\s*;\\s*filename\\*=(.*)''(.*))?\\r\\nContent-Type:\\s*(.*))?\\r\\n\\r\\n"};
	string find_bound = "--" + in_bound;
	mimicry::Http_form_data_s data;
	size_t pos = 0, pos_2 = 0;
	if ((pos = view.find(find_bound)) != string::npos) {
		pos += find_bound.size();
		for (;(pos_2 = view.find(find_bound, pos)) != string::npos;) {
			string_view block = view.substr(pos, pos_2 - pos);	//截取两个bound之间的内容
			std::match_results<string_view::const_iterator> block_match_view;
			if (std::regex_search(block.begin(), block.end(), block_match_view, reg_name)) {	//匹配 name 和可能存在的 filename
				data.fileName = block_match_view.str(2);
				data.fileName_CharEncoding = block_match_view.str(3);
				data.fileName_ = block_match_view.str(4);
				data.fileType = block_match_view.str(5);
				data.isFile = data.fileName.size() > 0;
				const char* str_p = &(* (block_match_view[0].second));
				size_t len = block.end() - 2 - block_match_view[0].second;
				//const string_view var_view = string_view{ block_match_view[0].second, block.end() - 2 };
				data.value = string(str_p, len);
				remap.insert({ block_match_view.str(1), data });
			}
			pos = pos_2 + find_bound.size();
		}
	}
	return remap;
}
};
```

* * *

## 其他

### boundary的来历

- boundary是浏览器（或者说是客户端）随机生成的，可能你会想它会不会和我要传输的字符串刚好重复而导致解析出问题呢？其实还是有可能的，但概率相当小。

- 由于想找出和数据不重复的字串的成本很高，如果数据才几KB那当然可以写程序循环随机生成，然后匹配查找是否重复。但如果上传的文件几百MB甚至上GB呢，此时字符串匹配的速度足以让用户炸毛，因此浏览器一般都是尽力随机生成，但不保证一定不会和数据重复。

### form-data和Birnary的选择

- 上传文件的话显然是能选Birnary就不用form-data，因为form-data需要解析。

- 如果只上传一个文件，就选Birnay，并使用url参数之类的各种手段带上文件名等信息。
