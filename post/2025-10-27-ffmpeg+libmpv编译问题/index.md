---
title: "ffmpeg+libmpv编译问题"
date: "2025-10-27"
tags: 
  - "ffmpeg"
  - "libmpv"
  - "mpv"
  - "编译"
---
# 前言
- `libmpv`依赖`ffmpeg`，而且他们俩的依赖库很多，最近给`安卓`、`windows`编译动态库时踩了很多坑，感觉记录够写3篇了

## 常见问题

### ERROR: xxx requested but not found 找不到xx依赖库
- 可能是真没有这个库，也可能是 configure 尝试使用依赖库编译测试程序时失败
- vim 查看 `build/ffbuild/config.log`，先跳转末尾，然后搜索对应库名称、error等字样，看看错误是什么。可能是 cpu平台不正确、符号缺失、缺少 include搜索目录或链接搜索目录、缺少指定链接库名称等原因

### ffmpeg编译，找不到`stdbit.h`:
- 如果附近错误提示：
```sh
fatal error: 'stdbit.h' file not found
```
- 目前看来这一行不是关键错误！日志往上找找是否有其他错误。我是 `configure --enable-vulkan` 后报错 `ERROR: vulkan requested but not found`，附近出现这个错误，但其实根源错误是更早的日志中提到
- 我这边是指定 `configure --enable-vulkan` 时才会出现，看了下 `configure` 的内容，它有一步检查`stdbit.h`的编译测试，大约7994行附近，可以代码文件内搜索跳转查看：
```sh
check_builtin stdbit "stdbit.h assert.h" \
    'static_assert(__STDC_VERSION_STDBIT_H__ >= 202311L, "Compiler lacks stdbit.h")' || \
    add_cppflags '-I\$(SRC_PATH)/compat/stdbit'
```
- 其实就是测试编译器是否有 stdbit.h，百度搜是说 c23 以上会有这个，但指定了 `std=c23` 后仍然不行，不过即使缺失，ffmpeg也有自带这个头文件(ffmpeg/compat/stdbit/stdbit.h)，所以这个错误提示可以忽略

### 报错：`ERROR: vulkan requested but not found`
- 指定了 `configure --enable-vulkan` 但没有找到 vulkan 的库，或是测试编译vulkan是否可用时失败就会提示这个，如果解决不了去掉 `--enable-vulkan` 即可
- 前面提到，如果出现`fatal error: 'stdbit.h' file not found`一般都不是根源问题，ffmpeg自己有解决
- vim 查看 `build/ffbuild/config.log`，先跳转末尾，然后搜索 vulkan，看看错误是什么
- 如果是找不到 libvulkan.a，就得看看vulkan是否编译成功、库是否存在、是否有 pkg-config `vulkan.pc`，如果找到了库也可以手动指定链接库搜索路径 `configure --extra-cflags='-L/path/to/lib/dir/'`
- 编译windows x86_64 ffmpeg时，下面这个错误是找不到`pthread`、`CM_xxx`符号，可以配置 ffmepg 时手动指定这些库：`configure --extra-libs='-lshlwapi -lpthread -lcfgmgr32'`
```sh
x86_64-w64-mingw32-clang -Wl,--nxcompat,--dynamicbase -Wl,--high-entropy-va -Wl,--as-needed -Wl,--pic-executable,-e,mainCRTStartup -Wl,--image-base,0x140000000 -o /tmp/ffconf.NABXpGU1/test.exe /tmp/ffconf.NABXpGU1/test.o -lvulkan -lc++
ld.lld: error: undefined symbol: pthread_once
>>> referenced by libvulkan.a(trampoline.c.obj):(vkEnumerateInstanceExtensionProperties) >>> referenced by libvulkan.a(trampoline.c.obj):(vkEnumerateInstanceLayerProperties) >>> referenced by libvulkan.a(trampoline.c.obj):(vkEnumerateInstanceVersion) >>> referenced 2 more times
ld.lld: error: undefined symbol: __declspec(dllimport) CM_Open_DevNode_Key >>> referenced by libvulkan.a(loader_windows.c.obj):(windows_get_device_registry_entry)
ld.lld: error: undefined symbol: __declspec(dllimport) CM_Get_Device_ID_List_SizeW >>> referenced by libvulkan.a(loader_windows.c.obj):(windows_get_device_registry_files)
ld.lld: error: undefined symbol: __declspec(dllimport) CM_Get_Device_ID_ListW >>> referenced by libvulkan.a(loader_windows.c.obj):(windows_get_device_registry_files)
ld.lld: error: undefined symbol: __declspec(dllimport) CM_Locate_DevNodeW >>> referenced by libvulkan.a(loader_windows.c.obj):(windows_get_device_registry_files)
ld.lld: error: undefined symbol: __declspec(dllimport) CM_Get_DevNode_Status >>> referenced by libvulkan.a(loader_windows.c.obj):(windows_get_device_registry_files)
ld.lld: error: undefined symbol: __declspec(dllimport) CM_Get_Child >>> referenced by libvulkan.a(loader_windows.c.obj):(windows_get_device_registry_files)
ld.lld: error: undefined symbol: __declspec(dllimport) CM_Get_Sibling >>> referenced by libvulkan.a(loader_windows.c.obj):(windows_get_device_registry_files)
ld.lld: error: undefined symbol: __declspec(dllimport) CM_Get_Device_IDW
>>> referenced by libvulkan.a(loader_windows.c.obj):(windows_get_device_registry_files)
ld.lld: error: undefined symbol: __declspec(dllimport) CM_Get_DevNode_Registry_PropertyW
>>> referenced by libvulkan.a(loader_windows.c.obj):(windows_get_device_registry_files)
clang: error: linker command failed with exit code 1 (use -v to see invocation)
```

