/**
 * Brew guides shown on /learn and /learn/[slug].
 *
 * Counts in the sidebar are derived from this array rather than typed by hand,
 * so a topic can never advertise more guides than exist.
 *
 * `lots` holds product slugs. The listing page promises that every guide links
 * the lots it was written for, so each guide names the coffees the method was
 * actually tuned on.
 */

export const TOPICS = [
  { id: "ibrik", label: "Ibrik & qahwa" },
  { id: "filter", label: "Filter" },
  { id: "espresso", label: "Espresso" },
  { id: "qishr", label: "Qishr" },
  { id: "history", label: "History" },
];

export const EQUIPMENT = ["Ibrik", "V60", "Moka pot", "Batch brewer"];

export const GUIDES = [
  // --- Ibrik & qahwa -----------------------------------------------------
  {
    slug: "ibrik-three-rises",
    title: "Ibrik: 30 s bloom, 3 rises",
    tag: "METHOD",
    min: 4,
    topic: "ibrik",
    equip: "Ibrik",
    summary:
      "The whole method is knowing when to lift the pot. Three times, each one earlier than feels comfortable.",
    lots: ["mokha-harasi", "dhikr-blend", "ibrik-copper-240"],
    sections: [
      {
        heading: "The ratio",
        body: "7 g of coffee to 70 ml of cold water, per cup. Measure the water in the cup you intend to drink from and pour it into the ibrik, because the pot has no useful markings and the foam will lie to you about volume.",
      },
      {
        heading: "The bloom",
        body: "Stir the grounds into the cold water before any heat touches it. Give it thirty seconds. Cold-stirring wets every particle evenly, and it is the difference between a smooth cup and one that tastes simultaneously sour and burnt.",
      },
      {
        heading: "The three rises",
        body: "Bring it up on low heat and do not stir again. The foam will climb the neck; lift the pot off the flame the moment it reaches the rim, let it fall, and return it. Three times. Each rise takes less time than the one before, so the third will catch you out if you look away.",
      },
      {
        heading: "The pour",
        body: "Rest it fifteen seconds so the grounds drop, then pour in one continuous motion, sharing the foam between cups rather than giving it all to the first. Anyone who gets a cup without foam will assume you did it wrong.",
      },
    ],
  },
  {
    slug: "cardamom-when-and-how-much",
    title: "Cardamom: when and how much",
    tag: "METHOD",
    min: 4,
    topic: "ibrik",
    equip: "Ibrik",
    summary:
      "One pod per two cups, cracked not ground, and added to the pot rather than the grinder.",
    lots: ["dhikr-blend", "mokha-harasi", "haraaz-red"],
    sections: [
      {
        heading: "How much",
        body: "One green pod per two cups. This is less than most recipes suggest and more than enough. Cardamom is a loud spice and the point is to sit behind the coffee, not to replace it.",
      },
      {
        heading: "Cracked, not ground",
        body: "Press the pod with the flat of a knife until it splits and drop the whole thing in. Ground cardamom loses its top notes within days and turns dusty in the cup. The seeds inside the pod keep until you crack them.",
      },
      {
        heading: "When to add it",
        body: "Into the pot with the cold water, at the same time as the coffee. Adding it later means it never gets the contact time to give anything up. Grinding it with the beans coats your burrs in oil and every subsequent coffee tastes faintly of it.",
      },
      {
        heading: "What it suits",
        body: "Cardamom belongs with the darker naturals, where it has cocoa and dried fruit to sit against. On a light washed lot it simply covers what you paid for.",
      },
    ],
  },
  {
    slug: "grinding-for-ibrik",
    title: "Grinding for ibrik: past espresso, into powder",
    tag: "METHOD",
    min: 3,
    topic: "ibrik",
    equip: "Ibrik",
    summary:
      "Finer than espresso, close to flour. If it feels wrong in your fingers you are probably close.",
    lots: ["mokha-harasi", "sanaa-espresso", "ibrik-copper-240"],
    sections: [
      {
        heading: "How fine",
        body: "Rub a pinch between finger and thumb. Espresso feels like table salt with some grit. Ibrik grind should feel like flour, with almost nothing to catch on. Most hand grinders will get there at their finest setting; most electric burr grinders for espresso will not go far enough.",
      },
      {
        heading: "Why so fine",
        body: "The coffee never leaves the water. There is no filter and no pressure, so extraction depends entirely on surface area and time. Anything coarser and you are drinking a weak cup with a mouthful of sediment at the bottom.",
      },
      {
        heading: "Grind fresh, but rest it",
        body: "Grind immediately before brewing. Powder this fine goes stale within the hour. If your grinder heats the coffee noticeably, let it sit sixty seconds before it meets water.",
      },
    ],
  },
  {
    slug: "sugar-in-the-pot",
    title: "Sugar in the pot, not in the cup",
    tag: "METHOD",
    min: 3,
    topic: "ibrik",
    equip: "Ibrik",
    summary:
      "Sugar added at the start changes how the foam forms. Added at the end it just makes the coffee sweet.",
    lots: ["dhikr-blend", "mokha-harasi"],
    sections: [
      {
        heading: "Why it goes in first",
        body: "Sugar dissolved into the cold water before heating raises the viscosity of the brew, and a thicker liquid holds a finer, more stable foam. Stir it in with the grounds. Spooning it into the finished cup collapses the foam you spent four minutes building.",
      },
      {
        heading: "The levels",
        body: "Ask before you brew, because you cannot correct it afterwards. Sada is unsweetened. Wasat is roughly half a teaspoon per cup. Helu is a full teaspoon or more. Serving a guest the wrong one is a small failure of hospitality rather than a matter of taste.",
      },
      {
        heading: "Unsweetened",
        body: "If you take it sada, use a lighter roast. The bitterness that sugar is covering in a dark lot has nowhere to hide without it.",
      },
    ],
  },
  {
    slug: "reading-the-foam",
    title: "Reading the foam: what the wesh tells you",
    tag: "METHOD",
    min: 4,
    topic: "ibrik",
    equip: "Ibrik",
    summary:
      "Large bubbles mean your heat was too high. No foam at all usually means stale coffee, not bad technique.",
    lots: ["mokha-harasi", "sanaa-espresso"],
    sections: [
      {
        heading: "Fine and even",
        body: "A tight, close-grained foam that holds its shape in the cup means the heat was low enough and the grind fine enough. This is what you are aiming for, and it is the first thing anyone judges the cup on.",
      },
      {
        heading: "Large, loose bubbles",
        body: "Your flame was too high. The water reached a rolling boil rather than climbing slowly, and boiling coffee strips out the aromatics and leaves bitterness behind. Halve the heat and accept that it takes twice as long.",
      },
      {
        heading: "No foam at all",
        body: "Almost always stale coffee. Foam is carbon dioxide left over from roasting, and a bag opened three weeks ago has very little left. Check the roast date before you blame your pot.",
      },
      {
        heading: "Foam that vanishes in the cup",
        body: "Either the cups were cold or you poured from too high. Warm the cups with hot water first and pour close to the rim.",
      },
    ],
  },

  // --- Filter ------------------------------------------------------------
  {
    slug: "v60-haraaz-naturals",
    title: "V60 for Haraaz naturals · 18:290",
    tag: "FILTER",
    min: 5,
    topic: "filter",
    equip: "V60",
    summary:
      "A slower, cooler recipe than most V60 guides give you, because Yemeni naturals give up their fruit early.",
    lots: ["haraaz-red", "haraaz-n2", "filter-papers-100"],
    sections: [
      {
        heading: "The recipe",
        body: "18 g in, 290 g out, water at 96 degrees, total time around 2:45. Medium grind, a little coarser than you would use for a washed Ethiopian.",
      },
      {
        heading: "The pours",
        body: "Bloom with 50 g and wait 40 seconds; these naturals degas more than you expect. Then three pours of 80 g each, starting each one as the bed is about to go dry. Pour into the centre and let the water find its own way out rather than chasing the grounds around the cone.",
      },
      {
        heading: "Why not hotter",
        body: "The fruit in a natural sits at the front of the extraction and the drying process has already done some of the work for you. Water at 96 rather than boiling keeps the stone fruit intact instead of pushing through to something jammy and flat.",
      },
      {
        heading: "If it tastes thin",
        body: "Grind finer before you add coffee. A thin cup from a natural is almost always underextraction rather than a weak ratio, and adding dose without adjusting grind just gives you more of the same thin cup.",
      },
    ],
  },
  {
    slug: "water-for-naturals",
    title: "Water: why yours is flattening the fruit",
    tag: "FILTER",
    min: 5,
    topic: "filter",
    equip: "V60",
    summary:
      "Hard water mutes acidity and the fruit goes with it. This is the single change that fixes most disappointing brews.",
    lots: ["haraaz-red", "yirgacheffe-lot-08", "dawairi-lot-04"],
    sections: [
      {
        heading: "What is going wrong",
        body: "Carbonate hardness buffers acidity. If your tap water is hard, it neutralises exactly the compounds that make a bright lot taste bright, and you get a cup that is technically correct and completely dull.",
      },
      {
        heading: "What to aim for",
        body: "Somewhere around 70 to 100 ppm total hardness, with alkalinity lower than hardness. You do not need a laboratory: most bottled water lists its mineral content on the label, and the difference between a good one and a bad one is immediately obvious in the cup.",
      },
      {
        heading: "What not to use",
        body: "Distilled or fully deionised water. With nothing dissolved in it there is nothing to carry flavour, and the result tastes hollow and slightly salty. Water needs some minerals to extract properly.",
      },
      {
        heading: "Test it honestly",
        body: "Brew the same coffee twice on the same recipe, changing only the water. It is the cheapest experiment in coffee and the results are rarely subtle.",
      },
    ],
  },
  {
    slug: "drawdown-is-your-grind",
    title: "Drawdown time is your grind, not your pour",
    tag: "FILTER",
    min: 4,
    topic: "filter",
    equip: "V60",
    summary:
      "If the brew is finishing too fast or too slow, adjust the grinder. Pouring more carefully will not save it.",
    lots: ["yirgacheffe-lot-08", "guji-honey", "filter-papers-100"],
    sections: [
      {
        heading: "The diagnosis",
        body: "Time from first pour to the bed going dry. For an 18 g V60 you want roughly 2:30 to 3:00. Much faster and the water is running through channels; much slower and the bed has compacted.",
      },
      {
        heading: "Fix the grind first",
        body: "Grind size sets flow rate more than anything else you control. Change one step, brew again, and change nothing else. Adjusting grind and pour technique at once means you learn nothing from either.",
      },
      {
        heading: "Fines and the stall",
        body: "A brew that starts fast and then stops entirely usually means fines have migrated to the bottom and sealed the filter. Grind slightly coarser, and stop stirring the slurry late in the brew.",
      },
      {
        heading: "Rinse the paper",
        body: "Rinse with hot water before you add coffee. It removes the paper taste and seats the filter against the cone, which stops water sneaking down the side instead of through the bed.",
      },
    ],
  },
  {
    slug: "batch-brew-from-a-v60-recipe",
    title: "Batch brewer: scaling a V60 recipe without wrecking it",
    tag: "FILTER",
    min: 6,
    topic: "filter",
    equip: "Batch brewer",
    summary:
      "Ratios scale. Grind and contact time do not, which is why a straight multiplication tastes worse than the original.",
    lots: ["java-kayumas", "sidamo-natural", "sanaa-espresso"],
    sections: [
      {
        heading: "Keep the ratio, change the grind",
        body: "60 g per litre carries over unchanged. The grind does not: a deeper bed means more resistance, so a batch brewer generally wants one or two steps coarser than the same coffee on a V60.",
      },
      {
        heading: "Watch the bed depth",
        body: "Below about 40 percent of the basket's capacity, the bed is too shallow to extract evenly and the brew turns out weak regardless of grind. Brew closer to full batches, or use a smaller basket.",
      },
      {
        heading: "Pre-wet properly",
        body: "If your machine has a bloom setting, use it. If it does not, a batch will always taste slightly flatter than the pour-over it was scaled from, and that gap is the bloom.",
      },
      {
        heading: "Hold it hot, but not long",
        body: "In a sealed thermal server a batch holds for about an hour. On a hotplate it is noticeably worse after fifteen minutes and undrinkable after forty.",
      },
    ],
  },

  // --- Espresso ----------------------------------------------------------
  {
    slug: "dialling-a-5kg-cafe-bag",
    title: "Dialling in a 5 kg café bag",
    tag: "TRADE",
    min: 8,
    topic: "espresso",
    equip: "Batch brewer",
    summary:
      "A working sequence for a new bag on a busy bar, in the order that actually finds the shot fastest.",
    lots: ["sanaa-espresso", "dhikr-blend", "java-kayumas"],
    sections: [
      {
        heading: "Start from the last bag",
        body: "Do not reset the grinder. Begin at your previous setting and adjust from there. A new lot of the same blend is rarely more than a few steps away, and starting from zero wastes half a kilo finding your way back.",
      },
      {
        heading: "Fix dose, then time, then taste",
        body: "Lock the dose to your basket. Adjust grind until the shot runs in range, ignoring flavour entirely. Only once the time is stable should you taste, because a shot pulled at the wrong flow rate tells you nothing about the coffee.",
      },
      {
        heading: "Rest the bag",
        body: "Coffee roasted less than five days ago will not settle, and you will chase it all morning. Seven to fourteen days after roast is where a dark blend behaves. Order so that you always have a bag ahead.",
      },
      {
        heading: "Write it down",
        body: "Dose, yield, time, grinder setting, roast date, and the date you dialled it. When the same lot returns in six weeks you start from a number rather than from memory, and whoever opens without you can do the same.",
      },
    ],
  },
  {
    slug: "espresso-from-naturals",
    title: "Pulling naturals without the ferment taking over",
    tag: "ESPRESSO",
    min: 5,
    topic: "espresso",
    equip: null,
    summary:
      "Natural-process coffee under nine bars amplifies everything, including the parts you did not want.",
    lots: ["sidamo-natural", "harrar-longberry", "mokha-harasi"],
    sections: [
      {
        heading: "Lower the temperature",
        body: "Drop to around 91 degrees. The fruit is already there and does not need extracting harder; what higher temperatures pull is the boozy, overripe edge that makes people describe naturals as tasting off.",
      },
      {
        heading: "Longer ratio",
        body: "Go out to 1:2.5 or beyond rather than a classic 1:2. The extra water dilutes the intensity to something drinkable and pushes the sweetness forward.",
      },
      {
        heading: "Coarser than you think",
        body: "Naturals are more soluble than washed coffees from the same origin. The setting that gives a correct shot on a washed lot will overextract a natural at the same dose.",
      },
      {
        heading: "In milk",
        body: "Naturals survive milk better than almost anything else, because the fruit is loud enough to come through it. If a natural tastes chaotic straight, try it in a cortado before you give up on the bag.",
      },
    ],
  },
  {
    slug: "moka-pot-yemeni-dark",
    title: "Moka pot: the forgiving route to a Yemeni dark",
    tag: "ESPRESSO",
    min: 4,
    topic: "espresso",
    equip: "Moka pot",
    summary:
      "Start with hot water and take it off early. Both rules exist to stop the coffee from cooking.",
    lots: ["mokha-harasi", "sanaa-espresso", "dhikr-blend"],
    sections: [
      {
        heading: "Fill with hot water",
        body: "Preboiled water in the base, up to just below the valve. Starting cold means the pot sits on the flame for minutes with the coffee above it heating the whole time, and that is where the scorched taste comes from.",
      },
      {
        heading: "Level, do not tamp",
        body: "Fill the basket and level it with a finger. Tamping a moka pot basket raises the pressure past what the seal is designed for and forces water around the puck rather than through it.",
      },
      {
        heading: "Off the heat early",
        body: "The moment the stream turns pale and starts to sputter, take it off and run the base under cold water. Everything after that point is bitter, and it will spoil what is already in the pot.",
      },
      {
        heading: "Ratio",
        body: "Fill the basket level, use the amount of water the base is built for, and adjust the grind rather than the doses. The pot is designed around fixed volumes and fighting that is more trouble than it is worth.",
      },
    ],
  },

  // --- Qishr -------------------------------------------------------------
  {
    slug: "qishr-husk-not-bean",
    title: "Qishr: brewing the husk, not the bean",
    tag: "QISHR",
    min: 3,
    topic: "qishr",
    equip: "Ibrik",
    summary:
      "Simmer it, do not steep it. Treating qishr like tea gets you coloured water and nothing else.",
    lots: ["qishr", "ibrik-copper-240"],
    sections: [
      {
        heading: "What it is",
        body: "The dried shell of the coffee cherry, left over once the seed has been removed. For centuries it was the cup people actually drank in much of Yemen, while the beans went to the port for export.",
      },
      {
        heading: "The method",
        body: "Two heaped tablespoons of husk per cup, into cold water with the spices. Bring it to a simmer and hold it there for five to eight minutes. It needs sustained heat to give anything up, which is why steeping it like a tea bag disappoints everybody who tries.",
      },
      {
        heading: "How it should look",
        body: "Deep amber, closer to a strong black tea than to coffee. If it is pale after eight minutes, use more husk rather than more time.",
      },
      {
        heading: "When to drink it",
        body: "There is almost no caffeine in the husk, so it belongs late. It is what gets served when a second round of coffee would keep everyone awake.",
      },
    ],
  },
  {
    slug: "spicing-qishr",
    title: "Spicing qishr: ginger first, cinnamon last",
    tag: "QISHR",
    min: 4,
    topic: "qishr",
    equip: "Ibrik",
    summary:
      "Ginger needs the full simmer to give anything up. Cinnamon turns bitter if you give it that long.",
    lots: ["qishr"],
    sections: [
      {
        heading: "Ginger goes in cold",
        body: "Fresh ginger, sliced thin, into the cold water at the start. Dried ground ginger works and is what most households actually use, but it clouds the cup. Either way it needs the whole simmer.",
      },
      {
        heading: "Cinnamon goes in late",
        body: "A stick, added for the final two minutes. Cinnamon gives up its sweetness quickly and its tannin slowly, so a long simmer trades the good part for the bad one.",
      },
      {
        heading: "Sugar to taste, in the pot",
        body: "Qishr is usually taken sweet, and like coffee the sugar goes in during brewing rather than after. It is a fruit infusion and sugar reads as part of the fruit rather than as an addition.",
      },
      {
        heading: "What to leave out",
        body: "Cardamom, usually. It belongs with coffee and it competes with the ginger here rather than adding to it. Cloves are traditional in some households and overwhelming in most.",
      },
    ],
  },

  // --- History -----------------------------------------------------------
  {
    slug: "why-mokha-mattered",
    title: "Why the Mokha port mattered",
    tag: "HISTORY",
    min: 7,
    topic: "history",
    equip: null,
    summary:
      "For roughly two centuries, effectively all the coffee in world trade left through one Red Sea harbour.",
    lots: ["mokha-harasi", "dhikr-blend"],
    sections: [
      {
        heading: "One port, one crop",
        body: "Mokha sat on the Red Sea coast below the Yemeni highlands, which was where coffee was being cultivated in commercial quantity long before anywhere else. Everything grown on those terraces came down to that harbour, and everything the rest of the world drank went out through it.",
      },
      {
        heading: "The name outlived the trade",
        body: "The port silted up and the trade moved elsewhere, but the name stuck to the coffee and then, confusingly, to a chocolate drink it has nothing to do with. The association with chocolate comes from the flavour of the coffee that shipped from there, not from anything added to it.",
      },
      {
        heading: "Why it did not last",
        body: "A monopoly on a plant is only a monopoly until the plant travels. Seedlings reached Java and then the Americas, both of which had more land, flatter ground and cheaper labour. Yemen kept the terraces and lost the volume.",
      },
      {
        heading: "What it means for the bag on your shelf",
        body: "Yemeni coffee is still farmed on small terraces, largely by hand, at yields that cannot compete on price with anywhere else. That is the whole reason it costs what it does, and it is not a marketing story.",
      },
    ],
  },
  {
    slug: "terraces-of-haraaz",
    title: "The terraces of Haraaz, and why they are narrow",
    tag: "HISTORY",
    min: 5,
    topic: "history",
    equip: null,
    summary:
      "The shape of the farms is dictated by the mountain, and it explains both the quality and the tiny volumes.",
    lots: ["haraaz-red", "haraaz-n2", "bani-matar-honey"],
    sections: [
      {
        heading: "Building on a slope",
        body: "The Haraaz massif is too steep to farm without cutting it into steps and holding each one with a dry stone wall. Those walls are maintained by hand and have been for generations. The width of a terrace is set by how much mountain could be safely cut, which is usually not much.",
      },
      {
        heading: "Why the coffee is good",
        body: "Altitude above 2,000 metres and cold nights slow the cherry down, and slow ripening concentrates sugars and acidity. The same conditions that make the farming difficult are the ones that make the cup worth the trouble.",
      },
      {
        heading: "Why there is so little of it",
        body: "A holding might be a few hundred trees across several terraces at different heights, harvested over weeks as each one ripens. A single farmer's annual output can be a few sacks. Lots are assembled from many such farmers, which is why a named lot rarely repeats exactly.",
      },
      {
        heading: "Water is the constraint",
        body: "There is very little of it, which is why almost everything is dried whole as a natural. Washing coffee takes water the terraces cannot spare, and that is why a washed Yemeni lot is unusual rather than superior.",
      },
    ],
  },
  {
    slug: "qahwa-before-coffee",
    title: "Qahwa before it meant coffee",
    tag: "HISTORY",
    min: 5,
    topic: "history",
    equip: null,
    summary:
      "The word is older than the drink it now names, and the husk was brewed before the bean was.",
    lots: ["qishr", "dhikr-blend"],
    sections: [
      {
        heading: "An older word",
        body: "Qahwa was in use before it attached itself to coffee. It came to name this drink because of what the drink did rather than what it was made from, which is why the etymology confuses people who go looking for a bean in it.",
      },
      {
        heading: "The husk came first",
        body: "Qishr, brewed from the dried cherry shell, was the everyday drink across much of Yemen while the seeds were the export. The valuable part left through the port; the part that stayed behind became the domestic tradition and never stopped being one.",
      },
      {
        heading: "Kept awake on purpose",
        body: "Coffee spread through the region substantially because it let people stay awake through long night gatherings. The social architecture around the drink, the small cups, the shared pot, the order of serving, came from that setting rather than from a cafe.",
      },
      {
        heading: "Why the pot is small",
        body: "An ibrik makes two or three cups because it was never meant to serve a room at once. It gets refilled, repeatedly, and the refilling is the point.",
      },
    ],
  },
  {
    slug: "typica-reached-java",
    title: "How Typica reached Java, and stayed",
    tag: "HISTORY",
    min: 6,
    topic: "history",
    equip: null,
    summary:
      "Almost every arabica outside Ethiopia and Yemen descends from a very small number of travelling seedlings.",
    lots: ["java-kayumas", "java-preanger"],
    sections: [
      {
        heading: "A narrow doorway",
        body: "Coffee left Yemen as a handful of seedlings rather than as a population. Those few plants became the ancestors of Typica, and Typica became the ancestor of most of what is grown across Asia and the Americas. The genetic bottleneck is real and it still limits the crop's resilience today.",
      },
      {
        heading: "Java as the staging post",
        body: "The Dutch established coffee on Java early, and for a while the island's name was simply a synonym for the drink. Estates in the Preanger highlands were shipping coffee under that name long before most origins had names at all.",
      },
      {
        heading: "Leaf rust changes everything",
        body: "Rust arrived in the late nineteenth century and devastated the plantings. Much of the region replanted with robusta, which resists it. Typica survived in pockets at altitude, and the lots we buy come from those pockets.",
      },
      {
        heading: "What Typica tastes like",
        body: "Low acidity, heavy body, cedar and cocoa rather than fruit. It is unfashionable next to modern high-yield varietals and it is the reason Java tastes like Java rather than like everywhere else.",
      },
    ],
  },
];

/** Guides that mention a given product slug. */
export function guidesForLot(lotSlug) {
  return GUIDES.filter((guide) => guide.lots.includes(lotSlug));
}

export function getGuide(slug) {
  return GUIDES.find((guide) => guide.slug === slug);
}

/** Topic counts derived from the data, so a label can never overstate. */
export function topicCounts() {
  const counts = { all: GUIDES.length };
  for (const topic of TOPICS) {
    counts[topic.id] = GUIDES.filter((g) => g.topic === topic.id).length;
  }
  return counts;
}
