---
title: "AgentScope智能体执行python代码报错'utf-8' codec can't decode byte"
date: "2025-09-21"
tags: 
  - "AgentScope"
  - "智能体"
  - "python"
  - "utf8"
  - "Error"
---
# AgentScope智能体执行python代码报错
- 环境：
  - windows/cmd
  - AgentScope
  - Qwen3-4B-Thinking
- 关键报错信息：
```
Error: 'utf-8' codec can't decode byte 0xd2 in position 0: invalid continuation byte
```
- 执行记录：
```
system: {
    "type": "tool_result",
    "id": "AhO8CdvHfsU6U4k8e4DlkDHgrgpjQZHG",
    "name": "execute_python_code",
    "output": [
        {
            "type": "text",
            "text": "Error: 'utf-8' codec can't decode byte 0xd2 in position 0: invalid continuation byte"
        }
    ]
}
```

- agent给了python执行权限后，自动执行时一旦代码中包含输出，就容易出现这个报错，导致agent误以为代码写错了
- 实际上是windows的命令行环境的默认字符编码在中国为GBK，agent生成的代码编码和执行环境不一致
- 只需要在启动agent的命令行先执行切换为utf8即可：
```sh
chcp 65001
```