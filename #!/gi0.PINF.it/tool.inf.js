
let runHomeInstructions = null;

exports['gi0.PINF.it/build/v0'] = async function (LIB, CLASSES) {

    class BuildStep extends CLASSES.BuildStep {

        async onHome (result, home, workspace) {

            await runHomeInstructions();

            return {
                "path": result.path
            };
        }

        async onBuild (result, build, target, instance, home, workspace) {

//console.log("DOMPLATE:", result, build, target, instance, home, workspace);

            const config = LIB.LODASH.merge({}, build.config);

            if (config.dist) throw new Error(`'dist' config property may not be set!`);
            if (config.basedir) throw new Error(`'basedir' config property may not be set!`);

//            config.basedir = build.path;
            config.dist = target.path;

            await require('./builder').forConfig(config, {
                result: result,
                build: build,
                target: target,
                instance: instance,
                home: home,
                workspace: workspace
            });
        }
    }

    return BuildStep;    
}


exports.inf = async function (INF, NS) {
    return {
        invoke: async function (pointer, value, options) {
            if (pointer === 'onHome()') {
                runHomeInstructions = async function () {

                    // await options.callerNamespace.componentInitContext.load(value);

                    return INF.load(value);
                }
                return true;
            }
        }
    };
}
