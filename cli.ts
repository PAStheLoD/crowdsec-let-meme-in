type Enum<E> = Record<keyof E, number | string> & { [k: number]: string };

const enumValues = <T,>(enu: Enum<T>) => {
  const r = []

  for (const e in enu) {
    if (parseInt(e).toString() === e) {
      r.push(enu[e])
    }
  }
  return r
}


export const enumToCli = <E,>(e: Enum<E>) => { 

  const features = enumValues(e)

  const good = new RegExp(/^[A-Za-z0-9_ -]+$/)

  type MenuItem = { name: string, regularizedName: string }

  const menu: MenuItem[] = []

  features.forEach(name => {
    if (!good.test(name)) {
      throw new Error(`internal error: feature names must not contain weird fucking characters. yet here we have: "${name}"   (good names match this RegExp ${good.source})`)
    }


    const menuItem = []
    let word = []

    const hasDash = (str: string) => str.startsWith('-') || str.endsWith('-')

    for (let i = 0, len = name.length; i < len; i++) {
      const ch = name[i]

      const code = name.charCodeAt(i);
      const prev = word.length > 0 ? word[word.length - 1] : ""


      if (ch === '_' || ch === ' ') {

        menuItem.push(word.join(""))
        word = []

      } else if (code > 64 && code < 91) { // A-Z (uppercase), so we start a new word

        menuItem.push(word.join(""))
        word = []

        word.push(ch.toLowerCase())

      } else {
        word.push(ch)
      }
    }

    if (word.length > 0) {
      menuItem.push(word.join(""))
    }

    const regularizedName = menuItem
      .filter(x => x.length > 0)
      .filter(x => x !== '-')
      .map(part => (part.length == 2 && part[0] === '-') ? part[1] : part)
      .map(part => (part.length == 2 && part[1] === '-') ? part[0] : part)
      .join("-")

    if (menu.map(x => x.regularizedName).includes(regularizedName)) {
      const colliding = menu.filter(x => x.regularizedName === regularizedName)[0]
      throw new Error(`internal error: regularized feature names must be unique, yet here we are: ${name} regularizes to ${regularizedName} which is already in the menu (collides with ${colliding.name})`)
    }

    menu.push({ name, regularizedName })
  })

  return menu

}

