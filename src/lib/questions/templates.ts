/**
 * Question templates for the OurFable AI Question Engine.
 * Each relationship type has 15–20 emotionally resonant prompts
 * designed to draw out genuine, specific memories and wisdom.
 */

export type RelationshipType =
  | "mom"
  | "dad"
  | "grandma"
  | "grandpa"
  | "godparent"
  | "aunt"
  | "uncle"
  | "old-friend"
  | "neighbor"
  | "family-friend";

export interface Question {
  id: string;
  relationshipType: RelationshipType;
  text: string;
}

/**
 * Unique prefix per relationship type keeps IDs collision-free.
 * Format: {prefix}_{index}
 */
const Q = (prefix: string, index: number, text: string): Question => ({
  id: `${prefix}_${String(index).padStart(2, "0")}`,
  relationshipType: prefix.replace(/_\d+$/, "") as RelationshipType,
  text,
});

// ---------------------------------------------------------------------------
// MOM
// ---------------------------------------------------------------------------
export const momQuestions: Question[] = [
  { id: "mom_01", relationshipType: "mom", text: "What was the moment you first held them that you never want to forget?" },
  { id: "mom_02", relationshipType: "mom", text: "What do you hope they remember most about growing up in your home?" },
  { id: "mom_03", relationshipType: "mom", text: "What's something you want them to know about who you were before you became their mom?" },
  { id: "mom_04", relationshipType: "mom", text: "What's one piece of advice you wish someone had given you at their age?" },
  { id: "mom_05", relationshipType: "mom", text: "Describe a time they surprised you — completely caught you off guard." },
  { id: "mom_06", relationshipType: "mom", text: "What quality in them makes you proudest, and why does it matter so much to you?" },
  { id: "mom_07", relationshipType: "mom", text: "What's something you've done as a mom that scared you — and turned out to be exactly right?" },
  { id: "mom_08", relationshipType: "mom", text: "What do you want them to understand about love that took you years to figure out?" },
  { id: "mom_09", relationshipType: "mom", text: "Is there a song, a smell, or a place that instantly takes you back to their early days? Describe it." },
  { id: "mom_10", relationshipType: "mom", text: "What's something hard you've been through that you hope shapes how they move through the world?" },
  { id: "mom_11", relationshipType: "mom", text: "What do you hope they carry from your relationship when you're no longer in the same room every day?" },
  { id: "mom_12", relationshipType: "mom", text: "Finish this sentence: 'When they were little, they used to ___.' Don't edit it — just say it." },
  { id: "mom_13", relationshipType: "mom", text: "What's the hardest part of watching them grow up?" },
  { id: "mom_14", relationshipType: "mom", text: "What do you want them to know about your own mother — their grandmother — that they might not hear anywhere else?" },
  { id: "mom_15", relationshipType: "mom", text: "What's the thing you're most afraid to tell them, but need them to know?" },
  { id: "mom_16", relationshipType: "mom", text: "What do you hope they fight for, hard, in their life?" },
  { id: "mom_17", relationshipType: "mom", text: "Describe the kind of person you dreamed they'd become — and what you've actually discovered they already are." },
  { id: "mom_18", relationshipType: "mom", text: "What's one thing you've learned from being their mom that you never expected to learn?" },
];

