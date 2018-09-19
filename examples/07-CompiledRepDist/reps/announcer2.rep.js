{
    dist: "subdir",
    struct: {
        message: "Hello World"
    },
    rep: function /*CodeBlock */ () {

        return {
            tag: domplate.tags.DIV({
                style: "border: 1px solid black; padding: 5px;",
                class: "announcer"
            }, domplate.tags.DIV("$message"), domplate.tags.DIV({
                class: "img"
            }))
        };
    },
    css: (css () >>>

        :scope .announcer {
            background-color: green;
            white-space: nowrap;
        }

        :scope .announcer > DIV {
            display: inline-block;
        }

        :scope .announcer > DIV.img {
            background-image: url(images/information.png);
            width: 16px;
            height: 16px;
        }

    <<<)
}