function getById(id) {
  return document.getElementById(id);
}

export function initHorizontalSlider(trackId, prevBtnId, nextBtnId, amount = 240) {
  const track = getById(trackId);
  const prev = getById(prevBtnId);
  const next = getById(nextBtnId);

  if (!track || !prev || !next) return;

  const update = () => {
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth - 2);
    const noOverflow = maxScroll <= 4;

    prev.disabled = noOverflow || track.scrollLeft <= 2;
    next.disabled = noOverflow || track.scrollLeft >= maxScroll;

    prev.classList.toggle("is-hidden", noOverflow);
    next.classList.toggle("is-hidden", noOverflow);
  };

  prev.onclick = () => {
    track.scrollBy({ left: -amount, behavior: "smooth" });
    window.setTimeout(update, 220);
  };

  next.onclick = () => {
    track.scrollBy({ left: amount, behavior: "smooth" });
    window.setTimeout(update, 220);
  };

  track.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);

  const images = track.querySelectorAll("img");
  images.forEach((img) => {
    if (!img.complete) {
      img.addEventListener("load", update, { once: true });
      img.addEventListener("error", update, { once: true });
    }
  });

  window.requestAnimationFrame(update);
  setTimeout(update, 80);
  setTimeout(update, 250);
  setTimeout(update, 500);
}