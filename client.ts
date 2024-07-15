#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env


import { load } from "@std/dotenv";

// try to load .env files
const env = await load();


const body = new URLSearchParams();
body.append('password', env['PASSWORD']);


const update = async () => {
    
    const response = await fetch(env['SERVER_URI'], {
        method: 'POST',
        body
    });
    
    console.log(response)
}



await update()

console.log('first succeeded, starting update loop')

setInterval(update, 60 * 3600 * 1000)
