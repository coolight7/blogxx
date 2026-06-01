---
title: "《拟声/流明》极限压缩裁剪ffmpeg+libmpv"
date: "2025-11-07"
tags: 
  - "ffmpeg"
  - "libmpv"
  - "mpv"
  - "编译"
  - "裁剪"
  - "压缩体积"
---
# 前言
- `拟声`和`流明AI`的开发都非常依赖 `ffmpeg` 和 `libmpv` 提供音视频播放、编解码，程序安装包的体积大头也是这俩
- 另外我们开发
- `libmpv`和`ffmpeg`的体积都不小，常规的编译时减少功能开关比较简单直接，本文就不说了，毕竟是需要牺牲功能为代价的
- 这里我们主要探究怎么在不修剪功能的情况下大幅缩减动态库体积，注意本文主要提供思路，并非手把手操作

## 思路

### strip 裁剪调试符号
- 可能很多人没注意，编译出来的动态库由于编译参数的设置，可能附带了debug调试信息，这个对体积影响非常大
- 另外从 安卓的NDK 复制出来的 c++标准库 libc++_shared.so 也是附带调试信息的，裁剪可以从 `9MB` 缩减到 `1.3MB`，可见体积占比之大，将近八九成
- 可以使用 strip 命令裁剪生成后的动态库，但如果是交叉编译，应当使用编译工具链里提供的 `strip` 或 `llvm-strip` 类似名称的命令进行裁剪，用法基本相同：
```sh
strip libmpv.so

llvm-strip libc++_shared.so

llvm-strip avfilter.dll
```
- 这样简单的一句命令就会裁剪 `libmpv.so`，去掉调试信息，不影响功能运行，裁剪后会覆盖回源文件，可以先 `ls -lh`，然后执行裁剪，最后再 `ls -lh` 查看体积变化

### 标准库链接方式
- ffmpeg 和 libmpv 编译出来一共得有 8 个动态库，如果静态链接了 c++标准库，相当于每一个 动态库 里都包含了一份裁剪过的标准库，会有很多的重复
- 因此可以考虑动态链接 c++标准库，另外无论从体积、运行稳定性考虑，都建议动态链接标准库，尤其`混合动态、静态链接标准库是非常危险的！！！`静态链接标准库后，每一个动态库里都有自己的一套 new/delete 也就是内存分配，跨动态库可以共享读写内存数据，但跨动态库分配、释放内存必定崩溃，有些全局锁、全局状态变量的判断可能也会出问题，因此建议动态链接优先
- 安卓提供了多个c++标准库实现`libstdc++.so`和`libc++_shared.so`，在安卓推荐链接 `libc++_shared.so`，有些库可能会添加 ld_flags 链接`libstdc++.so`，可以查看生成的动态库有没有依赖它 `readelf -d libmpv.so`，如果有的话可以编译动态库前，在pkgconfig的pc文件夹里把所有链接 c++ 标准库的flag都去掉：
  - 然后编译动态库时手动指定 `LDFLAGS="-nostdlib++ -lc++_shared -lc++abi"`，也就是禁用默认的c++标准库，手动指定链接 libc++_shared.so
```sh
cd ${install-prefix}/lib/pkgconfig

sed -i '/^Libs:/ s|-lstdc++| |' $prefix_dir/lib/pkgconfig/*.pc
sed -i '/^Libs:/ s|-lc++_static| |' $prefix_dir/lib/pkgconfig/*.pc
sed -i '/^Libs:/ s|-lc++abi| |' $prefix_dir/lib/pkgconfig/*.pc
sed -i '/^Libs:/ s|-lc++_shared| |' $prefix_dir/lib/pkgconfig/*.pc
sed -i '/^Libs:/ s|-lc++| |' $prefix_dir/lib/pkgconfig/*.pc
```
- 动态链接标准库后，打包时记得附带c++标准库动态库

### ffmpeg、ffprobe、libmpv 共享动态库
- ffmpeg和ffporbe都是依赖于 libavxx+libswxx 的，有些编译可执行程序时，直接静态链接进去，所以可以直接用 ffmpeg.exe 执行，不需要附带动态库，但这也导致他们的 exe 体积很大，往往几十MB，如果动态链接，主程序 exe 体积基本就几百kb，如果你的程序包含了 ffmpeg.exe 和 ffprobe.exe ，改为动态链接可以大幅减少体积，让他们俩共用动态库
- libmpv 也是同理，它同样依赖 libavxx+libswxx，同样可以静态链接后只生成一个 libmpv.dll，改为动态链接，可以让 `ffmpeg.exe`、`ffprobe.exe`、`libmpv.dll` 共用 `libav`
- 我们在这样操作后，《流明》的安装包体积从 140 MB 一下子干到了 50MB

