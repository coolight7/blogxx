---
title: "Let's Encrypt 免费通配符SSL证书折腾和问题"
date: "2025-09-07"
tags: 
  - "Let's Encrypt"
  - "免费证书"
  - "通配符证书"
  - "SSL"
  - "证书"
  - "Https"
---
# Let's Encrypt 免费通配符SSL证书折腾和问题
- 官网：https://letsencrypt.org/

## 前言
- `Let's Encrypt`类似于平常在云服务厂商里申请证书，操作基本也大差不差，但它能免费提供单域名证书和通配符证书！
- 其中免费通配符证书的含金量不言而喻，一个证书就可以用于多个域名，更新的时候也方便很多。

## 自动化更新部署
- 用[OHTTPS](https://ohttps.com/)可以自动申请证书，并ssh上传，或是直接部署进腾讯云等的cdn，挺方便的，它收费不过10块钱就能用很久
- 还有不少开源项目也可以自动申请更新，但是几块钱东西懒得折腾了，上传部署需要ssh和云服务账号密码，在意的可以用开源项目自己搞。

## 通配符证书范围
- 通配符证书只管一级子域名的，无论上级还是下级，跨级管不了，比如：
    - 证书 *.music.bool.run:
    - 可用 api.music.bool.run
    - 可用 down.music.bool.run
    - 不可用 music.bool.run
    - 不可用 hello.api.music.bool.run
- 有上述需求的应当考虑 多域名证书，一个证书里可以添加多个有关联或无关联的域名

## 部分老旧设备不兼容
- `Let's Encrypt` 是2015年推出的，理所当然在此之前的操作系统、浏览器是没有它的根证书的，也就信任不了。
- `安卓7`才开始信任`Let's Encrypt`证书，因此在此之前的安卓4、5、6都是会提示证书问题。
- windows同理，部分老旧的win10仍存在问题！
- 解决办法：
    - 前端，靠前端基本无解，要么让用户更新浏览器，或是用后端配合中转；比如当默认接口请求失败时，尝试转到其他配置了兼容的证书的服务端接口
    - 客户端，可以自定义 HttpClient，一般会有证书验证函数可以自定义，添加验证`Let's Encrypt`的根证书即可，或是直接禁用证书安全性验证，禁用后仍然能进行https的加密连接的，只是没有验证证书可靠性，也就是拦不住中间人攻击。

## TLS重协商
- 早期TLS版本（1.0/1.1）允许重协商安全参数，但会被用于中间人攻击，因此后来版本默认禁用了
- 最近发现部分设备请求时会触发这个问题，客户端临时解决办法是开启允许：
    - flutter/dart 关联Http请求报错`connection closed before full header was received`:
```dart
// 不包含系统的证书
final context = SecurityContext(withTrustedRoots: false);
// 允许 TLS重协商
context.allowLegacyUnsafeRenegotiation = true;
final client = HttpClient(context: context);
// 不验证证书有效
client.badCertificateCallback = (X509Certificate cert, String host, int port) {
    return true;
};
```