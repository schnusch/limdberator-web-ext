import { BackgroundStatus, scrape } from "./scrape"
import { error, success } from "tata-js/tata.js"

function format_message(text: string): string {
    const small = document.createElement("small")
    small.appendChild(document.createElement("pre"))
         .appendChild(document.createTextNode(text))
    return small.outerHTML
}

const scraped = scrape()
if(scraped) {
    browser.runtime.sendMessage(scraped).then((resp: BackgroundStatus): void => {
        console.log(resp)
        if(resp?.success) {
            success("LIMDberator", format_message(resp.success))
        } else if(resp?.error) {
            error("LIMDberator", format_message(resp.error))
        }
    })
}
