export interface Feeling {
  id: string;
  emoji: string;
  label: string;
  val: string;
}

export const FEELINGS: Feeling[] = [
  {
    id: "anxious",
    emoji: "😮‍💨",
    label: "A little anxious",
    val: "That makes total sense. A blank deck stares back. Naming the feeling already loosens its grip.",
  },
  {
    id: "bored",
    emoji: "🥱",
    label: "Honestly, bored",
    val: "Fair. Boredom is the brain asking for something easier. We’ll make the first move so small it’s almost silly.",
  },
  {
    id: "over",
    emoji: "🌊",
    label: "A bit overwhelmed",
    val: "Of course — “the whole deck” is a lot to hold. So we won’t. We’ll hold one sentence.",
  },
  {
    id: "avoid",
    emoji: "🛑",
    label: "I’m avoiding it",
    val: "You noticed that, which is the hard part. No guilt here. Let’s just crack the lid open together.",
  },
  {
    id: "unsure",
    emoji: "🤍",
    label: "Not really sure",
    val: "That’s okay too. We don’t need to know. We just need a first, tiny motion.",
  },
];
