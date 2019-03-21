koa2-auth
====

一个初学者写的乱七八糟的不知道应该叫什么名字的权限检测模块。

## 简单使用方法

```js
var Koa = require('koa');
var app = new Koa();
let Auth = require("koa2-auth");
let auth = new Auth();

auth.regist("Never::base", async ctx => {
    ctx.throw(401, {
        code: 419,
        msg: "禁止一切！"
    })
})

app.use(auth.auth());

app.use(async ctx => {
    await ctx.auth.must("Never");
    ctx.response.status = 200;
    ctx.response.body = JSON.stringify({
        code: 200,
        msg: "永远不会返回这个东西"
    })
})
```

## 权限标识样例

- 注册:
  - `base` 基础验证 基本用来确保session存在之类的
  - `User::base` 用户的基础权限验证 确保这是个用户
  - `User::password::write` 一个自定义的权限验证
  - `Item::base` 物品基础验证
  - `Item::*::Admin` 模糊匹配
  - `Item::*::base` 模糊匹配 也可以使用基础模式
  - `Item::main::creat` 具体命令
- 使用
  - `base` 会触发下面的验权
    - `base`
  - `User::base` 会触发
    - `base`
    - `User::base`
  - `User::password::write` 会触发
    - `base`
    - `User::base`
    - `User::password::write`
  - `Item::ASDFAWSL::Admin` 会触发
    - `base`
    - `Item::base`
    - `Item::*::base`
    - `Item::*::Admin`
  - `Item::main::creat` 会触发
    - `base`
    - `Item::base`
    - `Item::main::creat`

## 验权函数

验权函数如果不抛出异常则代表通过，异步处理请使用`Promise`或者`async`，作为注册函数的第二个参数传入。

调用函数会传入一个参数就是`ctx`，这个就是Koa一般意义上的ctx

模糊匹配中的值会保存在`ctx.auth.params`中，这是一个数组。多个模糊匹配将顺次存放在这里。

如果验权通过，可以返回任意值，对于运行没有影响，如果验权错误请使用`ctx.throw`将问题直接抛出，或者手动：

```js
const err = new Error('这个错误不能被容忍！');
err.status = 403; // 不设置这个会默认 500
err.expose = true; // 默认会帮你设置成true，除非强制设置为false
throw err;
```

如果验权的时候有什么想返回的，可以放在`ctx.auth.checkBack`中取用。所有的判断会顺序依次执行，一旦抛出错误就会停止。所以在后面的验权模块中并不用担心会出现未定义的问题。