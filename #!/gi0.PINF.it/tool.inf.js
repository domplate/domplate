
exports['gi0.pinf.it/core/v0/tool'] = async function (workspace, LIB) {

    return async function (instance) {

        if (/\/router\/v0$/.test(instance.kindId)) {
            return async function (invocation) {

                return {
                    routeApp: async function (routeOptions) {

                        routeOptions.basedir = routeOptions.basedir || invocation.pwd;

                        const api = await require('./builder').forConfig(routeOptions);
                        return api['#io.pinf/middleware~s2']();
                    }
                };
            }
        }
    };
}
