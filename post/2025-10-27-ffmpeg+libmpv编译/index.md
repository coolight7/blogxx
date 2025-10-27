---
title: "ffmpeg+libmpv编译、裁剪、添加依赖库"
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
### ffmpeg编译，找不到`stdbit.h`:
1. **如果附近错误提示：**
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
  - 其实就是测试编译器是否，百度搜是说 c23 以上会有这个，但指定了 `std=c23` 后仍然不行

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