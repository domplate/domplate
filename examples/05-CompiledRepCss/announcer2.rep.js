{
    struct: {
        message: "Hello World"
    },
    rep: function /*CodeBlock */ () {

        return {
            tag: domplate.tags.DIV({
                style: "border: 1px solid black; padding: 5px;",
                class: "announcer"
            }, domplate.tags.DIV("$message"))
        };
    },
    css: (css () >>>

        :scope .announcer {
            background-color: green;
        }

    <<<)
}