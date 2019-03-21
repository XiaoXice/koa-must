Koa2-auth
====
[中文](https://github.com/XiaoXice/koa2-auth/blob/master/README_ZH.md)
[![](https://img.shields.io/npm/dw/koa2-auth.svg)](https://www.npmjs.com/package/koa2-auth)
[![](https://img.shields.io/node/v/koa2-auth.svg)](https://www.npmjs.com/package/koa2-auth)

A elegant authorization middleware for Koa2.

##Install
```
npm install --production koa2-auth
```

## Usage

Before you use any authorization, please register it first.
```js
Auth.prototype.register(authName,function callback(ctx[,next]))
```
The you can use following to check the permission.
```js
ctx.auth.must("authName");
```

##Example

```js
var Koa = require('koa');
var app = new Koa();
let Auth = require("koa2-auth");
let auth = new Auth();

auth.register("Never::base", async ctx => {
    ctx.throw(401, {
        code: 419,
        msg: "All Access denied!"
    })
})//before you use, you must register it first.

app.use(auth.auth());

app.use(async ctx => {
    await ctx.auth.must("Never");
    ctx.response.status = 200;
    ctx.response.body = JSON.stringify({
        code: 200,
        msg: "This will never return."
    })
})
```

## Permisson Symbol Example

- register:
  - `base` Base authorization  Eg: You can use it to check if the session exist. 
  - `User::base` User's base autorization  Eg: Ensure it's a user.
  - `User::password::write` A custom authorzation
  - `Item::base` Item base authorzation
  - `Item::*::Admin` Illegibility matching
  - `Item::*::base` Illegibility matching can also use base mode
  - `Item::main::creat`  Specific checking
- usage
  - `base` will trigger following checking
    - `base`
  - `User::base` will trigger
    - `base`
    - `User::base`
  - `User::password::write`  will trigger
    - `base`
    - `User::base`
    - `User::password::write`
  - `Item::ASDFAWSL::Admin` will trigger
    - `base`
    - `Item::base`
    - `Item::*::base`
    - `Item::*::Admin`
  - `Item::main::creat` will trigger
    - `base`
    - `Item::base`
    - `Item::main::creat`

## Authorization Function

If the authorization funtion doesn't throw an error, it means that the permission checking pass. So please use `Promise` or `async` in your callback function, as the second param.

The callback function's first param is `ctx`, which are just the context we know in `Koa`.

Values in each illegibility matching will be stored in array `ctx.auth.params`.

If the checking pass, you can return any value, it has no influence on the running; if checking fail, please use `ctx.throw` to throw the error, or manually:
```js
const err = new Error('Stop here!');
err.status = 403; // Set error code or client will get a 500.
err.expose = true; // Default is true
throw err;
```

During the checking, if you have something want to return, you can store it in the `ctx.auth.checkBack` and use it later. All checking will be executed in order, once throw an error, all checking will stop immediately, so you needn't to worry about `undefined` problem.