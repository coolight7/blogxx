---
title: "40和50系pytorch适配"
date: "2025-09-19"
tags: 
  - "Nvidia"
  - "pytorch"
  - "model"
---
# 40和50系pytorch适配
- 50系显卡需要pytorch2.7+cuda128，这个环境可以向下兼容40系，但是torch改了`torch.load`加载模型这个函数的`weights_only`默认参数为`True`，也就是默认启用加载模型时的安全检查，导致一些项目无法运行，除了直接改项目源码，这里提一下另外的解决办法。
- 本文探索来自我们开发`流明AI`时希望对用户自己从github搭建、或是使用整合包、精简包的情况下尽可能兼容适配

## 不修改项目源码
- 思路很简单，就是运行前用另一个额外的py文件代理启动，里面写一个函数 hook torch.load，改回默认禁用`weights_only`即可，这个玩JS多的靓仔应该习以为常了。
- 示例代码：
```python
import os
import re
import sys
import torch
from functools import wraps

torch_only_cpu = False

def lPrint(str):
    print(f"[Lumenxx] {str}")

original_torch_load = torch.load
@wraps(original_torch_load)
def patched_torch_load(*args, **kwargs):
    if 'weights_only' not in kwargs:
        # 全局默认关闭安全检查
        kwargs['weights_only'] = False

    if torch_only_cpu:
        # 覆盖仅使用cpu
        kwargs['map_location'] = torch.device('cpu')
    # elif 'map_location' not in kwargs:
    #     kwargs['map_location']=None if torch.cuda.is_available() else torch.device('cpu')

    try:
        return original_torch_load(*args, **kwargs)
    except RuntimeError as e:
        if "CUDA" in str(e):
            # 失败时强制CPU加载
            lPrint(f"加载模型时失败，强制使用CPU尝试: {e}")
            kwargs['map_location'] = torch.device('cpu')
            return original_torch_load(*args, **kwargs)
        else:
            raise e
torch.load = patched_torch_load

# 执行其他文件（环境继承）
if __name__ == "__main__":
    if len(sys.argv) < 3:
        lPrint("用法：python lumenxx-global-warp.py [当前脚本处理参数] LumenxxArgTag <目标脚本> [传递目标脚本参数...]")
        sys.exit(1)

    this_args = sys.argv[:2]
    target_script = sys.argv[2] # 目标脚本
    target_args = sys.argv[3:]  # 输入参数

    argIndex = 0
    for item in sys.argv:
        if item == "LumenxxArgTag":
            argIndex += 1
            this_args = sys.argv[:argIndex]
            target_script = sys.argv[argIndex]
            target_args = sys.argv[(argIndex+1):]
            break
        argIndex += 1

    if "only_cpu" in this_args:
        lPrint("已强制仅使用CPU运行")
        torch_only_cpu = True
    
    # 运行目标脚本
    script_path = os.path.abspath(target_script)
    if not os.path.exists(script_path):
        lPrint(f"错误：找不到目标脚本 {script_path}")
        sys.exit(1)
    
    lPrint("正在运行...")
    sys.argv = [target_script] + target_args
    with open(script_path, 'r', encoding='utf-8') as f:
        exec(f.read(), globals())
```
- 这里面主要就是两部分：
  - hook torch.load，修改`weights_only`的默认值，自动切换硬件加速，加载模型失败时切换到CPU重试
  - 修改完后执行真正需要运行的py文件
- 使用时：
  - 原本命令行执行 `python target.py`
  - 现在假设上面新增的文件为`warp.py`，则先将`warp.py`移动到可执行目录，或是直接和`target.py`同目录，然后执行 `python warp.py LumenxxArgTag target.py`
  - 如果需要强制仅使用CPU运行，则执行 `python warp.py LumenxxArgTag only_cpu target.py`
  - 其他参数照旧传递即可，例如 `python warp.py LumenxxArgTag target.py --arg1 value1 --arg2 value2`
  - python 先执行 `warp.py`, 然后它会修改 torch.load，再加载 `target.py` 切换运行