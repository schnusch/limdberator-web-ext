import { BackgroundStatus, ScrapedTitle, ScrapedPerson } from "./scrape"

browser.runtime.onMessage.addListener(async (result: ScrapedTitle|ScrapedPerson): Promise<BackgroundStatus> => {
    console.log(result)
    try {
        const response = await fetch("https://schnusch.de/limdberator/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(result),
        })
        if(!response.ok) {
            throw "upload failed:\n  " + (await response.text()).replace(/\s+$/, "").replace(/\n/g, "\n  ")
        }
    } catch(error) {
        console.error(result.id, error)
        return {
            error: String(error),
        }
    }
    console.log(result.id, "success")
    return {
        success: "success",
    }
})
