export type BlogAuthor = {
  name: string;
  role: string;
};

export type BlogBlock =
  | { type: "p"; value: string }
  | { type: "h2"; value: string }
  | { type: "h3"; value: string }
  | { type: "quote"; value: string }
  | { type: "list"; value: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: string;
  publishedAt: string;
  author: BlogAuthor;
  cover: { label: string; tone: "accent" | "sage" | "ink" };
  content: BlogBlock[];
  sources?: string[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "why-your-team-isnt-productive-the-productivity-recipe",
    title: "Why Your Team Isn't Productive: The Productivity Recipe",
    excerpt:
      "Most traditional team management strategies focus on better tools, tighter deadlines, and smarter task assignment. Wrong. Here's what the data actually says about why high-performing teams and leaders succeed.",
    category: "Leadership",
    readingTime: "12 min read",
    publishedAt: "2026-06-26",
    author: { name: "AlphaLead Research", role: "Team behavior lab" },
    cover: { label: "The productivity recipe", tone: "accent" },
    content: [
      {
        type: "p",
        value:
          "Most traditional team management strategies focus on better tools, tighter deadlines, and smarter task assignment. Wrong. Here's what the data actually says about why high-performing teams and leaders succeed.",
      },
      {
        type: "p",
        value:
          "This article uses new workplace research, organizational psychology, and real-world data from 2025–2026 to give leaders a clear view of what hurts team performance.",
      },
      {
        type: "p",
        value:
          "And if you read until the end, I will give you the ultimate productivity recipe for modern teams.",
      },
      {
        type: "h2",
        value: "The Productivity Crisis Is Real, and It Is Getting Worse",
      },
      {
        type: "p",
        value:
          "According to Gallup's State of the Global Workplace 2026 report, only 20% of employees worldwide feel engaged at work. This is the second year in a row of decline. The lowest level since 2020.",
      },
      {
        type: "p",
        value:
          "The cost of that disengagement is huge. Gallup estimates it costs the global economy about $10 trillion each year.",
      },
      {
        type: "p",
        value:
          "The problem is hitting the middle of the organization hardest. Manager engagement fell from 27% to 22% from 2024 to 2025. The biggest one-year drop Gallup has recorded for managers. That matters enormously because managers directly account for roughly 70% of the variance in their team's engagement levels. When the layer responsible for translating strategy into execution disengages, the whole machine slows down.",
      },
      {
        type: "p",
        value:
          "Meanwhile, Hubstaff's 2026 Employee Burnout Statistics report shows stress is rising for U.S. workers. It finds that 72% report moderate to high stress levels. This is the highest figure in seven years.",
      },
      {
        type: "p",
        value:
          "It also finds that 55% report experiencing burnout and employees who use AI tools heavily are burned out 45% more than those who don't. AI removes routine tasks, but it replaces them with more cognitively demanding work, not rest.",
      },
      {
        type: "p",
        value:
          "This is not a story of lazy workers or bad managers. It tells the story of a system that designers built around the wrong model of human behavior.",
      },
      {
        type: "h2",
        value:
          "Procrastination Is Not a Character Flaw — It Is an Emotional Response",
      },
      {
        type: "p",
        value:
          "Here is the insight that changes everything for team performance management: procrastination is not laziness. Science is evident on this point.",
      },
      {
        type: "p",
        value:
          "A growing number of studies link stalling on tasks to poor emotional control. This includes a 2026 systematic review in the Journal of Behavior and Cognitive Therapy. When a task triggers anxiety, fear of failure, or uncertainty, the brain activates a threat-avoidance response. It shifts attention to easy, rewarding tasks, like sorting folders, scrolling, or over-planning, to boost mood short term.",
      },
      {
        type: "p",
        value:
          "The task gets deferred, deadlines shorten, cortisol levels rise, and the avoidance loop deepens.",
      },
      {
        type: "p",
        value:
          "Across the workforce, the numbers are staggering. According to ZipDo's 2026 Procrastination Statistics report, employees lose about 2.5 hours each day to wasted time. This adds to about 55 full workdays each year.",
      },
      {
        type: "p",
        value:
          "Approximately 20% of adults qualify as chronic procrastinators. This figure is growing as organizations pile on more tools, more pings, and more ambiguous goals.",
      },
      {
        type: "quote",
        value:
          "A team of 10, with average procrastination rates, consumes the salary of one full employee every year.",
      },
      {
        type: "p",
        value:
          "The productivity problem is, at its root, an emotional regulation problem. Fix that, and you fix the output. Ignore it, and no amount of sprint planning or OKR software will move the needle.",
      },
      {
        type: "h2",
        value:
          "Psychological Safety: The Hidden Productivity Recipe Behind Winning Teamwork",
      },
      {
        type: "p",
        value:
          "If emotional regulation is the individual lever, psychological safety is the team-level equivalent. And the evidence for its importance is now overwhelming.",
      },
      {
        type: "p",
        value:
          "To learn what makes teams click, Google launched 'Project Aristotle'—a massive study analyzing more than 180 teams. The researchers expected to find that the best teams were simply collections of the most talented individuals. What they found instead challenged every assumption about creating effective teams.",
      },
      {
        type: "p",
        value:
          "The single most important factor in winning teamwork was not talent, seniority, or work style. The hidden productivity recipe: psychological safety. Amy Edmondson defines safety as \"a shared belief held by members of a team that the team is safe for risk-taking\".",
      },
      {
        type: "p",
        value:
          "Google found that teams with a strong culture wildly outperform the rest. Specifically, these team members:",
      },
      {
        type: "list",
        value: [
          "Are twice as likely to be rated effective by executives",
          "Bring in higher revenue",
          "Are significantly less likely to leave the company",
          "Are better at leveraging diverse ideas",
        ],
      },
      {
        type: "p",
        value:
          "Project Aristotle also identified four additional productivity recipe ingredients: dependability, structure and clarity, meaning of work, and impact. However, none was as powerful as safety.",
      },
      {
        type: "p",
        value:
          "Study after study proves it: psychological safety is the number one predictor of a team's success.",
      },
      {
        type: "p",
        value:
          "Here is the biggest mistake leaders are making right now. They try to fix low team performance with micromanagement—tighter monitoring, mandatory updates, and return-to-office orders. These are precisely the actions that destroy psychological safety the fastest. They signal surveillance over trust. And surveillance produces fear, not flow.",
      },
      {
        type: "h2",
        value:
          "Context Switching: The Hidden Tax Draining Your Team's Cognitive Capacity",
      },
      {
        type: "p",
        value:
          "Modern tech teams—from engineers to marketing analysts—face a massive hidden tax on their productivity. It's called context switching.",
      },
      {
        type: "p",
        value:
          "It takes an average of 23 minutes to recover your deep focus after a single interruption, according to research from Carnegie Mellon and the University of Washington.",
      },
      {
        type: "p",
        value:
          "Now consider the average modern developer: Slack notifications, Jira updates, GitHub comments, email, an AI agent chat, a call. The typical knowledge worker is switching contexts dozens of times per hour.",
      },
      {
        type: "p",
        value:
          "Context switching costs companies up to $78,000 per developer every year, according to data from Axolo. Tech companies need to increase productivity by 2.7x just to stay financially afloat. The biggest thing standing in their way? Context switching.",
      },
      {
        type: "p",
        value:
          "The frustration in the developer community is palpable. Take this recent post on X:",
      },
      {
        type: "quote",
        value:
          "Context switching is quietly killing developer productivity. One repo for frontend. One for backend. Another for infra. Different agent chats everywhere.",
      },
      {
        type: "p",
        value:
          "Another senior engineering manager described the phenomenon as a new kind of burnout:",
      },
      {
        type: "quote",
        value:
          "I'm not typing as much, but I am pivoting between five different architectural contexts a minute. My brain wasn't designed for this many concurrent threads.",
      },
      {
        type: "p",
        value:
          "This is not a scheduling problem. It is a cognitive load problem. Cognitive load is an emotional experience that accumulates into paralysis, avoidance, and disengagement.",
      },
      {
        type: "h2",
        value: "Why Traditional Team Productivity Tools Are Making It Worse",
      },
      {
        type: "p",
        value:
          "Here is the uncomfortable truth for anyone evaluating workplace management solutions: most of the tools on the market are not solving the emotional regulation and psychological safety problem. They are accelerating it.",
      },
      {
        type: "p",
        value:
          "Task management platforms like Asana, ClickUp, and Monday.com have built increasingly powerful AI layers — autonomous agents, smart summaries, workflow automation. The improvements are real. The flaw? Traditional team management tools assume users are already motivated to work and just need a cleaner workflow. They automate what comes after the moment of resistance.",
      },
      {
        type: "p",
        value:
          "Alpha Lead AI is different. It intervenes at the moment the emotional blockage actually happens.",
      },
      {
        type: "p",
        value:
          "The alternative — monitoring software, often called \"bossware\" — attempts to solve the accountability problem through surveillance. The results are counterproductive. Recent 2026 monitoring trends reveal a harsh reality: workplace surveillance is backfiring.",
      },
      {
        type: "p",
        value: "According to data from SoftwareSeni and CurrentWare:",
      },
      {
        type: "list",
        value: [
          "68% of employees oppose AI-powered spying.",
          "59% say digital monitoring actively destroys workplace trust.",
          "42% of monitored workers plan to quit within the year (nearly double the rate of unmonitored peers).",
        ],
      },
      {
        type: "p",
        value:
          "Monitoring destroys exactly the psychological safety that Project Aristotle identified as the foundation of team effectiveness.",
      },
      {
        type: "p",
        value:
          "Real voices on Reddit echo this exact trend. Workers report that monitoring mandates destroy workplace trust—a bond that is famously difficult to rebuild. Commenting on a new tracking initiative, one public sector employee wrote:",
      },
      {
        type: "quote",
        value:
          "They don't care... the more we talk about how this is affecting us, the more disservice we do.",
      },
      {
        type: "p",
        value:
          "What looks like quiet resignation is actually a team in a psychological safety crisis.",
      },
      {
        type: "p",
        value:
          "The gap in the market is not better task management or better surveillance. It is a tool that intervenes at the moment the emotional blockage actually happens — asynchronously, anonymously, and in a way that preserves dignity.",
      },
      {
        type: "h2",
        value:
          "The Leader's Role Has Changed: Emotional Architecture Over Task Architecture",
      },
      {
        type: "p",
        value:
          "Whether you are a VP of Engineering, a CHRO, or a project lead, the way you lead your team must change.",
      },
      {
        type: "p",
        value:
          "The job description used to be: set the goal, allocate the resources, track the output, remove the obstacles. In a high-digital-density, distributed work environment, that model no longer holds.",
      },
      {
        type: "p",
        value:
          "The best leaders in 2026 are not optimizing task architecture. They are building emotional architecture. This means designing a workplace where teams can take risks and handle heavy cognitive workloads without burning out.",
      },
      {
        type: "p",
        value: "That means:",
      },
      {
        type: "list",
        value: [
          "Modeling vulnerability explicitly (admitting uncertainty and mistakes rather than projecting false confidence)",
          "Creating structural mechanisms for anonymous feedback that bypass the hierarchy",
          "Protecting maker time as a non-negotiable business priority, not a nice-to-have",
          "Measuring team health with the same rigor as sprint velocity or pipeline coverage",
          "Distinguishing between accountability (healthy) and surveillance (toxic)",
        ],
      },
      {
        type: "p",
        value:
          "Psychological safety enhances accountability and performance standards instead of reducing them. It drives a cycle of continuous learning where teams openly discuss risks instead of hiding them.",
      },
      {
        type: "p",
        value:
          "Great leaders aren't lowering the bar—they are building the safety net that allows teams to clear it.",
      },
      {
        type: "h2",
        value: "Your Strategic Productivity Recipe for High Team Performance",
      },
      {
        type: "p",
        value:
          "Given the research, what should leaders and teams actually do differently? Here is a practical productivity recipe grounded in the data.",
      },
      {
        type: "h3",
        value: "1. Reframe the language around blockers",
      },
      {
        type: "p",
        value:
          "The word \"blocker\" in most team environments still carries a faint shame — as if needing help is a performance failure. Psychological safety requires making it structurally normal, not just culturally tolerable, to signal when you're stuck. Anonymous flagging mechanisms remove the interpersonal risk. When a team member can report a blocker without fear of judgment, the data reaches the leader in time to actually help.",
      },
      {
        type: "h3",
        value: "2. Separate visibility from surveillance",
      },
      {
        type: "p",
        value:
          "Leaders need to know whether the team is moving forward. Teams need to trust that their leader is not watching their every click. These two goals can absolutely work together. It just requires a tool that tracks progress instead of spying on individual clicks.",
      },
      {
        type: "p",
        value:
          "The goal is progress visibility, not worker monitoring. Confusing the two destroys the psychological safety required for honest status reporting.",
      },
      {
        type: "h3",
        value: "3. Address cognitive load before task volume",
      },
      {
        type: "p",
        value:
          "Most team improvement ideas focus on adding structure — more meetings, more documentation, more process. For teams experiencing context switching overload, more process is more noise.",
      },
      {
        type: "p",
        value:
          "To unlock high team performance, leaders must first eliminate cognitive noise. This means taking three immediate steps:",
      },
      {
        type: "list",
        value: [
          "Slash communication channels: reduce on active chat apps and groups.",
          "Consolidate the tool stack: eliminate overlapping software.",
          "Protect deep work: create blocks of time that are strictly untouchable by pings and meetings.",
        ],
      },
      {
        type: "h3",
        value: "4. Invest in peer connection, not just manager-to-team communication",
      },
      {
        type: "p",
        value:
          "According to Gallup, 94% of employees would stay longer if their company invested in their career. Yet, only 23% feel that actually happens.",
      },
      {
        type: "p",
        value:
          "The best way to make that investment? Structured peer pairing. By matching team members who face the same roadblocks or skill gaps, you create a quick, asynchronous support system. This builds collective accountability without creating surveillance.",
      },
      {
        type: "h3",
        value: "5. Make engagement measurement continuous, not annual",
      },
      {
        type: "p",
        value:
          "Response rates skyrocketed from 48% to 81% in just six months when one Group CHRO swapped annual surveys for monthly pulse checks.",
      },
      {
        type: "p",
        value:
          "The lesson: frequency builds trust. Trust builds engagement. Annual surveys are retrospective autopsies. Real team performance management requires a live signal.",
      },
      {
        type: "h2",
        value: "What This Means for the Future of Team Productivity Tools",
      },
      {
        type: "p",
        value:
          "The next generation of team productivity software will not win by building a better task manager. The future of productivity isn't better task management—it's solving the emotional resistance that stops people from starting.",
      },
      {
        type: "p",
        value:
          "The software that will define the next decade of team effectiveness will operate invisibly, fitting seamlessly into existing workflows. It bridges the ultimate productivity gap: the distance between knowing what to do and actually doing it. The most expensive unsolved problem in the modern workplace.",
      },
      {
        type: "p",
        value: "Building a resilient, high-performing team comes down to a clear framework. Leaders must:",
      },
      {
        type: "list",
        value: [
          "Start with emotional safety: create a culture where it's safe to take risks.",
          "Measure cognitive load: protect your team from context-switching exhaustion.",
          "Build honest communication channels: use asynchronous tools to keep teams aligned.",
          "Protect workplace trust: choose software that respects dignity rather than enforcing surveillance.",
        ],
      },
      {
        type: "p",
        value:
          "We cannot dashboard our way out of a productivity crisis. True performance requires teams that feel safe enough to do their best work—and leaders who realize that creating that safety isn't a perk. It's the job.",
      },
      {
        type: "h2",
        value: "Introducing the Future of Team Performance",
      },
      {
        type: "p",
        value:
          "Alpha Lead AI is an autonomous agent platform built for high-digital-density B2B teams of 5 to 50 people. We frame digital paralysis not as a productivity failure, but as a challenge of emotional regulation and psychological safety.",
      },
      {
        type: "h3",
        value: "How Alpha Lead AI Fixes the Crisis",
      },
      {
        type: "p",
        value:
          "Alpha Lead AI replaces toxic surveillance with invisible workflow integration, building a resilient team culture from the bottom up:",
      },
      {
        type: "list",
        value: [
          "Check Engine Light: Employees can safely flag when they are overwhelmed or stuck, removing the fear of asking for help.",
          "Visibility Without Spying: Track overall team momentum and roadblocks instantly—without monitoring a single employee's clicks.",
          "Peer Pairing: The platform automatically pairs team members with similar digital roadblocks so they can unblock each other asynchronously.",
        ],
      },
      {
        type: "h3",
        value: "An AI Agent That Actually Joins the Team",
      },
      {
        type: "p",
        value:
          "Alpha Lead AI operates directly inside your unified team chat as a fully autonomous colleague, replacing clunky dashboards.",
      },
      {
        type: "list",
        value: [
          "The In-Chat Teammate: Your entire team can brainstorm and collaborate with Alpha AI in real time. It automatically detects assigned task requests and mentions, contextually stepping in exactly when needed.",
          "Instant Document Fetching: Need a file mid-conversation? Ask Alpha AI to scan your cloud drives and pull the exact document directly into your chat.",
        ],
      },
      {
        type: "h3",
        value: "Alpha Space: Turn Knowledge into Execution",
      },
      {
        type: "p",
        value:
          "Stop wasting hours searching for old files or staring at blank pages. Alpha Lead AI centralizes your team's collective intelligence and automates document creation.",
      },
      {
        type: "list",
        value: [
          "The Living Knowledge Base: Safely organize your team's custom templates, media, and standard operating procedures in a unified knowledge center.",
          "AI-Guided Frameworks (Alpha Space): Access a premium library of pre-built frameworks. Alpha AI suggests the right template for your project, helps your team complete it, and instantly exports it as a polished PDF.",
        ],
      },
      {
        type: "h3",
        value: "The Universal Integration Layer",
      },
      {
        type: "p",
        value:
          "The average team is drowning in tool fragmentation. Alpha Lead AI acts as a single source of truth, unifying your entire stack without forcing you to switch platforms.",
      },
      {
        type: "list",
        value: [
          "Unified Chat Synchronization: Connect WhatsApp, Microsoft Teams, and your other communication channels. Alpha AI synchronizes conversations into a single stream so leaders never miss a critical update across scattered platforms.",
          "Automated Workflow Aggregation: Centralize your entire ecosystem into one intelligent hub. Alpha AI automatically syncs tasks, to-do lists, and pipeline data directly from your CRM and project management tools.",
        ],
      },
      {
        type: "h2",
        value: "Stop Dashboarding. Start Supporting.",
      },
      {
        type: "p",
        value:
          "You cannot surveillance your way to high performance. True execution requires a culture where your team feels safe enough to excel.",
      },
      {
        type: "p",
        value:
          "Ready to eliminate cognitive noise and protect your team's workplace trust? As a team manager, you have a choice: surveillance or support.",
      },
      {
        type: "p",
        value:
          "Discover Alpha Lead AI today—the only platform designed to implement this modern productivity recipe and turn psychological safety into your ultimate competitive advantage.",
      },
    ],
    sources: [
      "Gallup — State of the Global Workplace: 2026 Global Data Summary",
      "MangoApps — Analysis of Gallup 2026 State of the Global Workplace",
      "Hubstaff — Employee Burnout Statistics: What's Happening in the Workplace (2026)",
      "DEV Community (teamcamp) — The Hidden Cost of Developer Context Switching",
      "DEV Community (akshaykurve) — How Context Switching Destroys Developer Productivity",
      "Google re:Work — Understand Team Effectiveness (Project Aristotle)",
      "LeaderFactor — Project Aristotle: Psychological Safety",
      "Leading Sapiens — Project Aristotle: Implications and Challenges",
      "CurrentWare — Employee Monitoring Trends 2026",
      "ZipDo — Procrastination Statistics 2026",
      "MDPI Social Sciences — Factors of Workplace Procrastination: A Systematic Review (2025)",
      "Market Research Future / WHO — Corporate Wellness Market: The Cost of Depression and Anxiety",
    ],
  },
  {
    slug: "the-real-cost-of-team-procrastination",
    title: "The real cost of team procrastination (and why guilt makes it worse)",
    excerpt:
      "Procrastination isn't a character flaw. It's an emotional response that spreads across teams. Here's what the data says, and what leaders can actually do about it.",
    category: "Leadership",
    readingTime: "6 min read",
    publishedAt: "2025-03-12",
    author: { name: "AlphaLead Research", role: "Team behavior lab" },
    cover: { label: "Cost of delay", tone: "accent" },
    content: [
      {
        type: "p",
        value:
          "Most teams lose more than two hours per person every day to procrastination. That's not a rounding error — it's the single largest hidden cost on most team budgets. And the typical leadership response, pushing harder, public accountability, guilt, makes it measurably worse.",
      },
      {
        type: "h2",
        value: "Procrastination is emotional, not laziness",
      },
      {
        type: "p",
        value:
          "Decades of research show procrastination is a failure of emotion regulation, not time management. When a task feels threatening (too vague, too big, too loaded with judgment), the brain treats it like a physical threat and reaches for relief. That relief is usually a smaller, easier, unrelated task.",
      },
      {
        type: "quote",
        value:
          "Telling a stressed team to just focus is like telling a drowning person to swim harder. The instruction is technically correct and completely useless.",
      },
      {
        type: "h2",
        value: "Why it spreads across teams",
      },
      {
        type: "p",
        value:
          "When one person quietly stalls, two things happen: their blocked task starts blocking others, and the social norm shifts. If delaying looks safe, more people delay. Within two weeks, a single stalled project can quietly normalize slow starts across the whole team.",
      },
      {
        type: "list",
        value: [
          "Blocked tasks create downstream waiting, multiplying the cost.",
          "Visible delay lowers the team's shared sense of urgency.",
          "Leaders often over-correct with more meetings, which reduces focus time further.",
        ],
      },
      {
        type: "h2",
        value: "What actually works",
      },
      {
        type: "p",
        value:
          "The teams that recover momentum don't push harder — they shrink the first step. A two-minute, impossibly small opening action breaks the emotional barrier. Once someone has started, finishing is usually easy. AlphaLead is built around exactly this moment: detect the stall, shrink the first step, and let the leader see risk privately instead of publicly shaming anyone.",
      },
    ],
  },
  {
    slug: "two-minute-ritual-that-actually-works",
    title: "The 2-minute ritual that actually works",
    excerpt:
      "A simple, repeatable routine that helps anyone start a task they've been avoiding. Backed by behavior science, designed to fit inside a normal workday.",
    category: "Productivity",
    readingTime: "5 min read",
    publishedAt: "2025-03-04",
    author: { name: "Mara Velez", role: "Behavior designer" },
    cover: { label: "Start small", tone: "sage" },
    content: [
      {
        type: "p",
        value:
          "Starting is the hardest part. Once a task is in motion, momentum does most of the work. The two-minute ritual is designed to remove every possible excuse from the first moment of action.",
      },
      {
        type: "h2",
        value: "Step 1: Name the smallest possible opening",
      },
      {
        type: "p",
        value:
          "Not the whole task. Not even a sub-task. The literal first physical action. \"Open the doc and type one messy sentence.\" \"Open the IDE and read the failing test.\" If it takes longer than two minutes, it's too big.",
      },
      {
        type: "h2",
        value: "Step 2: Set a two-minute timer",
      },
      {
        type: "p",
        value:
          "The timer is not a deadline. It's a contract with yourself that says: I only have to do this for two minutes, and then I'm allowed to stop. About 80% of the time, people keep going past the timer — because the barrier was never the task, it was the start.",
      },
      {
        type: "quote",
        value:
          "Lowering the bar to start is the single highest-leverage intervention in personal productivity.",
      },
      {
        type: "h2",
        value: "Step 3: Pair up when you're stuck",
      },
      {
        type: "p",
        value:
          "When the ritual fails twice in a row, the task is emotionally loaded and solo effort won't fix it. Pairing with a teammate for the first two minutes removes the isolation that makes avoidance feel safe. AlphaLead's pair-start feature exists for exactly this case.",
      },
    ],
  },
  {
    slug: "private-leader-dashboard-without-shame",
    title: "A private leader dashboard, without the shame",
    excerpt:
      "Visibility is powerful and dangerous. Here's how to design team insights so leaders can act early — without turning the dashboard into a wall of blame.",
    category: "Leadership",
    readingTime: "7 min read",
    publishedAt: "2025-02-20",
    author: { name: "AlphaLead Research", role: "Team behavior lab" },
    cover: { label: "Lead with care", tone: "ink" },
    content: [
      {
        type: "p",
        value:
          "Dashboards are tricky. The same chart that lets a leader intervene early can also become a leaderboard nobody asked for. The difference is design intent: who sees what, and what emotion the view is meant to trigger.",
      },
      {
        type: "h2",
        value: "The default mistake: public metrics",
      },
      {
        type: "p",
        value:
          "Most team tools default to public visibility because it's easier to build. But public progress charts activate social comparison, and social comparison activates avoidance. People start gaming the metric instead of doing the work.",
      },
      {
        type: "list",
        value: [
          "Public streaks reward consistent-looking work over honest work.",
          "Public stalls trigger embarrassment, which deepens the stall.",
          "Leaders lose the early signal because the data gets polished before it's shared.",
        ],
      },
      {
        type: "h2",
        value: "The private-leader principle",
      },
      {
        type: "p",
        value:
          "AlphaLead's leader dashboard is intentionally asymmetric. Each person sees their own rituals and progress, but only the leader sees aggregate risk signals: tasks stalled, deadlines at risk, burnout indicators. The leader can intervene one-on-one, kindly and early, instead of calling someone out in a channel.",
      },
      {
        type: "quote",
        value:
          "Visibility should create calm, focused intervention — not collective anxiety.",
      },
      {
        type: "h2",
        value: "What the leader actually sees",
      },
      {
        type: "p",
        value:
          "Three signals: stalled tasks (nothing has moved in 48h), deadline risk (a task's first step hasn't started), and overload (one person carrying too many open threads). Each comes with a suggested one-on-one prompt, never a public nudge.",
      },
    ],
  },
  {
    slug: "detecting-hidden-tasks-in-team-chat",
    title: "Detecting hidden tasks in team chat",
    excerpt:
      "Half the work that gets assigned in a team never becomes a ticket. It lives in chat, and it gets forgotten. Here's how to surface it without becoming a surveillance machine.",
    category: "Product",
    readingTime: "6 min read",
    publishedAt: "2025-02-08",
    author: { name: "Mara Velez", role: "Behavior designer" },
    cover: { label: "Signal in the noise", tone: "accent" },
    content: [
      {
        type: "p",
        value:
          "If you've ever said \"could you take a quick look at this?\" in Slack, you've assigned a task. The receiver heard it, the sender forgot it, and no ticket was ever created. Multiply that by a hundred messages a day and you have the real task backlog of most teams — completely invisible.",
      },
      {
        type: "h2",
        value: "Chat is where work actually lives",
      },
      {
        type: "p",
        value:
          "Formal task trackers capture maybe 30% of the real workload. The rest lives in DMs, threads, and standups. The work happens, but it's untracked, unevenly distributed, and impossible to plan around.",
      },
      {
        type: "h2",
        value: "Detection without surveillance",
      },
      {
        type: "p",
        value:
          "This is the design tension. You want to surface the hidden task without reading everyone's messages to their manager. AlphaLead handles it by extracting only the actionable commitment, never the surrounding conversation. The leader sees \"Mara agreed to draft the launch brief by Friday,\" not the 40 messages of context around it.",
      },
      {
        type: "quote",
        value:
          "The goal is to make commitments visible, not conversations monitored.",
      },
      {
        type: "h2",
        value: "From commitment to first step",
      },
      {
        type: "p",
        value:
          "Once a hidden task is surfaced, the next move is shrinking it. \"Draft the launch brief\" becomes \"open the brief template and write the one-line goal.\" That's the moment procrastination loses its grip — and it's the moment most task tools completely ignore.",
      },
    ],
  },
  {
    slug: "burnout-signals-before-the-crash",
    title: "Burnout signals you can catch before the crash",
    excerpt:
      "Burnout doesn't arrive in a single dramatic moment. It leaks out in small, measurable signals weeks before. Here's what to watch for, and how to act on it kindly.",
    category: "Leadership",
    readingTime: "8 min read",
    publishedAt: "2025-01-28",
    author: { name: "AlphaLead Research", role: "Team behavior lab" },
    cover: { label: "Watch the signals", tone: "sage" },
    content: [
      {
        type: "p",
        value:
          "Burnout is expensive, slow, and largely preventable. The problem is that by the time someone says they're burned out, the recovery cost has already been paid in lost weeks, missed deadlines, and damaged trust. The earlier signals are quieter — and they're visible if you know what to look for.",
      },
      {
        type: "h2",
        value: "Signal 1: Tasks stall and restart in a choppy pattern",
      },
      {
        type: "p",
        value:
          "Healthy progress looks like steady forward motion. Burnout-adjacent progress looks like bursts followed by long stalls. The work is happening, but it costs more energy each time to restart. A leader who only checks weekly output misses the pattern entirely.",
      },
      {
        type: "h2",
        value: "Signal 2: First-step latency grows",
      },
      {
        type: "p",
        value:
          "How long does it take someone to start a task after it's assigned? When that latency creeps up over two weeks, it's one of the most reliable early burnout signals we've measured. The person isn't lazy — they're running low on the emotional bandwidth needed to start.",
      },
      {
        type: "quote",
        value:
          "Late starts are not a discipline problem. They're an energy problem.",
      },
      {
        type: "h2",
        value: "Signal 3: Pair-start requests dry up",
      },
      {
        type: "p",
        value:
          "People who feel good ask for help. People heading toward burnout stop asking. If a teammate who used to pair-start has gone quiet for two weeks, that's worth a private, kind check-in — not a performance review.",
      },
      {
        type: "h2",
        value: "What leaders should do",
      },
      {
        type: "list",
        value: [
          "Intervene early, in private, with curiosity instead of judgment.",
          "Reduce load, don't add a recovery plan on top of the existing one.",
          "Protect focus time — most burnout comes from interrupted deep work, not raw volume.",
        ],
      },
    ],
  },
  {
    slug: "designing-anti-guilt-productivity",
    title: "Designing anti-guilt productivity software",
    excerpt:
      "Most productivity tools sell guilt. Here's the design philosophy behind AlphaLead, and the specific choices we made to build software that helps instead of shames.",
    category: "Product",
    readingTime: "5 min read",
    publishedAt: "2025-01-15",
    author: { name: "Mara Velez", role: "Behavior designer" },
    cover: { label: "Build with care", tone: "ink" },
    content: [
      {
        type: "p",
        value:
          "Most productivity software is, underneath the chrome, a guilt machine. Streaks you'll break. Leaderboards you'll fall off. Red dots you'll feel bad about. The business model is engagement, and the lever is anxiety. We think there's a better way.",
      },
      {
        type: "h2",
        value: "Guilt is a short-term lever with a long-term cost",
      },
      {
        type: "p",
        value:
          "Guilt works for about two weeks. Then it stops working, and what's left is avoidance, resentment, and eventual churn. Every retention curve in this category tells the same story.",
      },
      {
        type: "quote",
        value:
          "If your product needs the user to feel bad to keep using it, you don't have a product. You have a tax.",
      },
      {
        type: "h2",
        value: "The three anti-guilt principles",
      },
      {
        type: "list",
        value: [
          "Default to private. Progress is for the user first, the leader second, the team never.",
          "Reward starting, not streaking. The hardest moment is the start. Celebrate that.",
          "Never compare people. No leaderboards, no public streaks, no ranking of any kind.",
        ],
      },
      {
        type: "h2",
        value: "What this looks like in practice",
      },
      {
        type: "p",
        value:
          "AlphaLead celebrates the two-minute start. It never shows a broken streak. It surfaces burnout risk privately to the leader, with a suggested kind intervention. Every interaction is designed to leave the user calmer than it found them. That's the whole bar.",
      },
    ],
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}
