---
title: "act本地运行GithubAction记录"
date: "2025-10-13"
tags: 
  - "vscode"
  - "git"
  - "submodule"
---
# act本地运行GithubAction记录
- 最近想本地运行个 github action 打包个 libmpv 出来，折腾一顿遇到不少小问题，记录一下咋搞
- act 添加参数`-v`运行时输出更详细的日志：
```sh
act -v -W .github/workflows/build.yaml
```

## 问题和解决
1. Job failed Error: unsupported object type
   - 拉取`gradle-actions`时报的错：
```sh
[Build libmpv-android/Build]   ☁  git clone 'https://github.com/gradle/actions' # ref=v4
[Build libmpv-android/Build] [DEBUG]   cloning https://github.com/gradle/actions to /root/.cache/act/gradle-actions-setup-gradle@v4
[Build libmpv-android/Build] [DEBUG] Enumerating objects: 16432, done.
Counting objects: 100% (387/387), done.unting objects:   0% (1/387)
Compressing objects: 100% (156/156), done.essing objects:   0% (1/156)
[Build libmpv-android/Build] [DEBUG] Total 16432 (delta 328), reused 242 (delta 230), pack-reused 16045 (from 4)
[Build libmpv-android/Build] Unable to resolve v4: unsupported object type
[Build libmpv-android/Build] Unable to resolve v4: unsupported object type
[Build libmpv-android/Build] unsupported object type
[Build libmpv-android/Build] [DEBUG] skipping post step for 'Upload Release'; step was not executed
[Build libmpv-android/Build] [DEBUG] skipping post step for 'Upload Artifact'; step was not executed
[Build libmpv-android/Build] [DEBUG] skipping post step for 'Setup Gradle'; step was not executed
[Build libmpv-android/Build] [DEBUG] skipping post step for 'Setup Java JDK'; step was not executed
[Build libmpv-android/Build] [DEBUG] skipping post step for 'Checkout repository'; step was not executed
[Build libmpv-android/Build] ⭐ Run Complete job
[Build libmpv-android/Build] [DEBUG] Loading revision from git directory
[Build libmpv-android/Build] [DEBUG] Found revision: fe8c3ac1a91c09aa6fb1deccbc833f1bafa54768
[Build libmpv-android/Build] [DEBUG] HEAD points to 'fe8c3ac1a91c09aa6fb1deccbc833f1bafa54768'
[Build libmpv-android/Build] [DEBUG] using github ref: refs/tags/v1.1.7
[Build libmpv-android/Build] [DEBUG] Found revision: fe8c3ac1a91c09aa6fb1deccbc833f1bafa54768
[Build libmpv-android/Build]   ✅  Success - Complete job
[Build libmpv-android/Build] 🏁  Job failed
Error: unsupported object type
```
   - 在`workflow/xxx.yaml` 里写的是正常的，查了一下act的issue，应该是 github 在线运行就正常，用act本地运行就有问题，后面的版本号`v4`改成一个具体版本就可以了，比如`v4.4.4`：
```yaml
      - name: Setup Gradle
        # uses: gradle/actions/setup-gradle@v4  # 原本的
        uses: gradle/actions/setup-gradle@v4.4.4 # 改为具体版本号
```
2. skipping post step for 'Checkout repository': no action model available
    - 出现这句的时候很多时候是前面的步骤就已经报错了，得把日志往前翻，找到真正的报错，然后再分析：
