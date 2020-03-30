
/*
 * This interface provides a domplate rep workspace for the nodejs.org ecosystem.
 */

if (require.main === module) {

    throw new Error(`TODO: Port to pinf.it/core`);

    const LIB = require("bash.origin.lib").forPackage(__dirname).js;

    const PATH = LIB.path;
/*
    const CP = require("child_process");
    if (!require("fs").existsSync(PATH.join(__dirname, "node_modules/bash.origin.workspace"))) {
        CP.execSync('npm install', {
            cwd: __dirname,
            stdio: "inherit"
        });
    }
*/
    const FS = LIB.FS_EXTRA;


    const args = require("minimist")(process.argv.slice(2));
    const cwd = process.cwd();

    if (
        args._[0] === "test" &&
        process.env.npm_config_argv
    ) {
        var npm_args = JSON.parse(process.env.npm_config_argv);
        npm_args.original[0] = ".";
        
        var reps = args._.slice(1).filter(function (path) {
            return (typeof path === "string");
        });

        if (reps.indexOf(npm_args.original[npm_args.original.length - 1]) !== -1 ) {
            reps = [];
            reps.push(npm_args.original.pop());
        }

        reps.forEach(function (path) {

            console.log("[domplate:rep.workspace] Rep:", path);

            var repPath = PATH.join(cwd, path);
            var testsBasePath = PATH.join(repPath, '..', '~.rt_domplate.rep.workspace_tests', repPath.match(/\/([^/]+)\.js$/)[1]);

            FS.copySync(PATH.join(__dirname, "lib/workspace/tests"), testsBasePath);

            var env = process.env;
            env.DOMPLATE_REP_WORKSPACE__BASH_ORIGIN_LIB_PATH = require.resolve("bash.origin.lib");
            env.DOMPLATE_REP_WORKSPACE__CODEBLOCK_PATH = LIB.resolve("codeblock");
            env.DOMPLATE_REP_WORKSPACE__REP_PATH = repPath;
            
            CP.spawnSync(PATH.join(__dirname, 'node_modules/.bin/bash.origin.test'), npm_args.original, {
                cwd: testsBasePath,
                stdio: "inherit",
                env: env
            });

        });
    }    
}
