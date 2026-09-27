---
title: "flutter运行时下载和加载shader"
date: "2026-09-26"
tags: 
  - "flutter"
  - "shader"
  - "plugin"
---

# 前言
- 如果需要支持 插件、动态加载高效渲染动效和主题，那本文应该能帮到你
- 在 `flutter 3.47` 开始，android/ios/win/macos/linux 五大系统平台都已经启用 impeller，另外还有实验性的 `package:flutter_gpu`。

## impeller 替换 skia
- skia 会在运行时编译着色器，容易引发卡顿，因此 flutter 特地从头做了 impeller 替换 skia，在编译打包 flutter 程序时，就对即将使用的 shader 进行编译，因此运行时就不再需要编译着色器，直接可用。

## flutter 加载着色器
- 一般的 flutter 程序开发时，我们需要将 shader 明确声明在 `pubspec.yaml` 内:
```yaml
flutter:
  # To add assets to your application, add an assets section, like this:
  shaders:
    - packages/thanos_snap_effect/shader/thanos_snap_effect.glsl
    - packages/thanos_snap_effect/shader/particle_transition.glsl
```
- 在编译flutter程序时，就会编译 glsl，并将它放到最终的 asset 里面，程序运行时通过 `FragmentProgram.fromAsset(shaderAsset)` 就可以加载了
- 然而这也只能加载编译后的 shader，并不能直接加载 `.glsl` 文件然后编译渲染；这是因为 impeller 不再支持运行时编译 shader，自然就无法在运行时直接加载 shader 了
- 不过还留了一条路，通过 flutter 内置绑定的 `package:flutter_gpu` 可以在运行时加载 `已编译` 的 shader。

## flutter_gpu
- 尽管目前官方声明 flutter_gpu 这个包仍然是实验性的，但实测下来挺好用的
- 通过这个包可以手动 `编译一段shader`，得到 `.shaderbundle` 文件，flutter 程序就可以运行时通过 `ShaderLibrary.fromBytes` 加载这个 `.shaderbundle` 并渲染
- 注意编译的 shader-bundle 是有版本区分的，比如 `flutter 3.41` 跟 `flutter 3.47` 编译出来的 shader bundle 版本号是不同的，因此也就不能混用

