module.exports = {
    struct: {
        message: "Hello World"
    },
    rep: function /*CodeBlock */ () {

        return {
            tag: domplate.tags.DIV({
                class: "announcer"
            }, "$message|formatMessage"),

            formatMessage: function (message) {
                return "1[" + message + "]";
            }
        };
    },
    css: (css () >>>

        :scope .announcer {
            background-color: red;
        }

    <<<)
};