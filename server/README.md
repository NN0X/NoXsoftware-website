# Server side (Raspberry Pi)

The site itself is static (`dist/`). The only thing that runs on the Pi is the F1 ratings refresh:
a systemd timer clones [F1Ratings](https://github.com/NN0X/F1Ratings), runs it on the Kaggle
dataset ([jtrotman/formula-1-race-data](https://www.kaggle.com/datasets/jtrotman/formula-1-race-data))
and publishes `/data/f1.json`, which the site reads in the browser. The ratings stay current
without rebuilding or redeploying the site.

```
noxsoftware-f1.timer (Mon + Thu 06:00)
  └─ refresh.sh   git clone/pull F1Ratings → venv → export.py
       └─ /var/www/noxsoftware-data/f1.json   (atomic replace; the old file stays on failure)
            └─ Apache: /data/f1.json → read by the f1 window, `f1ratings` and /projects/f1ratings/
```

## Setup

Needs Python 3.12 or newer (F1Ratings uses PEP 701 f-strings) and git.

```sh
sudo useradd --system --create-home --home-dir /var/lib/noxsoftware noxsoftware
sudo mkdir -p /opt/noxsoftware /var/www/noxsoftware-data
sudo chown noxsoftware: /var/www/noxsoftware-data
sudo cp -r server /opt/noxsoftware/
sudo cp server/systemd/noxsoftware-f1.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now noxsoftware-f1.timer
sudo systemctl start noxsoftware-f1.service   # first run now; takes a while on a Pi
journalctl -u noxsoftware-f1 -f
```

If `python3` is older than 3.12, point the service at a newer one with
`Environment=F1_PYTHON=/usr/bin/python3.12` (`systemctl edit noxsoftware-f1`).

The dataset is public and `kagglehub` downloads it without an account. Should Kaggle start
requiring one, put an API token in `/var/lib/noxsoftware/.kaggle/kaggle.json` (mode 600).

## Apache

The data lives outside the deployed site so a deploy never replaces it:

```apache
Alias /data/ /var/www/noxsoftware-data/
<Directory /var/www/noxsoftware-data>
        Require all granted
        Options -Indexes
        Header set Cache-Control "no-cache"
</Directory>
```

## Local development

```sh
npm run f1:fixture   # synthetic data, no Kaggle needed → public/data/f1.json
npm run f1           # the real thing, if Kaggle is reachable
```

Both need Python 3.12+ (`F1_PYTHON=python3.12 npm run f1:fixture` if it is not the default).
`public/data/` is git-ignored. Without the file the site says the ratings have not been
generated yet.