// ---------------------------------------------------------------------------
// DAD
// ---------------------------------------------------------------------------
export const dadQuestions: Question[] = [
  { id: "dad_01", relationshipType: "dad", text: "What's the first moment you realized you'd do absolutely anything for them?" },
  { id: "dad_02", relationshipType: "dad", text: "What do you want them to know about what it means to be a man or a father — in your own words?" },
  { id: "dad_03", relationshipType: "dad", text: "What's a skill, a habit, or a way of seeing things you hope you've passed on to them?" },
  { id: "dad_04", relationshipType: "dad", text: "Tell them about a time you were scared and pushed through it anyway. What did you learn?" },
  { id: "dad_05", relationshipType: "dad", text: "What's something you want them to know about hard work that took you too long to figure out?" },
  { id: "dad_06", relationshipType: "dad", text: "Describe the moment they made you laugh hardest. What does that tell you about them?" },
  { id: "dad_07", relationshipType: "dad", text: "What's a mistake you've made that you hope they don't repeat — and what's the lesson inside it?" },
  { id: "dad_08", relationshipType: "dad", text: "What do you hope they remember about the time you had together — the ordinary moments, not just the big ones?" },
  { id: "dad_09", relationshipType: "dad", text: "What do you want them to understand about money, security, and what actually matters?" },
  { id: "dad_10", relationshipType: "dad", text: "Describe what you see when you watch them sleep, or play, or just be themselves." },
  { id: "dad_11", relationshipType: "dad", text: "What did your father give you — or fail to give you — that shaped how you've tried to be their dad?" },
  { id: "dad_12", relationshipType: "dad", text: "What's one thing you want to tell them about finding a person to love?" },
  { id: "dad_13", relationshipType: "dad", text: "What do you hope they carry from being your kid when they're raising kids of their own?" },
  { id: "dad_14", relationshipType: "dad", text: "What's something you've said to them that you hope they remember word for word?" },
  { id: "dad_15", relationshipType: "dad", text: "What does this family — your family — stand for? What do you want that to mean to them?" },
  { id: "dad_16", relationshipType: "dad", text: "Tell them about a moment you sat back and thought: 'I can't believe I get to be your dad.'" },
  { id: "dad_17", relationshipType: "dad", text: "What's the bravest thing you've ever seen them do, big or small?" },
  { id: "dad_18", relationshipType: "dad", text: "What would you want them to do if they ever feel lost or don't know who to turn to?" },
];

// ---------------------------------------------------------------------------
// GRANDMA
// ---------------------------------------------------------------------------
export const grandmaQuestions: Question[] = [
  { id: "grandma_01", relationshipType: "grandma", text: "What's the thing about them that melts you every single time — the thing only a grandmother notices?" },
  { id: "grandma_02", relationshipType: "grandma", text: "Tell them something about their parent when they were little — a story their mom or dad has probably forgotten." },
  { id: "grandma_03", relationshipType: "grandma", text: "What's a recipe, a tradition, or a small ritual you hope they carry into their own life?" },
  { id: "grandma_04", relationshipType: "grandma", text: "What do you want them to know about where this family came from — the generation before yours?" },
  { id: "grandma_05", relationshipType: "grandma", text: "What did you learn about love, the hard way, that you'd spare them from learning themselves?" },
  { id: "grandma_06", relationshipType: "grandma", text: "Describe the first time you saw them. What went through you in that moment?" },
  { id: "grandma_07", relationshipType: "grandma", text: "What's something you made or did for them that you hope they remember long after you're gone?" },
  { id: "grandma_08", relationshipType: "grandma", text: "Tell them about a time in your life that was really hard — and how you got through it." },
  { id: "grandma_09", relationshipType: "grandma", text: "What do you see in them — a quality or a spark — that reminds you of someone you love?" },
  { id: "grandma_10", relationshipType: "grandma", text: "What do you want them to know about what getting older actually feels like?" },
  { id: "grandma_11", relationshipType: "grandma", text: "Is there a moment with them — just the two of you — you'd keep forever if you could?" },
  { id: "grandma_12", relationshipType: "grandma", text: "What do you want them to understand about your life before they were born — who you were, what you dreamed?" },
  { id: "grandma_13", relationshipType: "grandma", text: "What's the proudest moment you've had watching their family grow?" },
  { id: "grandma_14", relationshipType: "grandma", text: "What do you hope they feel when they think of you?" },
  { id: "grandma_15", relationshipType: "grandma", text: "What's one thing you'd tell them about how to treat people — something you've learned over a lifetime?" },
  { id: "grandma_16", relationshipType: "grandma", text: "What does this family's name mean to you — and what do you hope it means to them someday?" },
  { id: "grandma_17", relationshipType: "grandma", text: "If you could sit with them when they're 30, what's the first thing you'd want to know about their life?" },
];

