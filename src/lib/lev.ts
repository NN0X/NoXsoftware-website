// Optimal string alignment distance: Levenshtein plus adjacent transpositions (gti → git is one edit).
export function lev(a: string, b: string): number
{
        const d: number[][] = [];
        for (let i = 0; i <= a.length; i++)
        {
                d[i] = [i];
                for (let j = 1; j <= b.length; j++)
                {
                        const row = d[i] as number[];
                        if (i === 0)
                        {
                                row[j] = j;
                                continue;
                        }
                        const prev = d[i - 1] as number[];
                        let v = Math.min((prev[j] ?? 0) + 1, (row[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1));
                        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1])
                        {
                                v = Math.min(v, ((d[i - 2] as number[])[j - 2] ?? 0) + 1);
                        }
                        row[j] = v;
                }
        }
        return (d[a.length] as number[])[b.length] ?? 0;
}
