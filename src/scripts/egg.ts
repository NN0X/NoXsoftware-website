// The easter-egg player, as on the old site: autoplays muted and loops, one click unmutes at a polite volume.
// The static markup has native controls, so it still works without JavaScript; wireEgg swaps them for the button.
import type { Egg } from "../data/eggs";

export function wireEgg(figure: HTMLElement): void
{
        const video = figure.querySelector("video");
        const button = figure.querySelector<HTMLButtonElement>("button.unmute");
        if (!video || !button || figure.dataset.wired)
        {
                return;
        }
        figure.dataset.wired = "1";
        if (matchMedia("(prefers-reduced-motion: reduce)").matches)
        {
                video.autoplay = false;
                video.pause();
                return;
        }
        video.controls = false;
        button.hidden = false;
        const unmute = (): void =>
        {
                video.muted = false;
                video.volume = 0.1;
                video.controls = true;
                button.hidden = true;
                void video.play().catch(() => undefined);
        };
        button.addEventListener("click", unmute);
        video.addEventListener("click", () =>
        {
                if (!button.hidden)
                {
                        unmute();
                }
        });
}

export function eggFigure(egg: Egg, unmuteLabel: string): HTMLElement
{
        const figure = document.createElement("figure");
        figure.className = "egg";
        const video = document.createElement("video");
        video.src = egg.video;
        video.poster = egg.poster;
        video.muted = true;
        video.loop = true;
        video.autoplay = true;
        video.playsInline = true;
        video.controls = true;
        video.setAttribute("aria-label", egg.title);
        const button = document.createElement("button");
        button.type = "button";
        button.className = "unmute";
        button.hidden = true;
        button.textContent = "🔇 " + unmuteLabel;
        figure.append(video, button);
        wireEgg(figure);
        return figure;
}
