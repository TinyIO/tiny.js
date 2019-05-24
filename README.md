# tiny.io
[![Build Status](https://travis-ci.org/TinyIO/tiny.js.svg?branch=dev)](https://travis-ci.org/TinyIO/tiny.js)
[![codebeat badge](https://codebeat.co/badges/79ae878a-275f-4b68-86f1-5b3c749a58b0)](https://codebeat.co/projects/github-com-tinyio-tiny-js-dev)
[![Coverage Status](https://coveralls.io/repos/github/TinyIO/tiny.js/badge.svg?branch=dev)](https://coveralls.io/github/TinyIO/tiny.js?branch=dev)
[![install size](https://packagephobia.now.sh/badge?p=tiny.io)](https://packagephobia.now.sh/result?p=tiny.io)
[![Dependency Status](https://david-dm.org/TinyIO/tiny.js/status.svg)](https://david-dm.org/TinyIO/tiny.js)

tiny.io 是一个精简的web开发框架,以兼容express的思路进行编写,可以直接使用大部分express的middleware

和express [![install size](https://packagephobia.now.sh/badge?p=express)](https://packagephobia.now.sh/result?p=express)
比它真的[![install size](https://packagephobia.now.sh/badge?p=tiny.io)](https://packagephobia.now.sh/result?p=tiny.io)很小,核心功能是路由和middleware结构, 将非核心功能从项目中剥离, 来保持一个简单、清晰、高效的内核.

|            | Requests/s | Latency | Throughput/Mb |
|------------|:----------:|--------:|-----:|
| NativeHttp | 46524      | 10.53   | 4.58 |
| Tiny       | 41200.81   | 11.82   | 4.05 |
| Express    | 15666      | 29.96   | 1.55 |

性能测试来看效率还不错(当然这并不意味你的应用真的能有这么大幅度的性能提升, 通常CURD才是性能杀手)

# TODO

- [ ] 说明文档补全
  - [ ] API列表
  - [ ] 和express的差异和注意事项
- [ ] 测试用例补全
  - [ ] 覆盖率达到100%
- [ ] 编写若干和express常用middleware结合的例子