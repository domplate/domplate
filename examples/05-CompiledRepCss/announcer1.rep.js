module.exports = {
    struct: {
        message: "Hello World"
    },
    rep: function /*CodeBlock */ () {

        return {
            tag: domplate.tags.DIV({
                class: "announcer"
            }, "$message")
        };
    },
    css: (css () >>>

        .announcer {
            background-color: red;
        }

    <<<)
};