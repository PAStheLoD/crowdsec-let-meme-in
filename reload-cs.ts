#!/usr/bin/env -S deno run  --allow-read --allow-write --allow-run=/bin/systemctl


import { exists } from "https://deno.land/std@0.213.0/fs/mod.ts"


const source = 'allowed-ip-list.yaml'
const target = '/etc/crowdsec/parsers/s02-enrich/allowed-ips-from-file.yaml'

console.log(`is ${source} newer than ${target} ?`)

const updateAndReload = () => {
    console.log('updating YAML')

    Deno.rename(source, target)

    console.log(new Deno.Command('/bin/systemctl', { args: ['reload', 'crowdsec'] }).outputSync())
}


const map = async (o, f) => Object.fromEntries(
    await Promise.all(
        Object.keys(o).map(async k => [
            k,
            await f(o[k])
        ])
    )
)


const lastModified = await map({ source, target }, async f => {
    if (! await exists(f) ) {
        console.log(`${f} doesn't exists`)
        return false
    }
    
    return (await Deno.stat(f)).mtime
})


if (! lastModified.source) {
    console.log('no update today ... source does not exists')
    Deno.exit(0)
}

if (! lastModified.target) {
    console.log('target file does not exist, creating it and reloading crowdsec')
    updateAndReload()
}

if ( lastModified.source > lastModified.target ) {
    console.log('finally a good old update')
    updateAndReload()
} else {
    console.log(`no, source ${last}`)
}
