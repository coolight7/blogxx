---
title: "vscode无法连接WSL（scripts/wslCode.sh: 68: /root/.vscode-server/bin/xxx/bin/remote-cli/code: not found）"
date: "2024-08-14"
tags: 
  - "vscode"
  - "wsl"
---
# vscode无法连接WSL（scripts/wslCode.sh: 68: /root/.vscode-server/bin/xxx/bin/remote-cli/code: not found）

## 问题

- 在 wsl/ubuntu 中执行 code . 时，会报错：

```
root@coolight-win:~/.vscode-server/bin# code .
/mnt/c/Users/24650/.vscode/extensions/ms-vscode-remote.remote-wsl-0.88.2/scripts/wslCode.sh: 68: /root/.vscode-server/bin/eaa41d57266683296de7d118f574d0c2652e1fc4/bin/remote-cli/code: not found
```

- 或者是用vscode连接wsl时会报错：

\[2024-08-14 04:20:43.533\] Setting up server environment: Looking for /root/.vscode-server/server-env-setup. Not found.  
\[2024-08-14 04:20:43.533\] WSL version: 5.15.153.1-microsoft-standard-WSL2 Ubuntu-22.04  
\[2024-08-14 04:20:43.533\] WSL-shell-PID: 105367  
\[2024-08-14 04:20:43.533\] Node executable: /root/.vscode-server/bin/eaa41d57266683296de7d118f574d0c2652e1fc4/node  
\[2024-08-14 04:20:43.533\] Starting server: /root/.vscode-server/bin/eaa41d57266683296de7d118f574d0c2652e1fc4/bin/code-server --host=127.0.0.1 --port=0 --connection-token=1989113980-2132227812-1163521954-2042192394 --use-host-proxy --without-browser-env-var --disable-websocket-compression --accept-server-license-terms --telemetry-level=all  
\[2024-08-14 04:20:43.534\] /mnt/c/Users/24650/.vscode/extensions/ms-vscode-remote.remote-wsl-0.88.2/scripts/wslServer.sh: 50: /root/.vscode-server/bin/eaa41d57266683296de7d118f574d0c2652e1fc4/bin/code-server: not foun

## 解决办法

- 我这里其实就是缺少可执行文件了，从它尝试运行的路径来看，可执行文件在 /root/.vscode-server/ 里面，所以我直接把这个文件夹删了：

```
$ cd /root
$ rm -rf .vscode-server
```

- 然后重新 code . 或者 vscode 连接即可。