### 交叉编译安卓动态库时报错，c++标准库链接选择，libc++.so、libstdc++.so、libc++_shared.so
- ndk内包含多个不同的c++标准库实现：
  - libstdc++.so，比较老，功能少
  - libc++_shared.so，clang提供的新标准库实现，好使推荐链接，但如果链接它，需要打包apk时也它，否则会报错找不到动态库，系统没有提供这个
  - libc++_static.a，同上，静态库版本，编译动态库时，链接静态版本的标准库则会把代码嵌入你的动态库，因此打包apk不需要再附带这个文件了，但会增大单个动态库的体积，因为用到的标准库代码嵌入了你的动态库里
  - libc++.so，这是个链接而已，映射上面的 `libc++_shared.so` 和 `libc++_static.a`
- 包含多个动态库的程序最好统一，否则可能出现运行时内存释放异常，因为不同动态库包含不同的c++实现的话，分配、释放内存可能由不同的代码段管理，在动态库之间传递包含自动管理堆内存指针的变量时可能出现由不同堆分配的内存被另一个堆释放，导致崩溃闪退。
  - 避免的办法要么统一静态链接或动态链接c++标准库，要么动态库之间的调用接口不导出c++函数，而是c函数格式，`extend "C"`，也就避免了自动内存释放
  - 如果你的程序只有一个或很少动态库依赖c++标准库，推荐静态链接，打包省事且会裁剪标准库，只引入用到的代码，静态链接也比动态链接性能略高
  - 如果你的程序有多个动态库依赖c++标准库，推荐动态链接 `libc++_shared.so`，他们可以共享代码，减少体积
  - 我就俩，更喜欢静态链接，拷贝个 libc++_shared.so 得7mb呢