```sh
[Build libmpv-android/Build]   ❌  Failure - Main Bundle (default) [4m40.674318163s]
```
3. 挂了VPN后仍然有很多网络错误：
```sh
# apt
Err:1 http://archive.ubuntu.com/ubuntu jammy/universe amd64 nasm amd64 2.15.05-1
|   Could not connect to archive.ubuntu.com:80 (198.18.1.15), connection timed out
Err:2 http://archive.ubuntu.com/ubuntu jammy/universe amd64 ninja-build amd64 1.10.1-1
|   Unable to connect to archive.ubuntu.com:http:
E: Failed to fetch http://archive.ubuntu.com/ubuntu/pool/universe/n/nasm/nasm_2.15.05-1_amd64.deb  Could not connect to archive.ubuntu.com:80 (198.18.1.15), connection timed out
| E: Failed to fetch http://archive.ubuntu.com/ubuntu/pool/universe/n/ninja-build/ninja-build_1.10.1-1_amd64.deb  Unable to connect to archive.ubuntu.com:http:
| E: Unable to fetch some archives, maybe run apt-get update or try with --fix-missing?

# git/github
| --2025-10-13 12:48:26--  https://github.com/FFmpeg/gas-preprocessor/raw/master/gas-preprocessor.pl
| Resolving github.com (github.com)... 198.18.0.78
| Connecting to github.com (github.com)|198.18.0.78|:443... failed: Connection timed out.
| Retrying.
|
| --2025-10-13 12:50:42--  (try: 2)  https://github.com/FFmpeg/gas-preprocessor/raw/master/gas-preprocessor.pl
| Connecting to github.com (github.com)|198.18.0.78|:443... failed: Connection timed out.
| Retrying.

Error: Error response from daemon: Get "https://registry-1.docker.io/v2/": context deadline exceeded
```
    - 如果vpn运行在windows，使用的WSL, 需要export将wsl的流量代理到windows的vpn上：
```sh
export http_proxy=http:win_ip:vpn_port
export https_proxy=http:win_ip:vpn_port
```
    - 修改docker的代理配置，vim ：
```sh
sudo mkdir -p /etc/systemd/system/docker.service.d
vi /etc/systemd/system/docker.service.d/http-proxy.conf
```
    - 添加内容，跟正常 export 环境变量一样：
```conf
[Service]
Environment="HTTP_PROXY=http://user:passwd@ip:port"
Environment="HTTPS_PROXY=http://user:passwd@ip:port"
Environment="NO_PROXY=localhost,127.0.0.1"
```
4. 运行失败调试和复用容器
   - 默认情况下, act 每次运行都会把docker容器删了重新建立一个新的，可以加上 `--reuse` 复用已有的容器，此时我们就可以docker进入容器内打补丁，少了什么库、环境变量、配置代理都可以进入后手动操作好，然后用act跑一下：
```sh
# 查看docker容器
docker ps 

(base) root@ubuntu22:~/.cache/act/gradle-actions-setup-gradle@v5# docker ps
CONTAINER ID   IMAGE                           COMMAND               CREATED          STATUS          PORTS     NAMES
350213cdf9b8   catthehacker/ubuntu:act-22.04   "tail -f /dev/null"   37 minutes ago   Up 37 minutes             act-Build-libmpv-android-Build-a6637138a4eba25d208dc9b2305b13f191ae0fd2e7e9c29b24e55313c0d52ac4
```
   - 进入容器：
```sh
docker exec --it {容器id，比如上面输出的350213cdf9b8} /bin/bash
```
   - 平常装的容器是精简的，可能vim啥的都没有，直接apt安装就可以了
   - 进去后按照act运行时的日志报错去手动操作后，在容器外主机再次运行act，加上`--reuse`即可：
```sh
act -v -W .github/workflows/build.yaml --reuse
```
5. Error: invalid reference format
- github action运行正常，但act运行就马上报错`invalid reference format`，查了一下问题多种多样，我这里是因为 yaml 或命令行指定了 container 格式问题：
```yaml
jobs:
  build_llvm:
    name: Building LLVM and Clang
    runs-on: ubuntu-latest
    container:
      # image: docker://ghcr.io/shinchiro/archlinux:latest # 提示错误
      image: ghcr.io/shinchiro/archlinux:latest
```
- 命令行运行act时的参数同理：
```sh
act -v -W .github/workflows/work.yaml -P ubuntu-latest=ghcr.io/shinchiro/archlinux:latest
# act -v -W .github/workflows/work.yaml -P ubuntu-latest=docker://ghcr.io/shinchiro/archlinux:latest 提示错误

# 使用帮助其实有提示格式：
act -h

  -P, --platform stringArray                              custom image to use per platform (e.g. -P ubuntu-18.04=nektos/act-environments-ubuntu:18.04)
```