// ---------------------------------------------------------------------------
// GRANDPA
// ---------------------------------------------------------------------------
export const grandpaQuestions: Question[] = [
  { id: "grandpa_01", relationshipType: "grandpa", text: "What do you want them to know about the world you grew up in — so different from the one they'll inherit?" },
  { id: "grandpa_02", relationshipType: "grandpa", text: "Tell them something about their parent as a kid — a moment that shows you who that person really was." },
  { id: "grandpa_03", relationshipType: "grandpa", text: "What's a lesson — from work, from failure, from something you built or fixed — that you want them to carry?" },
  { id: "grandpa_04", relationshipType: "grandpa", text: "What do you hope they learn about what it means to be part of a family? The real meaning, not the easy answer." },
  { id: "grandpa_05", relationshipType: "grandpa", text: "What's something you've done in your life that was harder than it looked — and what did you find out about yourself?" },
  { id: "grandpa_06", relationshipType: "grandpa", text: "What did your own grandfather give you — in words, in action, in example — that you've held onto?" },
  { id: "grandpa_07", relationshipType: "grandpa", text: "Describe the first time you held them or met them. What did you say, or what did you want to say?" },
  { id: "grandpa_08", relationshipType: "grandpa", text: "What do you want them to know about resilience — about getting back up — in your own words?" },
  { id: "grandpa_09", relationshipType: "grandpa", text: "Tell them about the work you've done in your life — what you built, what it meant, what it cost." },
  { id: "grandpa_10", relationshipType: "grandpa", text: "What's a decision you made that changed everything? What would you tell them about how you made it?" },
  { id: "grandpa_11", relationshipType: "grandpa", text: "What do you see when you look at them that gives you real hope for the future?" },
  { id: "grandpa_12", relationshipType: "grandpa", text: "Is there something you've never told their parent that you'd want them to know about this family?" },
  { id: "grandpa_13", relationshipType: "grandpa", text: "What do you want them to know about love — not romantic love, but the kind that holds a family together?" },
  { id: "grandpa_14", relationshipType: "grandpa", text: "What does a good life look like to you, honestly? Not the version you'd give in a speech — the real one." },
  { id: "grandpa_15", relationshipType: "grandpa", text: "What's something you'd do differently, and what does that tell them that you'd want them to hear?" },
  { id: "grandpa_16", relationshipType: "grandpa", text: "What do you hope they say about you, someday, when they're telling their own kids about their grandfather?" },
  { id: "grandpa_17", relationshipType: "grandpa", text: "Is there a moment with them — just the two of you — you'd choose to live again?" },
];

// ---------------------------------------------------------------------------
// GODPARENT
// ---------------------------------------------------------------------------
export const godparentQuestions: Question[] = [
  { id: "godparent_01", relationshipType: "godparent", text: "What did it mean to you when you were asked to be their godparent — in that actual moment?" },
  { id: "godparent_02", relationshipType: "godparent", text: "What do you want them to know about the responsibility you felt — and still feel — for their life?" },
  { id: "godparent_03", relationshipType: "godparent", text: "What's the thing you've prayed for, or hoped for, most quietly on their behalf?" },
  { id: "godparent_04", relationshipType: "godparent", text: "Tell them how long you've known their parents — and what kind of people they were before they had kids." },
  { id: "godparent_05", relationshipType: "godparent", text: "What do you hope you can offer them that's different from what their parents give them?" },
  { id: "godparent_06", relationshipType: "godparent", text: "What's one thing about faith, or values, or how to live — that you hope to pass on to them?" },
  { id: "godparent_07", relationshipType: "godparent", text: "Describe the moment you first met them. What struck you?" },
  { id: "godparent_08", relationshipType: "godparent", text: "What promise have you made to them — silently or out loud — that you intend to keep?" },
  { id: "godparent_09", relationshipType: "godparent", text: "What do you want them to know about how to find their way when things get confusing or hard?" },
  { id: "godparent_10", relationshipType: "godparent", text: "What's a memory you have with their family — before they were born or just after — that tells the story of why you're in each other's lives?" },
  { id: "godparent_11", relationshipType: "godparent", text: "What do you hope your role in their life means to them, in their own words, when they're an adult?" },
  { id: "godparent_12", relationshipType: "godparent", text: "What do you want them to come to you for, specifically — the thing you'd be most glad to help with?" },
  { id: "godparent_13", relationshipType: "godparent", text: "What's the best advice you ever received? And who gave it to you?" },
  { id: "godparent_14", relationshipType: "godparent", text: "Tell them something about themselves — a quality you've noticed — that you hope they never let go of." },
  { id: "godparent_15", relationshipType: "godparent", text: "What do you want them to know about what's truly worth protecting in a life?" },
];

