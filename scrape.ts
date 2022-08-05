type CastMember = [string, string]

export type ScrapedTitle = {
    id: string,
    timestamp: number,
    title?: string,
    original_title?: string,
    rating?: string,
    rating_count?: number,
    year?: string,
    directors?: CastMember[],
    writers?: CastMember[],
    cast?: CastMember[],
    duration?: number,
    languages?: string[],
}

type FilmCredit = {
    id: string,
    credit_type: string[],
    tags: string[],
    title_info: {
        title?: string,
        year?: number,
        tags: string[],
    },
}

type Filmography = {[id: string]: FilmCredit}

export type ScrapedPerson = {
    id: string,
    timestamp: number,
    name?: string,
    birthday?: string,
    filmography?: Filmography,
}

export type ScrapeResult = {
    title: ScrapedTitle
} | {
    person: ScrapedPerson
}

export type BackgroundStatus = {
    error?: string,
    success?: string,
}

declare global {
    interface String {
        normalize_whitespace(): string
        lpad(length: number, char?: string): string
    }
}

String.prototype.normalize_whitespace = function(this: string): string {
    return this.replace(/\s+/g, " ").replace(/^ /, "").replace(/ $/, "")
}

String.prototype.lpad = function(this: string, length: number, char?: string): string {
    char = char || " "
    let s = this
    while(s.length < length) {
        s = char + s
    }
    return s
}

function find_leaves(elem: Element): Element[] {
    if(!elem.firstElementChild) {
        return [elem]
    }
    let leaves: Element[] = []
    for(const child of elem.children) {
        leaves = leaves.concat(find_leaves(child))
    }
    return leaves
}

function create_id_getter(re: RegExp): (() => string|null) {
    return (): string|null => {
        const m = location.pathname.match(re)
        if(!m) {
            return null
        }
        return m[1]
    }
}

function is_child_node(child: Node|null, parent: Node): boolean {
    for(; child; child = child.parentNode) {
        if(child == parent) {
            return true
        }
    }
    return false
}

export const get_title_id = create_id_getter(/^\/title\/(tt\d+)(\/fullcredits)?\/?$/)

export function get_title(): string|null {
    const h1 = document.querySelector("h1")
    if(!h1 || !h1.textContent) {
        return null
    }
    return h1.textContent.normalize_whitespace()
}

export function get_original_title(): string|null {
    const container = document.querySelector('[data-testid*="original-title"]')
    if(!container) {
        return null
    }
    const m = container.textContent?.match(/:(.*)$/)
    if(!m) {
        return null
    }
    return m[1].normalize_whitespace()
}

export function find_rating_element(): Array<[Element, Element]> {
    const container = document.querySelector('[href*="/ratings/"]')
    if(!container) {
        return []
    }
    const elems: Array<[Element, Element]> = []
    const leaves = find_leaves(container)
    for(const leaf2 of leaves) {
        for(const leaf1 of leaves) {
            if(leaf1 == leaf2) {
                break
            } else if(leaf1.parentElement == leaf2.parentElement) {
                elems.push([leaf1, leaf2])
            }
        }
    }
    return elems
}

export function get_rating(): string|null {
    for(const [leaf1, leaf2] of find_rating_element()) {
        const score = leaf1.textContent?.match(/^\s*(\d+([.,]\d+))?\s*$/)
        const of10 = leaf2.textContent?.match(/^\s*\/\s*10\s*$/)
        if(score && of10) {
            return score[0].normalize_whitespace().replace(/,/, ".")
        }
    }
    return null
}

export function get_rating_count(): number|null {
    for(const [leaf1, leaf2] of find_rating_element()) {
        for(let elem: Element|null = leaf1.parentElement; elem; elem = elem.nextElementSibling) {
            const m = elem.textContent?.match(/^\s*(\d+([,.]\d{3})*)\s*$/)
            if(m) {
                return parseInt(m[1].replace(/[,.]/g, ""), 10)
            }
        }
    }
    return null
}

export function get_release_year(): string|null {
    const year = document.querySelector('[href*="/releaseinfo"]')
    if(!year || !year.textContent) {
        return null
    }
    return year.textContent.normalize_whitespace()
}

function get_fullcredits(heading_selector: string): CastMember[] {
    const table = document.querySelector(`${heading_selector} ~ table`)
    if(!table) {
        return []
    }
    const people: CastMember[] = []
    for(const tr of table.querySelectorAll("tr")) {
        const a = tr.querySelector("td:not(.primary_photo) a")
        const id = a?.getAttribute("href")?.match(/name\/(nm\d+)/)
        const name = a?.textContent
        if(id && name) {
            people.push([id[1], name.normalize_whitespace()])
        }
    }
    return people
}

export function get_directors(): CastMember[] {
    const directors = get_fullcredits("#director")
    if(directors.length > 0) {
        return directors
    }
    const director_list = document.querySelector('[href*="fullcredits/director"]')?.parentElement?.querySelector("ul")
    if(!director_list) {
        return []
    }
    for(const a of director_list.querySelectorAll("[href]")) {
        const id = a.getAttribute("href")?.match(/name\/(nm\d+)/)
        if(id && a.textContent) {
            directors.push([id[1], a.textContent.normalize_whitespace()])
        }
    }
    return directors
}

