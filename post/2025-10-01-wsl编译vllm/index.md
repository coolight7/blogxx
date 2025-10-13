---
title: "Wsl 编译 vllm"
date: "2025-10-01"
tags: 
  - "WSL"
  - "vllm"
  - "编译"
  - "windows"
  - "linux"
  - "cmake"
---
# 记录WSL编译vllm的一些错误解决
- [官方文档](https://docs.vllm.ai/en/latest/getting_started/installation/gpu.html)

## 前言
- 按着官方文档走之前，需要先装好 `conda`、`cuda`:
    - conda: https://www.anaconda.com/docs/getting-started/miniconda/install#linux-2
    - CUDA: https://developer.nvidia.com/ 可以选择cuda版本，我喜欢装12.8，能兼容50系，和一些老显卡用，万一要打包整合包分享给其他机子时更好兼容
    - cmake、make、gcc 等一般都有的就不多说了

## 注意
- 从源码编译，且要使用自己已经安装的 [pytorch](https://pytorch.org/get-started/locally/) 的话，需要走这些：
```sh
# install PyTorch first, either from PyPI or from source
git clone https://github.com/vllm-project/vllm.git
cd vllm
python use_existing_torch.py
uv pip install -r requirements/build.txt
uv pip install --no-build-isolation -e .
```

## 错误
- 编译失败，末尾报错 cmake 返回值 137：
```sh
returned non-zero exit status 137.

## 较完整报错：
/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/_distutils/dist.py:1021:
      _DebuggingTips: Problem in editable installation.
      !!

              ********************************************************************************
              An error happened while installing `vllm` in editable mode.

              The following steps are recommended to help debug this problem:

              - Try to install the project normally, without using the editable mode.
                Does the error still persist?
                (If it does, try fixing the problem before attempting the editable mode).
              - If you are using binary extensions, make sure you have all OS-level
                dependencies installed (e.g. compilers, toolchains, binary libraries, ...).
              - Try the latest version of setuptools (maybe the error was already fixed).
              - If you (or your project dependencies) are using any setuptools extension
                or customization, make sure they support the editable mode.

              After following the steps above, if the problem still persists and
              you think this is related to how setuptools handles editable installations,
              please submit a reproducible example
              (see https://stackoverflow.com/help/minimal-reproducible-example) to:

                  https://github.com/pypa/setuptools/issues

              See https://setuptools.pypa.io/en/latest/userguide/development_mode.html for details.
              ********************************************************************************

      !!
        cmd_obj.run()
      Traceback (most recent call last):
        File "<string>", line 11, in <module>
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/build_meta.py", line 476, in
      build_editable
          return self._build_with_temp_dir(
                 ^^^^^^^^^^^^^^^^^^^^^^^^^^
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/build_meta.py", line 407, in
      _build_with_temp_dir
          self.run_setup()
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/build_meta.py", line 320, in
      run_setup
          exec(code, locals())
        File "<string>", line 652, in <module>
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/__init__.py", line 117, in
      setup
          return distutils.core.setup(**attrs)
                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/_distutils/core.py", line 186,
      in setup
          return run_commands(dist)
                 ^^^^^^^^^^^^^^^^^^
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/_distutils/core.py", line 202,
      in run_commands
          dist.run_commands()
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/_distutils/dist.py", line 1002,
      in run_commands
          self.run_command(cmd)
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/dist.py", line 1104, in
      run_command
          super().run_command(command)
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/_distutils/dist.py", line 1021,
      in run_command
          cmd_obj.run()
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/command/editable_wheel.py",
      line 139, in run
          self._create_wheel_file(bdist_wheel)
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/command/editable_wheel.py",
      line 340, in _create_wheel_file
          files, mapping = self._run_build_commands(dist_name, unpacked, lib, tmp)
                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/command/editable_wheel.py",
      line 263, in _run_build_commands
          self._run_build_subcommands()
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/command/editable_wheel.py",
      line 290, in _run_build_subcommands
          self.run_command(name)
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/_distutils/cmd.py", line 357,
      in run_command
          self.distribution.run_command(command)
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/dist.py", line 1104, in
      run_command
          super().run_command(command)
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/_distutils/dist.py", line 1021,
      in run_command
          cmd_obj.run()
        File "<string>", line 268, in run
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/command/build_ext.py", line 99,
      in run
          _build_ext.run(self)
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/site-packages/setuptools/_distutils/command/build_ext.py",
      line 368, in run
          self.build_extensions()
        File "<string>", line 242, in build_extensions
        File "/root/miniconda3/envs/vllm_py312/lib/python3.12/subprocess.py", line 413, in check_call
          raise CalledProcessError(retcode, cmd)
      subprocess.CalledProcessError: Command '['cmake', '--build', '.', '-j=12', '--target=_moe_C',
      '--target=_vllm_fa2_C', '--target=_vllm_fa3_C', '--target=_flashmla_C', '--target=_flashmla_extension_C',
      '--target=cumem_allocator', '--target=_C']' returned non-zero exit status 137.

      hint: This usually indicates a problem with the package or the build environment.
```
    - 其实很可能是内存不够OOM，被系统砍了，`dmesg -T`就能看见系统砍的提示：
```sh
root@ > dmesg -T

[Wed Oct  1 01:43:00 2025] oom-kill:constraint=CONSTRAINT_NONE,nodemask=(null),cpuset=/,mems_allowed=0,global_oom,task_memcg=/,task=cudafe++,pid=8456,uid=0
[Wed Oct  1 01:43:00 2025] Out of memory: Killed process 8456 (cudafe++) total-vm:1797420kB, anon-rss:1259364kB, file-rss:384kB, shmem-rss:0kB, UID:0 pgtables:3568kB oom_score_adj:0
```
    - 解决办法其实文档里有的:
```sh
# 限制最大工作数量，防止系统资源不够导致崩溃
export MAX_JOBS=4
# 如果按使用已有pytorch的话应为：uv pip install --no-build-isolation -e .
uv pip install -e .
```
    - 另起一个shell窗口，top查看内存占用，一旦出现内存只剩下几十、一两百MB就说明内存是不够的，应当`Ctrl+c`停止安装，重新调小`MAX_JOBS`
    - 内存不够还强行编译的话会非常慢，而且特别容易等半天最终被系统砍了提示编译失败