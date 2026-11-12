# Server side (Raspberry Pi)

Two systemd timers run on the Pi; nothing ever connects to it from outside.

```
GitHub: push to master ─▶ deploy.yml builds and publishes the "site" release
                                                   │ polled every 5 min
Pi:  noxsoftware-deploy.timer ─▶ deploy/pull.sh ◀──┘
        /var/www/noxsoftware/releases/<commit>/{site,server,VERSION}
        /var/www/noxsoftware/current ─▶ releases/<commit>     (atomic symlink swap)
        Apache DocumentRoot: /var/www/noxsoftware/current/site

     noxsoftware-f1.timer (Mon + Thu 06:00) ─▶ f1/refresh.sh
        git clone/pull F1Ratings ─▶ venv ─▶ export.py
        /var/www/noxsoftware-data/f1.json  (outside the releases, so a deploy never touches it)
        Apache: /data/f1.json ─▶ read by the f1 window, `f1ratings` and /projects/f1ratings/
```

Both services run their scripts from `current/server/`, so the scripts update with each deploy.
The unit files themselves only change when you copy them again (step 4 below).

## Setup

Needs Apache 2.4 with `mod_rewrite` and `mod_headers`, git, curl, and Python 3.12 or newer
(F1Ratings uses PEP 701 f-strings).

```sh
# 1. a user that owns the site and the data, nothing else
sudo useradd --system --create-home --home-dir /var/lib/noxsoftware noxsoftware
sudo mkdir -p /var/www/noxsoftware /var/www/noxsoftware-data
sudo chown noxsoftware: /var/www/noxsoftware /var/www/noxsoftware-data

# 2. the first deploy, straight from the release (later ones come from the timer)
curl -fsSL https://raw.githubusercontent.com/NN0X/NoXsoftware-website/master/server/deploy/pull.sh -o /tmp/pull.sh
sudo -u noxsoftware bash /tmp/pull.sh

# 3. Apache: see below, then
sudo a2enmod rewrite headers && sudo systemctl reload apache2

# 4. the timers
sudo cp /var/www/noxsoftware/current/server/systemd/noxsoftware-* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now noxsoftware-deploy.timer noxsoftware-f1.timer
sudo systemctl start noxsoftware-f1.service   # first ratings now; takes a while on a Pi
journalctl -u noxsoftware-f1 -f
```

If `python3` is older than 3.12, point the ratings job at a newer one with
`Environment=F1_PYTHON=/usr/bin/python3.12` (`sudo systemctl edit noxsoftware-f1`).

## Apache

Merge this into the existing virtual host (keep its TLS and Cloudflare lines); the old site's
`DocumentRoot` is replaced by the `current` symlink.

```apache
<VirtualHost *:80>
        ServerName noxsoftware.pl
        DocumentRoot /var/www/noxsoftware/current/site
        <Directory /var/www/noxsoftware>
                # current is a symlink, and the site's .htaccess does redirects, error pages and headers
                Options FollowSymLinks
                AllowOverride All
                Require all granted
        </Directory>

        Alias /data/ /var/www/noxsoftware-data/
        <Directory /var/www/noxsoftware-data>
                Options -Indexes
                Require all granted
                Header set Cache-Control "no-cache"
        </Directory>
</VirtualHost>
```

Cloudflare sits in front; nothing else is needed there. HTML is sent with `no-cache`, so a deploy
shows up on the next page load.

## Deploys

Every push to `master` runs `.github/workflows/deploy.yml`: lint, type check, tests, build, then it
replaces the assets of the `site` release (`site.tar.gz`, its SHA-256, and `VERSION`, uploaded
last). Release downloads are public, so the Pi needs no GitHub token.

`pull.sh` downloads a build only when `VERSION` changed, checks the checksum and that the archive is
the commit `VERSION` names, unpacks it next to the live one and swaps the `current` symlink in one
rename. Anything wrong leaves the live site alone and the next run tries again. The three newest
releases stay on disk.

```sh
sudo -u noxsoftware /var/www/noxsoftware/current/server/deploy/pull.sh --rollback  # previous build, stays put
sudo -u noxsoftware /var/www/noxsoftware/current/server/deploy/pull.sh --force     # back to the newest build
journalctl -u noxsoftware-deploy                                                  # what the timer did
```

A deploy can also be started by hand from the repository's Actions tab ("Deploy", "Run workflow").

## F1 ratings

`f1/refresh.sh` clones or updates [F1Ratings](https://github.com/NN0X/F1Ratings), installs its
requirements into a private virtualenv (only when they change), runs it unmodified on the Kaggle
dataset ([jtrotman/formula-1-race-data](https://www.kaggle.com/datasets/jtrotman/formula-1-race-data))
through `f1/export.py`, and atomically replaces `/var/www/noxsoftware-data/f1.json`. If a run fails,
the previous file stays, so the site keeps the last good ratings.

The dataset is public and `kagglehub` downloads it without an account. Should Kaggle start
requiring one, put an API token in `/var/lib/noxsoftware/.kaggle/kaggle.json` (mode 600).

## Local development

```sh
npm run f1:fixture   # synthetic ratings, no Kaggle needed → public/data/f1.json
npm run f1           # the real thing, if Kaggle is reachable
```

Both need Python 3.12+ (`F1_PYTHON=python3.12 npm run f1:fixture` if it is not the default).
`public/data/` is git-ignored. Without the file the site says the ratings have not been
generated yet.