// ---------------------------------------------------------------------------
// AUNT
// ---------------------------------------------------------------------------
export const auntQuestions: Question[] = [
  { id: "aunt_01", relationshipType: "aunt", text: "What's something you can offer them that their parents can't — and why does that feel important?" },
  { id: "aunt_02", relationshipType: "aunt", text: "Tell them something about their mom or dad that only a sibling would know." },
  { id: "aunt_03", relationshipType: "aunt", text: "What's a memory with them — just an ordinary afternoon — that you'd hold onto forever?" },
  { id: "aunt_04", relationshipType: "aunt", text: "What do you want them to know they can always come to you for, no questions asked?" },
  { id: "aunt_05", relationshipType: "aunt", text: "What's something you've learned from your own family growing up that you hope to spare them from — or give them?" },
  { id: "aunt_06", relationshipType: "aunt", text: "Describe the first time you met them. What did you feel in that moment?" },
  { id: "aunt_07", relationshipType: "aunt", text: "What do you see in them — a trait, a look, a habit — that runs in this family?" },
  { id: "aunt_08", relationshipType: "aunt", text: "What's something you wish your own aunt had told you when you were their age?" },
  { id: "aunt_09", relationshipType: "aunt", text: "Tell them about something you love — a place, a book, a song — that you hope to share with them someday." },
  { id: "aunt_10", relationshipType: "aunt", text: "What do you hope they know about where this family came from?" },
  { id: "aunt_11", relationshipType: "aunt", text: "What's the funniest thing they've ever done or said — the story you'll still be telling in 20 years?" },
  { id: "aunt_12", relationshipType: "aunt", text: "What do you want them to know about being a woman or finding their own way in the world?" },
  { id: "aunt_13", relationshipType: "aunt", text: "What's one thing about you that you hope they recognize in themselves?" },
  { id: "aunt_14", relationshipType: "aunt", text: "What do you love most about being their aunt?" },
  { id: "aunt_15", relationshipType: "aunt", text: "What do you hope your relationship with them looks like when they're fully grown?" },
  { id: "aunt_16", relationshipType: "aunt", text: "What's a piece of advice about friendship that you'd want them to have?" },
];

// ---------------------------------------------------------------------------
// UNCLE
// ---------------------------------------------------------------------------
export const uncleQuestions: Question[] = [
  { id: "uncle_01", relationshipType: "uncle", text: "What do you want them to know about their parent — your sibling or your close friend — that might surprise them?" },
  { id: "uncle_02", relationshipType: "uncle", text: "What's the first time you did something with them — just the two of you — that you remember clearly?" },
  { id: "uncle_03", relationshipType: "uncle", text: "What do you want them to know you're always available for, no matter how old they get?" },
  { id: "uncle_04", relationshipType: "uncle", text: "What's the most important thing you know about being a man that you wish someone had told you earlier?" },
  { id: "uncle_05", relationshipType: "uncle", text: "Tell them something about this family — a real story, maybe one their parents don't love telling — that they should know." },
  { id: "uncle_06", relationshipType: "uncle", text: "What's something you've built, fixed, or made that you hope to pass on to them?" },
  { id: "uncle_07", relationshipType: "uncle", text: "Describe a time they did something that made you think: 'This kid has something special.'" },
  { id: "uncle_08", relationshipType: "uncle", text: "What do you want them to understand about work — the kind that matters, not just the kind that pays?" },
  { id: "uncle_09", relationshipType: "uncle", text: "What's an adventure, a trip, or a day you hope to have with them someday?" },
  { id: "uncle_10", relationshipType: "uncle", text: "What's something you've learned about failure — falling down, getting up — that you want to pass on?" },
  { id: "uncle_11", relationshipType: "uncle", text: "What do you love most about being their uncle?" },
  { id: "uncle_12", relationshipType: "uncle", text: "What's a hobby, a passion, or a way of spending time that you hope they catch from you?" },
  { id: "uncle_13", relationshipType: "uncle", text: "What do you want them to know about loyalty — the kind that holds across hard years?" },
  { id: "uncle_14", relationshipType: "uncle", text: "What's something you'd want them to come to you about that they might not feel they can talk to their parents about?" },
  { id: "uncle_15", relationshipType: "uncle", text: "What's the thing you see in them that gives you the most confidence in who they're becoming?" },
  { id: "uncle_16", relationshipType: "uncle", text: "Tell them what it felt like to find out they were going to exist — and what you thought in that moment." },
];