- 配置链接参数，动态链接c++标准库，这里的意思就是先禁用链接默认的c++标准库，然后手动指定要使用的库名称：
```sh
LD_FLAGS="-nostdlib++ -lc++_shared -lc++abi"
```
- 配置链接参数，静态链接c++标准库：
```sh
LD_FLAGS="-nostdlib++ -lc++_static -lc++abi"
```
- 有些最终额外的链接 c++标准库参数可能是依赖库通过 pkg-config 带过来的，比如 ffmpeg/libmpv 依赖的 `shaderc`、`libjxl`、`libplacebo` 等库的 pkg-config 内就带有 `-lc++`
- 可以在编译并install之后修改他们生成的 pkg-config 文件 xxx.pc，比如这里是在编译install 之后，用 sed 匹配修改 libplacebo.pc 等文件：
```sh
sed '/^Libs:/ s|$| -lc++_static -lc++abi|' "$prefix_dir/lib/pkgconfig/libplacebo.pc" -i

sed -i '/^Libs: -L${libdir} -ljxl / s|-lc++|-lc++_static -lc++abi|' "$prefix_dir/lib/pkgconfig/libjxl.pc"
sed -i '/^Libs.private:/ s|-lc++|-lc++_static -lc++abi|' "$prefix_dir/lib/pkgconfig/libjxl_cms.pc"
sed '/^Libs.private:/ s|$| -lc++_static -lc++abi|' "$prefix_dir/lib/pkgconfig/libjxl_threads.pc" -i
```
- 有时可能会重复链接了 `libstdc++.so` 和 `libc++_static.a`，在静态链接后可以 readelf 查看一下动态库依赖：
```sh
readelf -d libmediaxx.so

Dynamic section at offset 0x181c824 contains 30 entries:
  Tag        Type                         Name/Value
 0x00000001 (NEEDED)                     Shared library: [libm.so]
 0x00000001 (NEEDED)                     Shared library: [libandroid.so]
 0x00000001 (NEEDED)                     Shared library: [libmediandk.so]
 0x00000001 (NEEDED)                     Shared library: [libdl.so]
 0x00000001 (NEEDED)                     Shared library: [libstdc++.so]
 0x00000001 (NEEDED)                     Shared library: [libc.so]
 0x0000000e (SONAME)                     Library soname: [libmediaxx.so]
 0x0000001e (FLAGS)                      SYMBOLIC BIND_NOW
 0x6ffffffb (FLAGS_1)                    Flags: NOW
 0x00000011 (REL)                        0x1084ec
 0x00000012 (RELSZ)                      408056 (bytes)
 0x00000013 (RELENT)                     8 (bytes)
 0x6ffffffa (RELCOUNT)                   50969
 0x00000017 (JMPREL)                     0x1772bc
 0x00000002 (PLTRELSZ)                   2768 (bytes)
 0x00000003 (PLTGOT)                     0x1823e5c
 0x00000014 (PLTREL)                     REL
 0x00000006 (SYMTAB)                     0x1ec
 0x0000000b (SYMENT)                     16 (bytes)
 0x00000005 (STRTAB)                     0x7e6b4
 0x0000000a (STRSZ)                      564791 (bytes)
 0x6ffffef5 (GNU_HASH)                   0x5d0b4
 0x00000019 (INIT_ARRAY)                 0x1820818
 0x0000001b (INIT_ARRAYSZ)               12 (bytes)
 0x0000001a (FINI_ARRAY)                 0x1820810
 0x0000001c (FINI_ARRAYSZ)               8 (bytes)
 0x6ffffff0 (VERSYM)                     0x52b1c
 0x6ffffffe (VERNEED)                    0x5d044
 0x6fffffff (VERNEEDNUM)                 3
 0x00000000 (NULL)                       0x0
```
- 这可能是依赖库的 pkgconfig 引入的链接参数，可以在 .pc 文件目录查找一下：
```sh
$ cd xxx/lib/pkgconfig/
$ grep "stdc++" *.pc

uchardet.pc:Libs.private: -lstdc++
zimg.pc:# If building a static library against a C++ runtime other than libstdc++,
zimg.pc:Libs.private: -lstdc++
```
- 可以看到我这里还有 uchardet 和 zimg 得改一下
```sh
sed -i '/^Libs.private:/ s|-lstdc++|-lc++_static -lc++abi|' "uchardet.pc"
sed -i '/^Libs.private:/ s|-lstdc++|-lc++_static -lc++abi|' "zimg.pc"
```

### 交叉编译安卓库时，CMAKE_ANDROID_ARCH_ABI 不生效，需要使用 ANDROID_ABI
- cmake 交叉编译时，指定了 CMAKE_TOOLCHAIN_FILE、CMAKE_ANDROID_ARCH_ABI、ANDROID_PLATFORM 后仍然不好使，报错：`ld.lld: error: xx/simdjson_repo-build/libsimdjson.a(simdjson.cpp.o) is incompatible with armelf_linux_eabi`
- 原因暂时未知，看了生成的 CMakeCaches.txt，里面的 `CAMKE_C_LIBRARY_ARCHITECTURE` 没有根据

