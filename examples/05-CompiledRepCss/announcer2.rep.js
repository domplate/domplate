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

        .announcer, .announcer_1 {
            background-color: green;
        }

        .announcer_1,
        .announcer_2 {
            background-color: green;
        }

        :scope announcer_1,
        DIV.announcer_2
        {
            background-color: green;
        }

        DIV.announcer_1[foo="bar"] {
            background-color: green;
        }

        DIV.announcer_1[foo="bar"]:last-child {
            background-color: green;
        }

        DIV.announcer_1.sub1[foo="bar"]:last-child {
            background-color: green;
        }

        DIV.announcer_1:last-child {
            background-color: green;
        }

        DIV.announcer-1:last-child DIV {
            background-color: green;
        }

        DIV.announcer-1:last-child > DIV {
            background-color: green;
        }

    <<<)
}