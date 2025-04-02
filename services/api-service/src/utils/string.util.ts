export function generateRefCode(): string {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const timestamp = Date.now().toString(36);

    const timeComponent = timestamp.slice(-6);

    let randomComponent = "";
    for (let i = 0; i < 6; i++) {
        randomComponent += chars[Math.floor(Math.random() * chars.length)];
    }

    return timeComponent + randomComponent;
}

/**
 * Format Name
 *
 * Takes a string trims it and capitalizes every word
 */
export function formatName(title: string): string {
    return title
        .trim()
        .replace(/\n/g, " ")
        .replace(/\s\s+/g, " ")
        .replace(/\w\S*/g, (w) => w.replace(/^\w/, (l) => l.toUpperCase()));
}

export const slugify = (val: string) => {
    if (!val) return "";

    return String(val)
        .normalize("NFKD") // split accented characters into their base characters and diacritical marks
        .replace(/[\u0300-\u036f]/g, "") // remove all the accents, which happen to be all in the \u03xx UNICODE block.
        .trim() // trim leading or trailing whitespace
        .toLowerCase() // convert to lowercase
        .replace(/[^a-z0-9 -]/g, "") // remove non-alphanumeric characters
        .replace(/\s+/g, "-") // replace spaces with hyphens
        .replace(/-+/g, "-"); // remove consecutive hyphens
};
