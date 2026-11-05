# Explainer Reel brief (template)

Copy everything below the line, replace each [BRACKET], and send it to Claude.
The answers to questions Claude asked last time are already built in, so it can go straight to the storyboard.

First used for: `videos/stop-doing-manually-2027.html` → `out/stop-doing-manually-2027.mp4`

---

CONTEXT: I run [BUSINESS NAME] for [AUDIENCE]. This video plays on [PLATFORM, e.g. Facebook Reels] for [AUDIENCE].

RESULT: A [DURATION, e.g. 15]-second animated explainer, [SIZE: 1080x1920 for Reels/TikTok/Shorts, 1920x1080 for YouTube/web], using brand.css.

Title: [TITLE]

Then these steps appear one at a time, each with a big number, a short headline and one small line under it:
1. [STEP 1 HEADLINE] ([STEP 1 SMALL LINE])
2. [STEP 2 HEADLINE] ([STEP 2 SMALL LINE])
3. [STEP 3 HEADLINE] ([STEP 3 SMALL LINE])
[ADD OR REMOVE STEPS AS NEEDED]

End on "[END CARD NAME, e.g. 23 Forever Bookkeeping & Solutions]" with "[CALL TO ACTION, e.g. Link in bio to book your consultation!]".

Post caption (NOT shown in the video, save it as a text file next to the MP4):
[POST CAPTION]

Smooth easing, no hard cuts. Accent font: [Great Vibes / Dancing Script].

OFF-LIMITS: No stock footage, no people, no words I didn't write, no colors outside brand.css. If anything is unclear, ask me before you build.

SHOW YOUR WORK: Before you write code, give me a scene-by-scene storyboard with timings and wait for my OK. After you build it, show me stills before the full render, and make sure every scene (title, each step, end card) appears in at least one still.

DELIVERY: Commit the MP4 to out/ and push it so I can download it from GitHub.

---

## Notes Claude follows for this format

- **Safe zones (9:16):** Facebook covers about the top 13% and bottom 32% of a Reel, plus a strip on the right. Keep all text inside x 90–950, y 250–1300.
- **Layout from last time:** the title words rise in (readable by about 1.2 s) → the title shrinks into a header at the top → steps build up one at a time and stay, linked by sage lines → the list drifts up as the end card rises in → the end card holds still for about 2 s.
- **Words:** parentheses in the steps become the small line, without the brackets. Headlines keep their punctuation as written. No added labels, taglines or hashtags.
- **Colors:** only the brand.css variables at full strength. Earlier steps don't fade back.
- **Sound:** silent. Music is added in the app when posting.
- **Timing guide:** about 3 s for the title, about 2.8 s per step, about 2.7 s for the end card. Add about 2.8 s for each extra step.
