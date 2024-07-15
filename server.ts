#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read 

///# https://github.com/dyedgreen/deno-sqlite/issues/255

import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";
import { stringify } from "https://deno.land/std@0.207.0/yaml/mod.ts";
import { enumToCli } from "./cli.ts";

const port = 7891;

const db = new DB("allowlist.db");
db.execute(`
  CREATE TABLE IF NOT EXISTS allowlist (
    password TEXT ,
    client_ip TEXT,
    PRIMARY KEY (password, client_ip)
  )
`);

const csParserYamlTemplate = {
    name: "allowed IPs",
    description: "whitelist events from my IP addresses",
    whitelist: {
        reason: "my IPs added via dynamic magic",
        ip: [],
    },
};



const server = () => {
    console.log(`HTTP server running. Access it at: http://localhost:${port}/`);

    Deno.serve({ port }, async (req: Request, _info: unknown /* ServeHandlerInfo */) => {
        if (!req.body) return new Response("missing body", { status: 400 });

        const b = await req.formData();
        // console.log(b, b.get('password'), info, info.remoteAddr, req.headers.get('x-real-ip'))

        const pw = b.get("password") as string;

        if (typeof pw !== 'string') {
            throw new Error(`runtime error: got something non-string in form data - ${typeof pw} //// ${JSON.stringify(pw)}`)
        }

        if (!pw) return new Response("missing pw", { status: 400 });

        const lastIps = db.query<[string, string]>(
            "SELECT password, client_ip FROM allowlist WHERE password = ?",
            [pw],
        );

        if (lastIps.length === 0) {
            // cool, cool, cool, seems someone mistyped the password, or wants to HACKFUCK our little CYBERHEART to KILLDEATH, how'bout no
            return new Response(
                `you won't believe what just happened with your request after we run password validation`,
                { status: 403 },
            );
        }

        if (b.get("action") == "generate") {
            await generate();
            return new Response("generated");
        }

        const clientIp = req.headers.get("x-real-ip");

        if (!clientIp) {
            return new Response("missing x-real-ip header", { status: 400 });
        }

        const lastIp = lastIps[0][1];

        if (lastIp !== clientIp) {
            db.query("UPDATE allowlist SET client_ip = ? WHERE password = ?", [
                clientIp,
                pw,
            ]);
            const msg = `updated, last ip was: ${lastIp}, new is ${clientIp}`;
            console.log(
                (new Date()).toISOString(),
                `client: ${pw.substr(0, 3)}...${
                    pw.substr(-3)
                }       ${msg} ... generating IP allowlist`,
            );

            await generate();

            return new Response(msg, { status: 201 });
        } else {
            return new Response(`no update needed, ip ${clientIp}`);
        }
    });
};


enum Features {
    ListClients,
    AddClient,
    Server,
}

const print_help = () => {
    const menu = enumToCli(Features);

    console.log(menu.map((x) => `--${x.regularizedName}`).join("\n"));
};

if (Deno.args.length > 0) {
    if (Deno.args[0] == "--server") {
        await server()

    } else if (Deno.args[0] == "--list-clients") {
        console.log("clients in the DB currently");

        const rows = db.query<[string, string]>(
            "SELECT DISTINCT * FROM allowlist",
        );

        console.log(rows.length);
    } else if (Deno.args[0] == "--add-client") {
        console.log(
            "trying to add new client, CLI help:  ./server.ts --add-client abcxyzPassword",
        );

        if (!Deno.args[1]) {
            console.log("missing password");
            Deno.exit(1);
        }

        const pw = Deno.args[1];

        const lastIp = db.query<[string, string]>(
            "SELECT password, client_ip FROM allowlist WHERE password = ?",
            [pw],
        );

        if (lastIp.length > 0) {
            console.log("already added, but thanks.");
            Deno.exit(0);
        }

        db.query("INSERT INTO allowlist (password) VALUES (?)", [pw]);

        console.log(`added client with pw: ${pw}`);
    } else {
        print_help();
    }
} else {
    print_help();
}

const generate = async () => {
    const ips = [
        ...new Set(
            db.query<[string]>("SELECT client_ip FROM allowlist").flat(),
        ),
    ];

    await Deno.writeTextFile("ip-allowlist.txt", ips.join("\n"));

    const yaml = csParserYamlTemplate;
    const list = yaml.whitelist as Record<string, unknown>
    list.ip = ips

    await Deno.writeTextFile("allowed-ip-list.yaml", stringify(yaml));

    console.log(`done, list has ${ips.length} addresses`);
};
