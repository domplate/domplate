{
    extend: "./announcer1.rep",
    rep: function /*CodeBlock */ () {

        return {
            formatMessage: function (message) {
                return "2[" + message + "]";
            }
        };
    },
    css: (css () >>>

        :scope .announcer {
            background-color: cyan;
            border: 2px dashed blue;
            padding: 5px;
        }

    <<<)
}