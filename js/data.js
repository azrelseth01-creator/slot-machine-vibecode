/* ================= DATA ================= */
const GLYPH = { game:'🕹', edu:'📚', rainbow:'🌈' };
const LABEL = { game:'Game', edu:'Learn', rainbow:'Rainbow' };

const IDEAS = {
  game: [
    ['Snake, But Chonky','Classic snake, except the snake gets heavier and slower the more it eats.','Pixel-art snake with a wobble animation, screen shake on eating, and a chunky 8-bit soundtrack.'],
    ['Falling Blocks','A block-stacking puzzle with ghost pieces, hold, and a score that feels great.','Tetris-style falling blocks with ghost piece, hold slot, line-clear particles, and increasing speed.'],
    ['Flappy Cassette','Tap to keep a flying cassette tape in the air between pipes made of speakers.','One-button flappy game with a retro cassette character, parallax background, and best-score memory.'],
    ['Memory Match 71','Flip cards and match pairs. Cards are all old-timey objects.','Memory card game with 3D flip animation, move counter, timer, and three difficulty sizes.'],
    ['Word Guess Daily','Guess the hidden five-letter word in six tries.','Wordle-style game with on-screen keyboard, shake on invalid words, and shareable emoji result grid.'],
    ['Minesweeper Deluxe','Reveal tiles without hitting mines. Flag with right-click or long-press.','Minesweeper with first-click safety, flood fill, mobile long-press flagging, and a timer.'],
    ['Pong Showdown','Two paddles, one ball, endless rivalry. Play a friend or a bot.','Pong with adjustable AI difficulty, ball speed-up per rally, and glowing CRT look.'],
    ['Brick Breaker','Smash bricks with a bouncing ball and catch power-ups.','Breakout clone with multi-hit bricks, falling power-ups, and levels generated from patterns.'],
    ['2048 Remix','Slide and merge numbered tiles. Tiles are retro wooden tokens.','2048 with swipe + arrow controls, undo, smooth slide animations, and local best score.'],
    ['Tic-Tac-Toe vs Genius','An unbeatable tic-tac-toe bot. Good luck even drawing.','Tic-tac-toe with a minimax AI, choice of X or O, and a win-line drawing animation.'],
    ['Typing Race','Race a car by typing words faster than your rivals.','Typing game where accuracy and WPM move a car on a track against 3 AI racers.'],
    ['Tiny Platformer','Run, jump and collect coins across three handmade levels.','Single-file canvas platformer with coyote time, tile maps, collectible coins, and level select.'],
    ['Idle Cookie Bakery','Click to bake, buy ovens, and watch the numbers go brrr.','Idle clicker with upgrades, offline progress, and a bakery that visually grows.'],
    ['Asteroid Field','Rotate, thrust, and shoot rocks in the void.','Asteroids clone with vector graphics, wrapping edges, particle explosions, and ship lives.'],
    ['Dungeon Dice','Roll dice to move through a small randomly generated dungeon.','Turn-based dice dungeon crawler with monsters, loot, a health bar, and a seed you can share.'],
    ['Whack-a-Mole Arcade','Smack the moles before they duck back into the dirt.','Whack-a-mole with escalating speed, bonus golden moles, combo counter, and sound effects.']
  ],
  edu: [
    ['Periodic Table Explorer','Click an element to see its story, uses, and electron shells.','Interactive periodic table with category filters, a search box, and an animated Bohr-model view.'],
    ['Solar System To Scale','Scroll across the true, painfully huge distances between planets.','Horizontal scroll site showing the solar system at true scale with fun facts at each planet.'],
    ['Pizza Fractions','Slice pizzas to learn fractions, halves, thirds and equivalence.','Fraction learning game: drag slices to match target fractions, with instant visual feedback.'],
    ['Morse Code Trainer','Learn dots and dashes with sound, then test yourself.','Morse trainer with tap-to-send key, audio playback at adjustable speed, and spaced-repeat drills.'],
    ['Sorting Visualizer','Watch bubble, merge, quick and heap sort race each other.','Sorting algorithm visualizer with speed slider, comparisons counter, and side-by-side races.'],
    ['Piano Keys Lab','Learn notes, chords and scales on an on-screen keyboard.','On-screen piano that teaches chords and scales with highlighted keys and synthesized sound.'],
    ['World Capitals Quiz','Pick the right capital on a map. Streaks unlock harder rounds.','Geography quiz with a clickable SVG world map, streak scoring, and region filters.'],
    ['Binary Buddy','Flip bits and watch decimal numbers appear. Learn how computers count.','Binary learning toy with toggle switches, live decimal/hex, and small challenge puzzles.'],
    ['Gravity Playground','Drop planets and moons into a sandbox and watch orbits form.','N-body gravity sandbox with draggable bodies, trails, and presets like binary stars.'],
    ['Color Mixing Lab','Mix paint and light to see why they behave differently.','Interactive RGB vs CMY color mixing lesson with sliders and a quiz at the end.'],
    ['Flashcards That Remember','Make decks and let the app schedule what you will forget next.','Flashcard app with spaced repetition, deck import from pasted text, and progress charts.'],
    ['History Timeline Scroller','Scrub through a decade and watch events and inventions appear.','Scrollable timeline of 1960-1980 with events, inventions, and quizzes, styled like an old almanac.'],
    ['Volcano Simulator','Tune pressure, silica and gas to see which eruption you get.','Educational volcano simulator with sliders, animated eruptions, and explanations of each type.'],
    ['Plant Growth Journal','Pick sun, water and soil and see how a virtual plant grows.','Plant biology sim that grows an animated plant over days based on user-chosen conditions.']
  ],
  rainbow: [
    ['Kaleidoscope Doodle','Draw with your finger and watch it multiply into mandalas.','Canvas kaleidoscope with 6-12 mirrored segments, color cycling brush, and PNG export.'],
    ['Mood Ring Weather','A mood ring that changes color based on your cursor and the time of day.','A giant mood-ring page that shifts hues based on mouse movement, time, and a tiny mood quiz.'],
    ['Confetti Cannon','Press a button, receive joy. Many cannons, many styles.','Confetti playground with different cannon types, physics, and satisfying sound effects.'],
    ['Lava Lamp','A soothing lava lamp you can poke, shake and recolor.','WebGL or canvas metaballs lava lamp with color palettes and a tilt-to-slosh effect.'],
    ['Compliment Machine','Press for a wholesome, absurd compliment. Collect all of them.','Random compliment generator with wacky categories, a collection book, and a share card.'],
    ['Retro Screensaver Museum','Bouncing logos, pipes and starfields, but all handmade.','A gallery of five retro screensavers you can click through in full-screen mode.'],
    ['Gradient Gacha','Pull a random gradient and collect the rare ones.','Gradient collecting game with rarities, copy-CSS button, and a gallery of what you collected.'],
    ['Emoji Rain Chaos','Make it rain emoji. Tilt your phone to blow them around.','Physics emoji rain with matter-style collisions, gyroscope support, and a tap-to-explode mode.'],
    ['Rainbow Piano','Every key makes a color and a sound. Compose a light show.','Musical rainbow instrument where each key triggers a note and a full-screen color burst.'],
    ['Tiny Orbit Toy','A zen toy with glowing balls circling each other in loops.','Generative orbital toy with sliders for count, speed and color, plus ambient music.'],
    ['Pixel Sunrise','A tiny pixel sunrise that matches your real local time.','Pixel-art landscape whose sky transitions through the day based on the actual time.'],
    ['Weird Fortune Teller','A vintage fortune teller who is completely unreliable.','Retro fortune teller booth that gives funny fortunes, with a flickering lamp and card animations.']
  ]
};

const CATS = Object.keys(IDEAS);
const ALL = [];
CATS.forEach(c => IDEAS[c].forEach(([title, blurb, prompt]) => ALL.push({cat:c, title, blurb, prompt})));
const pick = a => a[Math.floor(Math.random()*a.length)];

