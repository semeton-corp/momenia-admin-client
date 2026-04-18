export function extractImageKey(url: string) {
    if (!url) return "";

    // find "landing-page/..."
    const index = url.indexOf("landing-page/");
    if (index !== -1) {
        return url.slice(index);
    }

    return url; // already key
}