#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env

/*

const encoder = new TextEncoder();
Deno.writeFileSync('./test1111',  encoder.encode("XXXXXXXxx 1 "))
*/


import { load } from "@std/dotenv";

import SysTray from "https://deno.land/x/systray/mod.ts";

// try to load .env files
const env = await load();

const nextUpdateDate = new Date();

const body = new URLSearchParams();
body.append("password", env["PASSWORD"]);

const update = async () => {
    const response = await fetch(env["SERVER_URI"], {
        method: "POST",
        body,
    });

    // console.log(response);
    nextUpdateDate.setHours(nextUpdateDate.getHours() + 1);

};

await update();

// console.log("first succeeded, starting update loop");

const Item1 = {
    title: "Update now",
    tooltip: "Immediate update",
    // checked is implemented by plain text in linux
    checked: true,
    enabled: true,
    // click is not a standard property but a custom value
    click: () => {
        Item1.checked = !Item1.checked;
        systray.sendAction({
            type: "update-item",
            item: Item1,
        });
    },
    __data__: "trigger-update"
};

const ItemExit = {
    title: "Exit",
    tooltip: "Exit the menu",
    checked: false,
    enabled: true,
    click: () => {
        systray.kill();
    },
    __data__: "exit"    
};

const systray = new SysTray({
    menu: {
        // Use .png icon in macOS/Linux and .ico format in windows
        icon: Deno.build.os === "windows"
            ? "./assets/win.ico"
            : "./assets/key.png",
        // A template icon is a transparency mask that will appear to be dark in light mode and light in dark mode
        isTemplateIcon: Deno.build.os === "darwin",
        title: "CrowdSec Allowlist",
        tooltip: `Update in ... ${Date.now() - nextUpdateDate.getTime()}`,
        items: [
            Item1,
            SysTray.separator, // SysTray.separator is equivalent to a MenuItem with "title" equals "<SEPARATOR>"
            ItemExit,
        ],
    },
    debug: false, // log actions
    directory: "bin", // cache directory of binary package
});

systray.on("click", (action) => {
    console.log('cli k!' , action)

    const i = action.item as unknown as { __data__: string }

    if (i.__data__ === "trigger-update") {
        update()
    }

    if (i.__data__ === "exit") {
        Deno.exit()
    }

});

systray.on("ready", () => {
    // console.log("tray started!");
});

systray.on("exit", () => {
    console.log("exited");
});

systray.on("error", (error) => {
    console.log(error);
});

setInterval(update, 60 * 3600 * 1000);