## 实践
- 实践探索来自我们开发的音视频播放器项目 [musicxx](https://github.com/coolight7/musicxx) 的 `插件框架`

### 添加 flutter_gpu 依赖
- 在 `pubspec.yaml` 中添加 `flutter_gpu`:
```yaml
dependencies:
  flutter:
    sdk: flutter
  flutter_gpu:   # <-- 添加
    sdk: flutter
```
- 在目标系统的文件夹声明启用, 比如 android 需要修改 `AndroidManifest.xml`:
```xml
<application
    ...
    >
    <!-- 启用 flutter gpu -->
    <meta-data android:name="io.flutter.embedding.android.EnableFlutterGPU" android:value="true" />
</application>
```
### 编写 shader
- bg.frag:
```frag
#version 460 core
uniform MusicxxRenderInfo {
  vec4 uParams;
  vec4 uEnv;
  vec4 uColor1;
  vec4 uColor2;
  vec4 uColor3;
  vec4 uColor4;
}
render_info;

layout(location = 0) out vec4 frag_color;

// 每格的像素边长（越小格子越密；1280 宽时大约 25 格）
const float kCellSize = 50.0;

// 稳定随机向量：同样的格子坐标永远得到同样的点
vec2 random2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}

// 晶格化采样坐标：返回最近随机点的所在位置（用画面比例表示）
vec2 crystallizeUV(vec2 uv) {
  vec2 cells = max(render_info.uParams.xy, vec2(1.0)) / kCellSize;
  vec2 scaled = uv * cells;
  vec2 base = floor(scaled);
  vec2 frac = fract(scaled);

  float minDist = 8.0;
  vec2 nearest = vec2(0.0);
  float timeOffset = render_info.uParams.z * render_info.uParams.w * 2.0;

  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = random2(base + neighbor);
      // 让随机点缓慢漂移（幅度小，看起来是"流动"而不是"跳动"）
      point = 0.5 + 0.4 * sin(timeOffset + 6.2831 * point);
      vec2 diff = neighbor + point - frac;
      float dist = dot(diff, diff);
      if (dist < minDist) {
        minDist = dist;
        nearest = base + neighbor + point;
      }
    }
  }
  return nearest / cells;
}

// 4 个绘制色按"左上-右上-左下-右下"四角双线性混合
vec3 blendColors(vec2 uv, float dim) {
  float xBlend = smoothstep(0.0, 1.0, clamp(uv.x, 0.0, 1.0));
  float yBlend = smoothstep(0.0, 1.0, clamp(uv.y, 0.0, 1.0));
  vec3 top = mix(render_info.uColor1.rgb, render_info.uColor2.rgb, xBlend);
  vec3 bottom = mix(render_info.uColor3.rgb, render_info.uColor4.rgb, xBlend);
  return mix(top, bottom, yBlend) * dim;
}

void main() {
  vec2 uv = gl_FragCoord.xy / max(render_info.uParams.xy, vec2(1.0));
  // 稍微放大再取格子，避免边缘那一圈格子被裁成半块
  vec2 centered = (uv - 0.5) * 1.1 + 0.5;
  vec2 crystal = crystallizeUV(centered);

  // 夜间压暗；用的是兜底色时降一点对比度
  float dim = render_info.uEnv.x > 0.5 ? 0.72 : 1.0;
  float valid = render_info.uEnv.y > 0.5 ? 1.0 : 0.88;
  vec3 color = blendColors(crystal, dim * valid);

  // 格子边缘加一层很淡的高光，让晶格边界更清楚
  vec2 edgeDist = abs(centered - crystal) * 8.0;
  float edge = 1.0 - clamp(max(edgeDist.x, edgeDist.y), 0.0, 1.0);
  color += color * edge * 0.12;

  // 轻微暗角
  color *= 1.0 - 0.18 * length(uv - 0.5);
  frag_color = vec4(color, 1.0);
}
```
- bg.vert:
```vert
#version 460 core

// 全屏三角形：宿主绑定 3 个顶点（覆盖整个裁剪空间），不做任何变换。
layout(location = 0) in vec2 position;

void main() { gl_Position = vec4(position, 0.0, 1.0); }
```
### 手动编译 shader
- 利用 flutter 自带的 `impellerc` 即可编译 shader，可执行文件在 `{flutterRoot}/bin/cache/artifacts/engine/{目标系统架构}/impellerc`
- 然后指定 shader 文件、输出文件名即可:
```sh
path/to/impellerc \
    --shader-bundle="{ "MusicxxRenderVertex": { "type": "vertex", "file": "shaders/bg.vert" }, "MusicxxRenderFragment": { "type": "fragment", "file": "shaders/bg.frag" }}" \
    --sl=bg.shaderbundle
```
- 就可以得到一个 `bg.shaderbundle` 文件，一次编译输出包含 5 个后端（metal_ios / metal_desktop / opengl_es / opengl_desktop / vulkan），一个文件全平台通用，不需要按平台分别编译

### 宿主动态加载 shader-bundle
- 读取文件:
```dart
Uint8List bytes;
try {
    bytes = await File(ref.filePath).readAsBytes();
} catch (e) {
    print("读取 bundle 失败：$e");
    return false;
}
```
- 按 shader 加载:
```dart
import 'package:flutter_gpu/gpu.dart' as gpu_lib;

gpu_lib.ShaderLibrary? library;

try {
    final loaded = await gpu_lib.ShaderLibrary.fromBytes(
        ByteData.sublistView(bytes),
    );
    if (null == loaded) {
        print("加载 shader bundle 失败");
        return false;
    }
    library = loaded;
} catch (e) {
    print("加载 shader bundle 失败：$e");
    return false;
}
```
- 查找函数入口，准备资源:
```dart
RenderPipeline? _pipeline;
DeviceBuffer? _vertexBuffer;
DeviceBuffer? _uniformBuffer;
UniformSlot? _uniformSlot;
ByteData? _uniformBytes;
int _uniformStructSize = 0;

int _clampSize(int value) {
    if (value < 4) {
        return 4;
    }
    if (value > maxSize) {
        return maxSize;
    }
    return value;
}
void _setSurfaceSize(int width, int height) {
    final gpu_lib.GpuImageSurface? surface = _surface;
    if (null == surface) {
        _surface = gpu_lib.gpuContext.createImageSurface(width, height);
        return;
    }
    if (surface.width == width && surface.height == height) {
        return;
    }
    surface.resize(width, height);
}

try {
    // 编译 shader 时指定入口名称，上面的代码中指定的就是:
    const vertexEntry = "MusicxxRenderVertex";
    const fragmentEntry = "MusicxxRenderFragment";

    // 有点像 ffi加载动态库 一样，查找符号，然后才能 传入参数调用函数
    final gpu_lib.Shader? vertex = bundle.library?[vertexEntry];
    final gpu_lib.Shader? fragment = bundle.library?[fragmentEntry];
    if (null == vertex) {
        print("bundle 里找不到顶点入口『${bundle.ref.vertex}』");
        return false;
    }
    if (null == fragment) {
        print("bundle 里找不到片元入口『${bundle.ref.fragment}』");
        return false;
    }
    _pipeline = gpu_lib.gpuContext.createRenderPipeline(vertex, fragment);
    _uniformSlot = fragment.getUniformSlot(
        PluginShaderBundle_c.uniformStructName,
    );
    _uniformStructSize = bundle.layout.structSize;
    final int alignment = gpu_lib.gpuContext.minimumUniformByteAlignment;
    final int bufferSize = _uniformStructSize > alignment
        ? _uniformStructSize
        : alignment;
    _uniformBytes = ByteData(bufferSize);
    _uniformBuffer = gpu_lib.gpuContext.createDeviceBufferWithCopy(
        ByteData(bufferSize),
    );
    // 全屏三角形：覆盖整个裁剪空间的三个顶点（位置用 vec2）
    static final Float32List _fullscreenTriangle = Float32List.fromList(<double>[
        -1, -1,
        3, -1,
        -1, 3,
    ]);
    _vertexBuffer = gpu_lib.gpuContext.createDeviceBufferWithCopy(
        ByteData.sublistView(_fullscreenTriangle),
    );
    // 设置绘制区域的宽高
    _setSurfaceSize(
        _clampSize(width),
        _clampSize(height),
    );
    return true;
} catch (e) {
    print("初始化渲染资源失败：$e");
    return false;
}
```
- 渲染到 image:
```dart
/// 保存上一帧的渲染结果
ui.Image? image;

try {
    _writeUniforms(frameData);
    final gpu_lib.GpuImageSurface surface = _surface!;
    final gpu_lib.GpuSurfaceFrame frame = surface.acquireNextFrame();
    final gpu_lib.CommandBuffer commandBuffer =
        gpu_lib.gpuContext.createCommandBuffer();
    final gpu_lib.RenderPass pass = commandBuffer.createRenderPass(
        gpu_lib.RenderTarget.singleColor(
            gpu_lib.ColorAttachment(texture: frame.colorTexture),
        ),
    );
    pass.bindPipeline(_pipeline!);
    pass.bindVertexBuffer(
        gpu_lib.BufferView(
            _vertexBuffer!,
            offsetInBytes: 0,
            lengthInBytes: _fullscreenTriangle.lengthInBytes,
        ),
    );
    pass.bindUniform(
        _uniformSlot!,
        gpu_lib.BufferView(
            _uniformBuffer!,
            offsetInBytes: 0,
            lengthInBytes: _uniformStructSize,
        ),
    );
    pass.draw(3);
    frame.present(commandBuffer);
    commandBuffer.submit();
    image = surface.currentImage;
    return true;
} catch (e) {
    print("渲染失败：$e");
    return false;
}
```
- 如果一切顺利，那么 shader 此时已经渲染后存储在 `image` 变量中了，在 flutter widget 中显示即可:
```dart
/// 把渲染出的图像铺满挂载区域
class _PluginShaderPainter extends CustomPainter {
  const _PluginShaderPainter({required this.image, required this.seq});

  final ui.Image image;

  /// 帧序号（图像句柄可能被复用，靠序号判断是否需要重绘）
  final int seq;

  @override
  void paint(Canvas canvas, Size size) {
    final Rect src = Rect.fromLTWH(
      0,
      0,
      image.width.toDouble(),
      image.height.toDouble(),
    );
    final Rect dst = Offset.zero & size;
    canvas.drawImageRect(
      image,
      src,
      dst,
      Paint()..filterQuality = FilterQuality.low,
    );
  }

  @override
  bool shouldRepaint(_PluginShaderPainter oldDelegate) => oldDelegate.seq != seq;
}

// 在 widget 中绘制 image
@override
Widget build(BuildContext context) {
    return CustomPaint(
        painter: _PluginShaderPainter(image: image, seq: 0),
        size: Size.infinite,
    );
}
```

## 结尾
- 可能有小伙伴要说 叽里咕噜说什么呢，看起来好麻烦呀，主包主包有没有更简单的? 有的兄弟，有的！
- AI时代当然是交给AI做整套方案的验证和初步实施是最方便的，由于 flutter/dart 的文章文档和代码都比较新又比较少，LLM 训练时了解到的可能还在 使用 skia、不允许动态下载并加载 shader，可以让 AI 了解这篇文章、或是将 flutter_gpu 的文档链接发给它就可以了。