// ---------------------------------------------------------------------------
// OLD FRIEND (of parent)
// ---------------------------------------------------------------------------
export const oldFriendQuestions: Question[] = [
  { id: "old-friend_01", relationshipType: "old-friend", text: "Tell them who their parent was before they became a parent — what they were like, what they dreamed about." },
  { id: "old-friend_02", relationshipType: "old-friend", text: "What's a story about their mom or dad that you've kept for years and never told them?" },
  { id: "old-friend_03", relationshipType: "old-friend", text: "What does real, old friendship look like — the kind that survives time and distance? Tell them." },
  { id: "old-friend_04", relationshipType: "old-friend", text: "What do you want them to know about why you've stayed close to their family, through everything?" },
  { id: "old-friend_05", relationshipType: "old-friend", text: "What's something you've seen their parent sacrifice or choose — for them — that they might never know?" },
  { id: "old-friend_06", relationshipType: "old-friend", text: "Tell them about when you found out their parent was having a child. What was said? What did you feel?" },
  { id: "old-friend_07", relationshipType: "old-friend", text: "What qualities do you see in them that remind you of who their parent was at their age?" },
  { id: "old-friend_08", relationshipType: "old-friend", text: "What's the hardest thing you've ever seen their family go through — and what did you learn from watching them?" },
  { id: "old-friend_09", relationshipType: "old-friend", text: "What do you want them to know about choosing good people to keep in their life?" },
  { id: "old-friend_10", relationshipType: "old-friend", text: "What's one memory — you, their parent, a night or a day that mattered — that you'd want them to hear about?" },
  { id: "old-friend_11", relationshipType: "old-friend", text: "What do you hope they know about how rare their family is — and why you've never taken it for granted?" },
  { id: "old-friend_12", relationshipType: "old-friend", text: "What would you want them to know about your own life — so they understand who you are, not just whose old friend you are?" },
  { id: "old-friend_13", relationshipType: "old-friend", text: "What's advice about friendship — real friendship — that you'd give them?" },
  { id: "old-friend_14", relationshipType: "old-friend", text: "Tell them something about their parent's younger years that shows exactly who that person still is today." },
  { id: "old-friend_15", relationshipType: "old-friend", text: "What do you hope they feel, someday, when they hear your name or see your picture?" },
];

// ---------------------------------------------------------------------------
// NEIGHBOR
// ---------------------------------------------------------------------------
export const neighborQuestions: Question[] = [
  { id: "neighbor_01", relationshipType: "neighbor", text: "What do you want them to know about what a neighborhood actually is — the real version, not the idea of it?" },
  { id: "neighbor_02", relationshipType: "neighbor", text: "Tell them about the first time you saw their family — before you knew them — and what you noticed." },
  { id: "neighbor_03", relationshipType: "neighbor", text: "What's a moment between you and their family — something small and unremarkable at the time — that you've thought about since?" },
  { id: "neighbor_04", relationshipType: "neighbor", text: "What do you hope they know about what their family means to this street, this block, this place?" },
  { id: "neighbor_05", relationshipType: "neighbor", text: "What's something you've watched their parents do — as neighbors and as people — that impressed you?" },
  { id: "neighbor_06", relationshipType: "neighbor", text: "What do you want them to know about looking out for the people who live near you?" },
  { id: "neighbor_07", relationshipType: "neighbor", text: "Tell them something about this neighborhood — its history, its character — that you hope they carry with them." },
  { id: "neighbor_08", relationshipType: "neighbor", text: "What's something you've seen them do — just outside, just being a kid — that made you smile?" },
  { id: "neighbor_09", relationshipType: "neighbor", text: "What do you want them to know about what it takes to make a place feel like home?" },
  { id: "neighbor_10", relationshipType: "neighbor", text: "What has being their neighbor taught you — something you didn't expect?" },
  { id: "neighbor_11", relationshipType: "neighbor", text: "What do you hope this house, this yard, this place means to them when they're grown and remember it?" },
  { id: "neighbor_12", relationshipType: "neighbor", text: "What's one thing you'd want them to know about who you are and what your life has been like?" },
  { id: "neighbor_13", relationshipType: "neighbor", text: "What do you hope they take with them about community — real community — wherever they live next?" },
  { id: "neighbor_14", relationshipType: "neighbor", text: "What's a moment of kindness — between you and their family, or something you witnessed — that stuck with you?" },
  { id: "neighbor_15", relationshipType: "neighbor", text: "What do you wish every child knew about the people who live quietly nearby, watching out for them?" },
];

