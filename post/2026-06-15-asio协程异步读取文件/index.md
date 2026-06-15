---
title: "asio协程异步读取文件"
date: "2026-06-15"
tags: 
  - "c++"
  - "asio"
  - "asio::stream_file"
  - "asio::async_read"
  - "asio::async_read_until"
---
# 前言
- c++20 用 asio 协程异步读取文件整体还算简单，就是网上文档太少了，还得翻 asio 源码试着搞，这里记录一些示例代码
- asio 有独立版和 boost 版本，两者的宏开关名称不一样，示例大多会给出两份

## 编译
- linux 下 asio 异步读取文件使用的是 io_uring，因此需要依赖 [liburing](https://github.com/axboe/liburing) `https://github.com/axboe/liburing`
  - 然后添加宏定义启用 io_uring, CMakeLists.txt 中示例:
  ```cmake
  add_definitions(-DASIO_HAS_IO_URING=ON)
  add_definitions(-DBOOST_ASIO_HAS_IO_URING=ON)
  add_definitions(-DASIO_HAS_IO_URING_AS_DEFAULT=ON)
  add_definitions(-DBOOST_ASIO_HAS_IO_URING_AS_DEFAULT=ON)
  ```
- windows 一般不需要操作，asio 检测的宏是, 默认会启用的:
  ```cmake
  add_definitions(-DASIO_HAS_IOCP=ON)
  add_definitions(-DBOOST_ASIO_HAS_IOCP=ON)
  add_definitions(-DASIO_HAS_WINDOWS_RANDOM_ACCESS_HANDLE=ON)
  add_definitions(-DBOOST_ASIO_HAS_WINDOWS_RANDOM_ACCESS_HANDLE=ON)
  ```

## 使用
- 如果 asio 支持文件读写，会自动定义宏 `ASIO_HAS_FILE`, 因此可以在代码中判断

### 读取完整文件
- `asio::this_coro::executor` 获取当前协程的 ioctx
- `asio::dynamic_buffer` 自动动态扩展 buffer
- `asio::transfer_all` 当读取到文件末尾函数才返回
```c++
#include "asio/read.hpp"
#include "asio/registered_buffer.hpp"
#include "asio/stream_file.hpp"

#if defined(ASIO_HAS_FILE)
asio::awaitable<std::string> readFile(const std::string &filepath) {
  // 如果没有 io_context，使用这个获取当前协程的 ioctx
  auto currentIoCtx = co_await asio::this_coro::executor;
  asio::stream_file stream{currentIoCtx};

  try {
    asio::error_code errCode;
    stream.open(filepath, asio::stream_file::read_only, errCode);
    if (false == stream.is_open()) {
      stream.close();
      throw std::runtime_error{
          fmt::format(R"(Can not open file: {}")", errCode.message())};
    }

    // 读取完整文件
    std::string data;
    co_await asio::async_read(
        stream, asio::dynamic_buffer(data), asio::transfer_all(),
        asio::redirect_error(asio::use_awaitable, errCode));
    if (errCode && errCode != asio::error::eof) {
      throw asio::system_error{errCode};
    }
    stream.close();
    co_return data;
  } catch (const std::exception &e) {
    stream.close();
    throw e;
  }
}
#endif
```

### 按行读取
```c++
#include "asio/read.hpp"
#include "asio/read_until.hpp"
#include "asio/registered_buffer.hpp"
#include "asio/stream_file.hpp"

#if defined(ASIO_HAS_FILE)
asio::awaitable<std::string> readFileLines(const std::string &filepath) {
  // 如果没有 io_context，使用这个获取当前协程的 ioctx
  auto currentIoCtx = co_await asio::this_coro::executor;
  asio::stream_file stream{currentIoCtx};

  try {
    asio::error_code errCode;
    stream.open(filepath, asio::stream_file::read_only, errCode);
    if (false == stream.is_open()) {
      stream.close();
      throw std::runtime_error{
          fmt::format(R"(Can not open file: {}")", errCode.message())};
    }

    /// [offset] 从第 offset 行开始读取
    /// [limit] 限制读取行数
    size_t offset = 0, limit = 100, lineNum = 0;
    std::stringstream result{};

    for (std::string buf; lineNum < offset + limit; lineNum++) {
      auto readlen = co_await asio::async_read_until(
          stream, asio::dynamic_buffer(buf), '\n',
          asio::redirect_error(asio::use_awaitable, errCode));

      if (errCode == asio::error::eof) {
        if (lineNum >= offset) {
          result << buf;
        }
        break;
      } else if (errCode) {
        throw asio::system_error{errCode};
      }

      if (lineNum >= offset) {
        // 此时 [buf] 可能还缓冲包含了这一行之后的内容，因此需要截断
        auto line = std::string_view{buf}.substr(0, readlen);
        result << line;
      }

      buf.erase(0, readlen);
    }

    stream.close();
    if (lineNum <= offset) {
      // offset 超出文件行数
      throw std::runtime_error{fmt::format(
          R"(Arg `line_offset`({} lines) is out of range of file lines({} lines).)",
          offset, lineNum)};
    }

    co_return result.str();
  } catch (const std::exception &e) {
    stream.close();
    throw e;
  }
}
#endif
```

### 按字节偏移读取
```c++
#include "asio/random_access_file.hpp"
#include "asio/read.hpp"
#include "asio/read_at.hpp"
#include "asio/read_until.hpp"
#include "asio/registered_buffer.hpp"
#include "asio/stream_file.hpp"

#if defined(ASIO_HAS_FILE)
asio::awaitable<std::string> readFileBytes(const std::string &filepath) {
  // 如果没有 io_context，使用这个获取当前协程的 ioctx
  auto currentIoCtx = co_await asio::this_coro::executor;
  asio::random_access_file stream{currentIoCtx};

  try {
    asio::error_code errCode;
    stream.open(filepath, asio::random_access_file::read_only, errCode);
    if (false == stream.is_open()) {
      stream.close();
      throw std::runtime_error{
          fmt::format(R"(Can not open file: {}")", errCode.message())};
    }
    size_t offset = 0, limit = 100;

    auto fileSize = stream.size();
    auto bytesAvailable =
        std::max((long long)fileSize - (long long)offset, (long long)0);
    auto bytesRead =
        std::min(static_cast<std::streamsize>(limit),
                  static_cast<std::streamsize>(bytesAvailable));

    // 没有数据可读
    if (bytesRead <= 0) {
      throw std::runtime_error{fmt::format(
          R"(Arg `byte_offset`({}) is out of range of file size({}).)",
          offset, (size_t)fileSize)};
    }

    std::string result;
    auto bytesReadLen = co_await asio::async_read_at(
        stream, byte_offset, asio::buffer(result, bytesRead),
        asio::redirect_error(asio::use_awaitable, errCode));
    if (errCode && errCode != asio::error::eof) {
      throw asio::system_error{errCode};
    }
    stream.close();
    co_return result.substr(0, bytesReadLen);
  } catch (const std::exception &e) {
    stream.close();
    throw e;
  }
}
#endif
```

### 写入文件
```c++
#include "asio/random_access_file.hpp"
#include "asio/read.hpp"
#include "asio/read_at.hpp"
#include "asio/read_until.hpp"
#include "asio/registered_buffer.hpp"
#include "asio/stream_file.hpp"

#if defined(ASIO_HAS_FILE)
asio::awaitable<bool> writeFileBytes(const std::string &filepath, const std::string &content) {
  // 如果没有 io_context，使用这个获取当前协程的 ioctx
  auto currentIoCtx = co_await asio::this_coro::executor;
  asio::stream_file stream{currentIoCtx};

  try {
    asio::error_code errCode;
    /// [truncate] 覆盖写入
    stream.open(filepath,
                asio::stream_file::write_only | asio::stream_file::create |
                    asio::stream_file::truncate,
                errCode);
    if (false == stream.is_open()) {
      stream.close();
      throw std::runtime_error{
          fmt::format(R"(Can not open file: {}")", errCode.message())};
    }
    co_await asio::async_write(
        stream, asio::buffer(content),
        asio::redirect_error(asio::use_awaitable, errCode));
    stream.close();
    co_return true;
  } catch (const std::exception &e) {
    stream.close();
    throw e;
  }
}
#endif
```