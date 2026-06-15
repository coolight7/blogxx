---
title: "cmake隔离FetchContent编译变量"
date: "2026-06-15"
tags: 
  - "c++"
  - "cmake"
  - "CMakeLists.txt"
  - "FetchContent"
  - "FetchContent_Declare"
---
# 前言
- CMakeLists.txt 的 `FetchContent_Declare` 导入依赖库时，有时需要定义编译变量，但又怕变量影响整个项目，则可以用 `block()` 隔离:
```cmake
FetchContent_Declare(
  fmt
  SOURCE_DIR "${CMAKE_CURRENT_SOURCE_DIR}/third_party/fmt/"
)
block()
  set(FMT_PEDANTIC          OFF)
  set(FMT_INSTALL           OFF)
  set(FMT_WERROR            OFF)
  set(BUILD_SHARED_LIBS     OFF)
  set(BUILD_STATIC_LIBS     ON )
  set(FMT_DOC               OFF)
  set(FMT_TEST              OFF)
  FetchContent_MakeAvailable(fmt)
endblock()
```