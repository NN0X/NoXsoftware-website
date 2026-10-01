// What Firefox does with whatever was typed into the address bar.
export function normalizeUrl(value: string): string
{
        const v = value.trim();
        if (!v)
        {
                return "about:newtab";
        }
        if (/^about:/i.test(v))
        {
                return v.toLowerCase();
        }
        if (/^https?:\/\//i.test(v))
        {
                return v.replace(/^http:/i, "https:");
        }
        if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(v))
        {
                return "https://" + v;
        }
        return "about:search?q=" + encodeURIComponent(v);
}