### 合并编译
- ffmpeg 正常编译出来动态库有好7个，分为 libavxx 和 libswxx，再加上一个 libmpv，以及我们开发的 libmediaxx，一共是 9 个
- 这9个动态库里其实有一部分代码是一样的，比如：
  - libmpv 和 ffmpeg 有一些依赖库相同，但编译生成 ffmpeg 动态库时没有导出这些符号，导致编译 libmpv 时还需要再包含这些依赖库代码，因此他们会有部分相同代码
  - 前面提到的静态链接标准库时，会有很多重复
- 在缩减《拟声》体积时，首先尝试的其实就是合并编译，首先是尝试合并 ffmpeg 的多个动态库，合并成 1 个
  - 假设名称为 `libffmpeg.so`，编译ffmpeg后install时会生成 libavfilter.pc、libavcodec.pc 等 pc 文件，这些是pkgconfig用于查找依赖库的文件，里面描述了这个库的版本、include路径、如何链接等，通过修改这些文件，就可以在不修改 ffmpeg 源码的情况下合并成一个动态库

### 动态库导出符号共享和限制

## 效果
- `strip 裁剪调试符号`，这个影响很大，也是应该做的，基本对于 release 发布一本万利，简单省事高收益
- `动态链接 标准库`，动态库越多，从静态链接标准库改为动态链接的收益就越大，而且我认为对运行时性能也是有收益的，尽管对于单个库一般静态链接性能略高，但多个库包含了相同代码，内存分配器有多份、各种全局变量也有多份，需要多次初始化
- `合并编译`和`共享导出符号`其实做其一收益较大，一起搞的话在我们缩减拟声体积的探索中，基本就是做了其中一个，压缩了好几MB，做另一个时只能再减少几百kb，原因在于`共享导出符号`和`合并编译`的本质比较类似，都是复用代码，减少相同依赖库代码被重复编译进多个动态库，因此变化不大
- `限制导出符号`有时会有奇效，比如某些函数是动态库内用不到的，但还是导出了，它认为可能用户有需要，但如果你也不需要，明确不导出它之后，链接器就可以判断出这是个没用的代码，因此可以把它删减掉。如果对你的程序和依赖库代码不够熟悉，不建议折腾这个，很多跨编程语言调用动态库的会在运行时才加载并查找动态库里的符号使用，因此限制导出符号后仍然能编译成功，但运行时就会找不到所需符号而崩溃或功能失效。在拟声的探索中，只导出了libmpv的符号，但也只是缩减了几百kb，影响不大，说明动态库内部编译时基本已经裁剪掉绝大部分无用代码了

## `拟声`安装包体积变化
- windows端 一开始 63MB
  - 50MB: 编译选项删减功能/添加硬件加速和解码/ffmpeg.exe 与 ffprobe.exe 共用动态库
  - 45MB: 移除ffmpeg.exe/ffprobe.exe 替换为libmediaxx, ffmpeg/libmpv 共用动态库
  - 42MB: 合并ffmpeg+libmpv+libmediaxx, 限制动态库导出符号
- 实际上动态库体积变化明显特别多，拟声的windows端安装包由于使用了最高压缩级别，压缩率特别猛
- 安卓端由于apk的压缩远不如拟声win端使用的lzma2，我们探索了很多歪路：
  - 一开始使用的是 `ffmpeg-kit`，如果 libmpv 和 ffmpeg-kit 共用动态库，会导致日志冲突，双方都容易出问题，此时我们尝试过复制一份，然后更改动态库的SONAME，让它看起来是不同的库，实际上两个文件非常相似，我们期望打包apk时，压缩会像一个文件一样，但现实泼了一盆冷水，apk应该是用的zip压缩，并没有跨文件进行压缩，因此安装包体积大幅增加...
  - 趁着 ffmpeg-kit 宣布停止维护，干脆彻底放弃它，重新开发了 libmediaxx 直接链接 ffmpeg 实现功能，去掉了 ffmpeg-kit 之后感觉一身轻，共用动态库的问题解决了，而且直接调用 ffmpeg 内的函数实现功能，性能和可控性也大幅提升，体积随之缩减
  - 尝试了仅合并ffmpeg+libmediaxx，为libmpv导出符号共享等各种操作后，最终合并了 ffmpeg+libmpv+libmediaxx，体积再次缩减， 40MB -> 33MB