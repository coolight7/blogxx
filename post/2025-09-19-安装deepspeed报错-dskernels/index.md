---
title: "安装 deepspeed 报错 ModuleNotFoundError: No module named 'dskernels'"
date: "2025-09-19"
tags: 
  - "deepspeed"
  - "dskernels"
  - "python"
  - "pip"
---
# 安装 deepspeed 报错 ModuleNotFoundError: No module named 'dskernels'
- 搞`index-tts-2`时遇到的坑
- windows11 / torch2.8+cuda128

## 解决
- 配置个环境变量即可，windows：
```sh
set DS_BUILD_OPS=0
```
- linux/mac：
```sh
export DS_BUILD_OPS=0
```

## 报错内容
```sh
(index-tts-py311) C:\>uv sync --all-extras --default-index "https://mirrors.aliyun.com/pypi/simple"
Resolved 190 packages in 2.72s
Installed 30 packages in 1.84s
  x Failed to build `deepspeed==0.17.1`
  |-> The build backend returned an error
  `-> Call to `setuptools.build_meta:__legacy__.build_wheel` failed (exit code: 1)

      [stdout]
      [2025-09-19 00:31:59,369] [INFO] [real_accelerator.py:254:get_accelerator] Setting ds_accelerator to cuda (auto
      detect)
      [2025-09-19 00:31:59,795] [INFO] [real_accelerator.py:254:get_accelerator] Setting ds_accelerator to cuda (auto
      detect)
      test.c
      LINK : fatal error LNK1181: �޷��������ļ���aio.lib��
      test.c
      LINK : fatal error LNK1181: �޷��������ļ���cufile.lib��
      [2025-09-19 00:32:12,229] [INFO] [logging.py:107:log_dist] [Rank -1] [TorchCheckpointEngine] Initialized with
      serialization = False
      test.c
      LINK : fatal error LNK1181: �޷��������ļ���aio.lib��
      test.c
      LINK : fatal error LNK1181: �޷��������ļ���cufile.lib��
      DS_BUILD_OPS=1
       [WARNING]  Skip pre-compile of incompatible async_io; One can disable async_io with DS_BUILD_AIO=0
       [WARNING]  Skip pre-compile of incompatible evoformer_attn; One can disable evoformer_attn with
      DS_BUILD_EVOFORMER_ATTN=0
       [WARNING]  Skip pre-compile of incompatible fp_quantizer; One can disable fp_quantizer with DS_BUILD_FP_QUANTIZER=0
       [WARNING]  Skip pre-compile of incompatible gds; One can disable gds with DS_BUILD_GDS=0
       [WARNING]  Filtered compute capabilities [['6', '0'], ['6', '1'], ['7', '0']]

      [stderr]
      W0919 00:32:08.485000 23368 Lib\site-packages\torch\distributed\elastic\multiprocessing\redirects.py:29] NOTE:
      Redirects are currently not supported in Windows or MacOs.
      Traceback (most recent call last):
        File "<string>", line 11, in <module>
        File "C:\0Acoolight\Ai\index-tts\.venv\lib\site-packages\setuptools\build_meta.py", line 432, in build_wheel
          return _build(['bdist_wheel'])
        File "C:\0Acoolight\Ai\index-tts\.venv\lib\site-packages\setuptools\build_meta.py", line 423, in _build
          return self._build_with_temp_dir(
        File "C:\0Acoolight\Ai\index-tts\.venv\lib\site-packages\setuptools\build_meta.py", line 404, in
      _build_with_temp_dir
          self.run_setup()
        File "C:\0Acoolight\Ai\index-tts\.venv\lib\site-packages\setuptools\build_meta.py", line 512, in run_setup
          super().run_setup(setup_script=setup_script)
        File "C:\0Acoolight\Ai\index-tts\.venv\lib\site-packages\setuptools\build_meta.py", line 317, in run_setup
          exec(code, locals())
        File "<string>", line 201, in <module>
        File
      "C:\Users\24650\AppData\Local\uv\cache\sdists-v9\index\3ba65c4f41aac3a1\deepspeed\0.17.1\5vTbGXj2fgw9t7grhumJK\src\op_builder\builder.py",
      line 730, in builder
          extra_link_args=self.strip_empty_entries(self.extra_ldflags()))
        File
      "C:\Users\24650\AppData\Local\uv\cache\sdists-v9\index\3ba65c4f41aac3a1\deepspeed\0.17.1\5vTbGXj2fgw9t7grhumJK\src\op_builder\inference_cutlass_builder.py",
      line 74, in extra_ldflags
          import dskernels
      ModuleNotFoundError: No module named 'dskernels'

      hint: This error likely indicates that `deepspeed@0.17.1` depends on `dskernels`, but doesn't declare it as a build
      dependency. If `deepspeed` is a first-party package, consider adding `dskernels` to its `build-system.requires`.
      Otherwise, either add it to your `pyproject.toml` under:

      [tool.uv.extra-build-dependencies]
      deepspeed = ["dskernels"]

      or `uv pip install dskernels` into the environment and re-run with `--no-build-isolation`.
  help: `deepspeed` (v0.17.1) was included because `indextts[deepspeed]` (v2.0.0) depends on `deepspeed`
```

- 就是说 deepspeed 缺少依赖 `dskernels`，但是直接install也找不到：
```sh
(index-tts-py311) C:\>uv pip install dskernels
Using Python 3.11.13 environment at: C:\Users\24650\.conda\envs\index-tts-py311
  x No solution found when resolving dependencies:
  `-> Because dskernels was not found in the package registry and you require dskernels, we can conclude that your
      requirements are unsatisfiable.
```