export function get_writers(): CastMember[] {
    const writers = get_fullcredits("#writer")
    if(writers.length > 0) {
        return writers
    }
    const writer_list = document.querySelector('[href*="fullcredits/writer"]')?.parentElement?.querySelector("ul")
    if(!writer_list) {
        return []
    }
    for(const a of writer_list.querySelectorAll("[href]")) {
        const id = a.getAttribute("href")?.match(/name\/(nm\d+)/)
        if(id && a.textContent) {
            writers.push([id[1], a.textContent.normalize_whitespace()])
        }
    }
    return writers
}

export function get_cast(): CastMember[] {
    const cast = get_fullcredits("#cast")
    if(cast.length > 0) {
        return cast
    }
    for(const a of document.querySelectorAll('[data-testid="title-cast-item"] [data-testid="title-cast-item__actor"]')) {
        const id = a.getAttribute("href")?.match(/name\/(nm\d+)/)
        if(id && a.textContent) {
            cast.push([id[1], a.textContent.normalize_whitespace()])
        }
    }
    return cast
}

export function get_duration(): number|null {
    const duration = document.querySelector('[data-testid="title-techspec_runtime"] > :last-child')
    if(!duration) {
        return null
    }
    const m = duration.textContent?.match(/^\s*((\d+)\s+(hours?|stunden?)\s+)?((\d+)\s+(minute[ns])?)\s*/i)
    if(!m) {
        return null
    }
    return parseInt(m[2] || "0", 10) * 3600 + parseInt(m[5], 10) * 60
}

export function get_languages(): string[] {
    const langs: string[] = []
    for(const lang of document.querySelectorAll('[href*="primary_language="]')) {
        const m = lang.getAttribute("href")?.match(/[?&]primary_language=([^&#]*)/)
        if(m) {
            langs.push(m[1])
        }
    }
    return langs
}

export const get_person_id = create_id_getter(/^\/name\/(nm\d+)\/?$/)

export const get_name = get_title

export function get_birthday(): string|null {
    const time = document.querySelector("time")
    if(!time) {
        return null
    }
    const m = time.getAttribute("datetime")?.match(/^(\d+)-(\d+)-(\d+)$/)
    if(!m) {
        return null
    }
    return `${m[1].lpad(4, "0")}-${m[2].lpad(2, "0")}-${m[3].lpad(2, "0")}`
}

export function get_filmography(): Filmography {
    const filmography: Filmography = {}
    for(const elem of document.querySelectorAll('[id*="-tt"]')) {
        const m = elem.getAttribute("id")?.match(/^(.*)-(tt\d+)$/)
        if(!m) {
            continue
        }

        const id = m[2]
        const credit: FilmCredit = filmography[id] || (filmography[id] = {
            id: id,
            credit_type: [],
            tags: [],
            title_info: {
                tags: [],
            },
        })
        credit.credit_type.push(m[1])

        const title_elem = elem.querySelector(`[href*="${id}"]`)
        if(title_elem && title_elem.textContent) {
            credit.title_info.title = title_elem.textContent.normalize_whitespace()
        }

        const year_elem = elem.querySelector(".year_column")
        if(year_elem && year_elem.textContent) {
            credit.title_info.year = parseInt(year_elem.textContent.normalize_whitespace(), 10)
        }

        const credit_tags = new Set(credit.tags)
        const title_tags = new Set(credit.title_info.tags)
        let tag_text = ""
        for(const child of elem.childNodes) {
            if(child instanceof HTMLBRElement) {
                break
            } else if(child instanceof HTMLAnchorElement && child.classList.contains("in_production")) {
                // those in-production-tags belong to the title not the person's credit
                if(child.textContent) {
                    title_tags.add(child.textContent.normalize_whitespace())
                }
            } else if(!is_child_node(title_elem, child) && !is_child_node(year_elem, child)) {
                tag_text += child.textContent || ""
            }
        }
        tag_text = tag_text.normalize_whitespace()
        for(const tag of tag_text.replace(/^\((.*)\)$/, "$1").split(") (")) {
            if(tag.length > 0) {
                credit_tags.add(tag)
            }
        }
        credit.tags = Array.from(credit_tags)
        credit.title_info.tags = Array.from(title_tags)
    }
    return filmography
}

function set_if_not_null<T, K extends keyof T>(obj: T, key: K, value: T[K] | null): void {
    if(value != null) {
        obj[key] = value
    }
}

export function scrape(): ScrapeResult|null {
    let non_empty = false
    let id: string|null = null
    if((id = get_title_id())) {
        let result: ScrapedTitle = {
            id: id,
            timestamp: Math.floor(Date.now() / 1000),
        }
        if(location.pathname.indexOf("/fullcredits") < 0) {
            set_if_not_null(result, "title",          get_title())
            set_if_not_null(result, "original_title", get_original_title())
            set_if_not_null(result, "rating",         get_rating())
            set_if_not_null(result, "rating_count",   get_rating_count())
            set_if_not_null(result, "year",           get_release_year())
            set_if_not_null(result, "duration",       get_duration())
            set_if_not_null(result, "languages",      get_languages())
        }
        set_if_not_null(result, "directors", get_directors())
        set_if_not_null(result, "writers",   get_writers())
        set_if_not_null(result, "cast",      get_cast())
        if(Object.keys(result).length > 2) {
            return {title: result}
        }
    } else if((id = get_person_id())) {
        let result: ScrapedPerson = {
            id: id,
            timestamp: Math.floor(Date.now() / 1000),
        }
        set_if_not_null(result, "name",        get_name())
        set_if_not_null(result, "birthday",    get_birthday())
        set_if_not_null(result, "filmography", get_filmography())
        if(Object.keys(result).length > 2) {
            return {person: result}
        }
    }
    return null
}
