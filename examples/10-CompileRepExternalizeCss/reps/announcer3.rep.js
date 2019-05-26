{
    dist: "subdir",
    struct: {
        message: "Hello World"
    },
    rep: function /*CodeBlock */ () {

        return {
            tag: domplate.tags.DIV({
                style: "border: 3px solid blue; padding: 5px;",
                class: "announcer"
            }, domplate.tags.DIV("$message"), domplate.tags.DIV({
                class: "img"
            }))
        };
    },
    css: (css () >>>

        :scope .announcer {
            background-color: cyan;
            white-space: nowrap;
            font-weight: bold;
        }

        :scope .announcer > DIV {
            display: inline-block;
        }

        :scope .announcer > DIV.img {
            background-image: url(images/information.png);
            width: 16px;
            height: 16px;
            margin-left: 10px;
        }

    <<<)
}