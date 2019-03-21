"use strict";

/**
 * Class Generate a privilege verification module.
 */
class AuthBase {
    constructor() {
        this.authRouter = {};
    }

    /**
     * Registration privilege verification module.
     * @param {String} baseName Authentication identifier
     * @param {asyncFunction} verifier Authorization function.
     * @returns {AuthBase} Return itself
     */
    regist(baseName, verifier) {
        let authRouteTree = baseName.split("::");
        let nodeName = authRouteTree.pop();
        let thisNode = this.authRouter;
        for (const authNode of authRouteTree) {
            if (!(authNode in thisNode)) thisNode[authNode] = {};
            if (typeof thisNode[authNode] == "function")
                throw new Error(`The node ${authNode} in ${baseName} had been registed`);
            thisNode = thisNode[authNode];
        }
        if (typeof thisNode[nodeName] == 'function')
            throw new Error(`You has been registed ${baseName}`);
        thisNode[nodeName] = verifier;

        return this;
    }

    /**
     * Authorization boot function.
     * @param {String} authRoute Authentication identifier
     * @param {request.ctx} ctx Koa ctx
     * @returns {Promise<[]>} Need to wait for this Promis to be executed
     */
    mustCan(authRoute, ctx) {
        ctx.auth.params = [];
        ctx.auth.checkBack = {};
        let authRouterTree = authRoute.split("::");
        let findTree = this.authRouter;
        let midFun = () => ctx;
        let syncHeader = (async() => ctx)();
        for (const node of authRouterTree) {
            if ("base" in findTree && typeof findTree.base == "function")
                syncHeader = syncHeader.then(findTree.base).then(midFun);
            if (node in findTree && node != "base") {
                findTree = findTree[node];
                if (typeof findTree == "function") {
                    syncHeader = syncHeader.then(findTree).then(midFun);
                    break;
                }
            } else if (!(node in findTree) && typeof findTree["*"] == "function") {
                ctx.auth.params.push(node);
                syncHeader = syncHeader.then(findTree["*"]).then(midFun);
                break;
            } else if (!(node in findTree) && typeof findTree["*"] == "object") {
                findTree = findTree["*"];
                ctx.auth.params.push(node);
            }
        }
        syncHeader = syncHeader.catch(err => {
            err.status = err.status || 500;
            err.expose = err.expose || typeof err.expose == "undefined";
            throw err;
        });

        return syncHeader;
    }

    /**
     * Middleware for mounting auth
     * @returns {Function} Middleware
     */
    auth() {
        return (ctx, next) => {
            ctx.auth = {
                must: authRoute => this.mustCan(authRoute, ctx),
            };

            return next()
        }
    }
}
module.exports = AuthBase;