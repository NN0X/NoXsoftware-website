import json, subprocess, collections
H = 'hist/'
def git(r, *a):
        return subprocess.run(['git', '-C', H + r] + list(a), capture_output=True, text=True).stdout
repos = ['ProjectSulla', 'TDC2', 'Maiora', 'CiceroTokenizer', 'SocratesNSLM', 'ProjectEuterpe', 'ProjectSybilla', 'Programmar', 'PasswordGenerator', 'F1Ratings', 'Brutus-Encryption', 'Arch-Utility-Scripts', 'NoXsoftware-website', 'Chess', 'HMAC', 'Totality-Encrypted-Archive-Utility']
EX = {
        'ProjectSulla': ('src/gates.cpp', 26, 44, 'cpp'),
        'TDC2': ('src/pqldp/pqldp_antireplay.c', 11, 22, 'c'),
        'Maiora': ('testing/0-hello-world/main.mai', 1, 8, 'mai'),
        'CiceroTokenizer': ('src/tokenizer.cpp', 20, 40, 'cpp'),
        'Brutus-Encryption': ('src/brutus.cpp', 10, 15, 'cpp'),
        'ProjectSybilla': ('src/game.cpp', 107, 124, 'cpp'),
        'F1Ratings': ('f1ratings/compute_driver.py', 5, 18, 'py'),
        'Programmar': ('src/controllers/AppController.php', 1, 20, 'php'),
}
out = {}
for r in repos:
        act = collections.Counter()
        for d in git(r, 'log', '--format=%ad', '--date=format:%Y-%m').split():
                act[d] += 1
        logs = [l.split('|', 2) for l in git(r, 'log', '-6', '--no-merges', '--format=%h|%ad|%s', '--date=short').strip().split('\n') if l]
        tree = []
        for l in git(r, 'ls-tree', 'HEAD').strip().split('\n'):
                meta, name = l.split('\t')
                tree.append([name, meta.split()[1] == 'tree'])
        tree.sort(key=lambda t: (not t[1], t[0].lower()))
        last = git(r, 'log', '-1', '--format=%ad', '--date=short').strip()
        d = {'act': dict(sorted(act.items())), 'log': logs, 'tree': tree, 'last': last}
        if r in EX:
                p, a, b, lang = EX[r]
                src = git(r, 'show', 'HEAD:' + p).split('\n')
                d['ex'] = {'path': p, 'start': a, 'lang': lang, 'code': '\n'.join(src[a - 1:b]).replace('\t', '        ')}
        out[r] = d
open('repo_data.json', 'w').write(json.dumps(out, ensure_ascii=False))
for r in repos:
        print(r, out[r]['last'], len(out[r]['tree']), 'ex' in out[r], sum(out[r]['act'].values()))
print(out['CiceroTokenizer']['ex']['code'])
