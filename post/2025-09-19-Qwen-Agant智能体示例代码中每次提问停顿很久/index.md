---
title: "Qwen-Agant智能体的示例代码中每次提问停顿很久"
date: "2025-09-19"
tags: 
  - "Qwen-Agant"
  - "智能体"
  - "卡顿"
---
# Qwen-Agant智能体的示例代码中每次提问停顿很久
- 官方示例代码：
```python
import pprint
import urllib.parse
import json5
from qwen_agent.agents import Assistant
from qwen_agent.tools.base import BaseTool, register_tool
from qwen_agent.utils.output_beautify import typewriter_print

# 步骤 1（可选）：添加一个名为 `my_image_gen` 的自定义工具。
@register_tool('my_image_gen')
class MyImageGen(BaseTool):
    # `description` 用于告诉智能体该工具的功能。
    description = 'AI 绘画（图像生成）服务，输入文本描述，返回基于文本信息绘制的图像 URL。'
    # `parameters` 告诉智能体该工具有哪些输入参数。
    parameters = [{
        'name': 'prompt',
        'type': 'string',
        'description': '期望的图像内容的详细描述',
        'required': True
    }]

    def call(self, params: str, **kwargs) -> str:
        # `params` 是由 LLM 智能体生成的参数。
        prompt = json5.loads(params)['prompt']
        prompt = urllib.parse.quote(prompt)
        return json5.dumps(
            {'image_url': f'https://image.pollinations.ai/prompt/{prompt}'},
            ensure_ascii=False)


# 步骤 2：配置您所使用的 LLM。
llm_cfg = {
    # 使用 DashScope 提供的模型服务：
    'model': 'qwen-max-latest',
    'model_type': 'qwen_dashscope',
    # 'api_key': 'YOUR_DASHSCOPE_API_KEY',
    # 如果这里没有设置 'api_key'，它将读取 `DASHSCOPE_API_KEY` 环境变量。

    # 使用与 OpenAI API 兼容的模型服务，例如 vLLM 或 Ollama：
    # 'model': 'Qwen2.5-7B-Instruct',
    # 'model_server': 'http://localhost:8000/v1',  # base_url，也称为 api_base
    # 'api_key': 'EMPTY',

    # （可选） LLM 的超参数：
    'generate_cfg': {
        'top_p': 0.8
    }
}

# 步骤 3：创建一个智能体。这里我们以 `Assistant` 智能体为例，它能够使用工具并读取文件。
system_instruction = '''在收到用户的请求后，你应该：
- 首先绘制一幅图像，得到图像的url，
- 然后运行代码`request.get`以下载该图像的url，
- 最后从给定的文档中选择一个图像操作进行图像处理。
用 `plt.show()` 展示图像。
你总是用中文回复用户。'''
tools = ['my_image_gen', 'code_interpreter']  # `code_interpreter` 是框架自带的工具，用于执行代码。
files = ['./examples/resource/doc.pdf']  # 给智能体一个 PDF 文件阅读。
bot = Assistant(llm=llm_cfg,
                system_message=system_instruction,
                function_list=tools,
                files=files)

# 步骤 4：作为聊天机器人运行智能体。
messages = []  # 这里储存聊天历史。
while True:
    # 例如，输入请求 "绘制一只狗并将其旋转 90 度"。
    query = input('\n用户请求: ')
    # 将用户请求添加到聊天历史。
    messages.append({'role': 'user', 'content': query})
    response = []
    response_plain_text = ''
    print('机器人回应:')
    for response in bot.run(messages=messages):
        # 流式输出。
        response_plain_text = typewriter_print(response, response_plain_text)
    # 将机器人的回应添加到聊天历史。
    messages.extend(response)
```

## 现象和解决
- 启动挺快的，但是每次提问时，打印`机器人回应`然后等很久模型才开始回答
- 解决：其实根源就在于一开始传入的`pdf文件`，导致每次提问都要解析一次，把那句删了就可以了：
```python
tools = ['my_image_gen', 'code_interpreter']
files = ['./examples/resource/doc.pdf']
bot = Assistant(llm=llm_cfg,
                system_message=system_instruction,
                function_list=tools,
                #  files=files  # !!! 去掉这一行 !!!
              )
```

## 其他
- qwen用起来倒不麻烦，虽然小坑也不少，但最后运行起来效果挺好的。
- 不过啥也没碰呢这语气二刺猿浓度拉满，也挺好挺好：
```
[THINK]
好的，用户问当前操作系统是什么。我之前调用了代码解释器执行Python代码来获取系统信息，结果返回的是“当前操作系统: Windows”。现在需要根据这个结果用中文回复用户，保持幽默活泼的风格。

首先，我要确认结果是否正确。代码里用了platform.system()，在Windows环境下确实返回"Windows"，所以没问题。

接下来，要组织语言。用户可能想知道具体的版本，但代码里只返回了系统名称，没有版本号。不过用户的问题比较基础，可能只需要知道是Windows就行。我需要用流明的语气，活泼可爱，带点小俏皮。

比如：“啊啦~检测到我的小宇宙正在运行Windows系统呢！（*^▽^*） 你猜怎么着？这可是能和我的小可爱代码一起玩得超开心的系 统哦～” 这样既回答了问题，又带点幽默和拟人化的元素。

要注意避免技术术语太复杂，保持轻松。可能还要加个表情符号，让回复更生动。比如用✨或者（歪头笑）这样的表情。

另外，用户可能期待更详细的信息，但根据代码结果，只有系统名称，所以不能编造版本号。要诚实，但用俏皮的方式表达。

再检查一下有没有错误。比如是否应该用中文的“系统”而不是“OS”，不过中文里通常说“操作系统”或者“系统”。这里用“Windows系统”比较自然。

最后，确保回复符合流明的性格：幽默、活泼、情感丰富。比如加一句“下次想试试其他系统？我可是能帮你写代码的小魔法师哦～” 这样既友好又带点小悬念。

现在组织语言：

“啊啦~检测到我的小宇宙正在运行Windows系统呢！（*^▽^*） 你猜怎么着？这可是能和我的小可爱代码一起玩得超开心的系统哦～ 下次想试试其他系统？我可是能帮你写代码的小魔法师哦～✨”

这样既回答了问题，又保持了活泼的语气，还带点互动性，符合角色设定。
[ANSWER]
啊啦~检测到我的小宇宙正在运行Windows系统呢！（*^▽^*） 你猜怎么着？这可是能和我的小可爱代码一起玩得超开心的系统哦～下次想试试其他系统？我可是能帮你写代码的小魔法师哦～✨
```