// ---------------------------------------------------------------------------
// FAMILY FRIEND
// ---------------------------------------------------------------------------
export const familyFriendQuestions: Question[] = [
  { id: "family-friend_01", relationshipType: "family-friend", text: "How did you come into this family's life — and what made you stay?" },
  { id: "family-friend_02", relationshipType: "family-friend", text: "What do you want them to know about who their parents were before they had kids?" },
  { id: "family-friend_03", relationshipType: "family-friend", text: "Tell them about a moment you watched their family pull together — a moment that showed you who they really are." },
  { id: "family-friend_04", relationshipType: "family-friend", text: "What's something you've seen their mom or dad do for someone else that never got acknowledged — but should be?" },
  { id: "family-friend_05", relationshipType: "family-friend", text: "What do you hope they know about chosen family — and what it means when people decide to show up for each other?" },
  { id: "family-friend_06", relationshipType: "family-friend", text: "Tell them the story of when you found out they were coming — and what it meant to the people you love." },
  { id: "family-friend_07", relationshipType: "family-friend", text: "What quality do you see in them — something early, something now — that you think is going to take them far?" },
  { id: "family-friend_08", relationshipType: "family-friend", text: "What's something you've learned about life that you'd want to pass along to them?" },
  { id: "family-friend_09", relationshipType: "family-friend", text: "What do you love most about being part of this family's life, even from the outside?" },
  { id: "family-friend_10", relationshipType: "family-friend", text: "Tell them something about how their parents love each other — something a friend notices that a child might not." },
  { id: "family-friend_11", relationshipType: "family-friend", text: "What do you hope they know about gratitude — and about the people who show up without being asked?" },
  { id: "family-friend_12", relationshipType: "family-friend", text: "What's your favorite memory that involves them — even if they were too small to remember it?" },
  { id: "family-friend_13", relationshipType: "family-friend", text: "What would you want them to come to you for, someday, if they ever need a different kind of perspective?" },
  { id: "family-friend_14", relationshipType: "family-friend", text: "What does this family mean to you — honestly, in your own words?" },
  { id: "family-friend_15", relationshipType: "family-friend", text: "What do you hope they feel when they think of the people who loved their family before they were old enough to understand it?" },
  { id: "family-friend_16", relationshipType: "family-friend", text: "What's one thing you've never said to their parents directly that you'd want their child to hear?" },
];

// ---------------------------------------------------------------------------
// Master map & lookup helpers
// ---------------------------------------------------------------------------

export const QUESTIONS_BY_TYPE: Record<RelationshipType, Question[]> = {
  mom: momQuestions,
  dad: dadQuestions,
  grandma: grandmaQuestions,
  grandpa: grandpaQuestions,
  godparent: godparentQuestions,
  aunt: auntQuestions,
  uncle: uncleQuestions,
  "old-friend": oldFriendQuestions,
  neighbor: neighborQuestions,
  "family-friend": familyFriendQuestions,
};

export function getQuestionsForType(type: RelationshipType): Question[] {
  return QUESTIONS_BY_TYPE[type] ?? [];
}

export function getQuestionById(id: string): Question | undefined {
  for (const questions of Object.values(QUESTIONS_BY_TYPE)) {
    const q = questions.find((q) => q.id === id);
    if (q) return q;
  }
  return undefined;
}

export const ALL_RELATIONSHIP_TYPES = Object.keys(QUESTIONS_BY_TYPE) as RelationshipType[];