### 交叉编译安卓ffmpeg静态库后，编写动态库链接ffmpeg静态库时报错，需要-fPIC
- 报错内容：
```sh
relocation R_AARCH64_ADR_PREL_PG_HI21 against symbol may bind externally can not be used when making a shared object; recompile with -fPIC
```
- 但ffmpeg编译时已经 `--enable-pic`，cflags中也指定了 `-fPIC`，查了很久终于发现 ffmpeg 文档中写到，需要在你的动态库中添加 `LD_FLAGS='-Wl,-Bsymbolic'`，如果还是不行，就尝试禁用 ffmpeg 的 汇编asm，[相关文档](https://ffmpeg.org/platform.html#Advanced-linking-configuration)
- 知道原因就简单了，在 CmakeLists.txt 中可以添加到 `CMAKE_SHARED_LINKER_FLAGS`
```cmake
# static link to ffmpeg.a
set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,-Bsymbolic")
```

### 交叉编译安卓ffmpeg8.0时报错：error: an attribute list cannot appear here
- 很多处报同样的错误，但看了下 ffmpeg7.1.2 同个地方的代码是一样的，应该是宏变化了或者没导入展开替换等问题吧
- 由于windows版可以正常编译，所以干脆更新了ndk从原本27到29（29.0.14206865），就正常了，[ndk下载](https://developer.android.google.cn/ndk/downloads/?hl=zh-cn)：
- 
```sh
| src/libavfilter/ebur128.c:103:8: error: an attribute list cannot appear here
|   103 | static DECLARE_ALIGNED(32, double, histogram_energies)[1000];
|       |        ^~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
```

### 交叉编译安卓ffmpeg8.0启用 vulkan 时报错vulkan版本不匹配
- windows版是直接下载最新的vulkan-header，并编译vulkan、静态链接成功了
- ndk中包含 vulkan.so 和 头文件，但内置的vulkan版本比较老，可以从 [vulkan-header-github](https://github.com/KhronosGroup/Vulkan-Headers.git) 下载最新的。按理头文件应该和待支持设备对应，不然可能崩溃，但根据 ndk 的 [issue#2016](https://github.com/android/ndk/issues/2016) 提到，更新 header 并不影响功能支持？可能是只影响编译，功能是否可用仍需看运行时设备支持？`TODO 待定...`

### 交叉编译安卓ffmpeg8.0启用 vulkan 时报错：incompatible function pointer types initializing 'PFN_vkDebugUtilsMessengerCallbackEXT'
- `incompatible function pointer types initializing 'PFN_vkDebugUtilsMessengerCallbackEXT' ... [-Wincompatible-function-pointer-types]`
- `-Wincompatible-function-pointer-types`就是启用了严格函数指针类型检查，报错信息也就是说函数指针类型不兼容，但看了源码对应位置我认为是ok的，所以直接关掉这个严格检查，在 cflags 添加：
```
./configure --extra-cflags="-Wno-error=incompatible-function-pointer-types"
```

### 安卓 ffmpeg+libmpv启用 vulkan 后运行时报错，找不到 vk_xxx 符号
- 主要是老机型 安卓8.1 的魅族报的错，待研究，退回禁用 vulkan

### clang 崩溃
- 报错如下，一般啥也不用动，重新编译就可以了，如果是内存不足则限制 job：
```sh
PLEASE submit a bug report to https://github.com/llvm/llvm-project/issues/ and include the crash backtrace, preprocessed source, and associated run script.
Stack dump:
0.      Program arguments: /home/coolight/program/media/mpv-winbuild-cmake/clang_root/bin/clang++ -march=x86-64 -mtune=generic -Isrc/libharfbuzz-subset.a.p -Isrc -I../../../../../src_packages_mpv/harfbuzz/src -I. -I../../../../../src_packages_mpv/harfbuzz -fdiagnostics-color=always -D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_FAST -D_FILE_OFFSET_BITS=64 -Wall -Winvalid-pch -fno-exceptions -std=c++11 -O3 -fno-exceptions -fno-rtti -fno-threadsafe-statics -fvisibility-inlines-hidden -Wa,-mbig-obj -DHAVE_CONFIG_H -MD -MQ src/libharfbuzz-subset.a.p/hb-subset-table-other.cc.obj -MF src/libharfbuzz-subset.a.p/hb-subset-table-other.cc.obj.d -o src/libharfbuzz-subset.a.p/hb-subset-table-other.cc.obj -c ../../../../../src_packages_mpv/harfbuzz/src/hb-subset-table-other.cc -target x86_64-pc-windows-gnu --driver-mode=g++ -pthread --sysroot /home/coolight/program/media/mpv-winbuild-cmake/build_x86_64/x86_64-w64-mingw32 -fuse-ld=lld --ld-path=x86_64-w64-mingw32-ld -Wno-unused-command-line-argument -gcodeview -fdata-sections -ffunction-sections
1.      <eof> parser at end of file
2.      Optimizer
3.      Running pass "declare-to-assign" on module "../../../../../src_packages_mpv/harfbuzz/src/hb-subset-table-other.cc"
#0 0x0000647ccde0fe6e (/home/coolight/program/media/mpv-winbuild-cmake/clang_root/bin/clang+++0x86eae6e)
clang++: error: clang frontend command failed with exit code 139 (use -v to see invocation)
clang version 21.1.3 (https://github.com/llvm/llvm-project.git c5a3aa8934b032c5e171508756f3808debc3f7d3)
Target: x86_64-pc-windows-gnu
Thread model: posix
InstalledDir: /home/coolight/program/media/mpv-winbuild-cmake/clang_root/bin
clang++: note: diagnostic msg:
********************
```

### xz 编译时卡很久
- top 查看，如果是 `po4a` 在跑，kill -9 杀了应该就可以了，它是一个生成文档的