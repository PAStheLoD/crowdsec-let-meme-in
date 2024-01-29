#!/usr/bin/env -S deno run --allow-net --allow-write --allow-read server.ts



///# https://github.com/dyedgreen/deno-sqlite/issues/255

import { DB } from "https://deno.land/x/sqlite@v3.8/mod.ts";


const port = 7891;


const db = new DB("allowlist.db");
db.execute(`
  CREATE TABLE IF NOT EXISTS allowlist (
    password TEXT ,
    client_ip TEXT,
    PRIMARY KEY (password, client_ip)
  )
`);




const handler = (request: Request): Response => {
  const body = `Your user-agent is:\n\n${
    request.headers.get("user-agent") ?? "Unknown"
  }`;

  return new Response(body, { status: 200 });
};


if (Deno.args.length > 1) {
    if (Deno.args[1] == '--add-client') {
        console.log('trying to add new client, CLI help:  ./server.ts --add-client abcxyzPassword')

        if (! Deno.args[2]) {
            console.log('missing password')
            Deno.exit(1)
        }

        const pw = Deno.args[2]

        const lastIp = db.query<[string, string]>("SELECT password, client_ip FROM allowlist WHERE password = ?", [ pw ]); 
        
        if (lastIp.length > 0) {
            console.log('already added, but thanks.')
            Deno.exit(0)
        }

        db.query('INSERT INTO allowlist (password) VALUES (?)', [ pw ])

        console.log(`added client with pw: ${pw}`)

    }

    Deno.exit(0)
}

console.log(`HTTP server running. Access it at: http://localhost:${port}/`);
Deno.serve({ port }, async (req: Request, info: ServeHandlerInfo) => {
    if (! req.body) { return new Response('missing body', { status: 400 }) }

    const b = await req.formData()
    console.log(b, b.get('password'), info, info.remoteAddr, req.headers.get('x-real-ip'))

    const pw = b.get('password')

    if (! pw) { return new Response('missing pw', { status: 400 }) }



    const lastIps = db.query<[string, string]>("SELECT password, client_ip FROM allowlist WHERE password = ?", [ pw ]);

    if (lastIps.length === 0) {
        // cool, cool, cool, seems someone mistyped the password, or wants to HACKFUCK our little CYBERHEART to KILLDEATH, how'bout no
        return new Response(`you won't believe what just happened with your request after we run password validation`, { status: 403 })
    }

    const clientIp = req.headers.get('x-real-ip')

    if (! clientIp) { return new Response('missing x-real-ip header', { status: 400 }) }

    const lastIp = lastIps[0][1]

    if (lastIp !== clientIp) {
        db.query('UPDATE allowlist SET client_ip = ? WHERE password = ?', [ clientIp ,pw ])
        const msg = `updated, last ip was: ${lastIp}, new is ${clientIp}`
        console.log((new Date()).toISOString(), `client: ${pw.substr(0, 3)}...${pw.substr(-3)}       ${msg}`)

        return new Response(msg, { status: 201 })
    } else {
        return new Response(`no update needed, ip ${clientIp}`, { status: 200 })
    }


});
