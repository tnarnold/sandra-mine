// English: the reference language. Every other language mirrors this structure;
// anything missing there falls back to the text here.
// Text: blank line = paragraph, **bold**, `code`, {value} = live number.
export default {
  ui: {
    page_title: "How Bitcoin mining works · free animated course · SandraMine",
    page_description: "A free, animated, step-by-step course on how Bitcoin mining works, with live network data.",
    nav: { lottery: "Lottery mining", features: "Features", status: "Status", lab: "Lab", course: "Course", download: "Download", setup: "Setup", faq: "FAQ" },
    footer_note: "MIT licensed. Interface based on NerdMiner v2 © 2023 BitMaker (MIT). Network data by mempool.space. Not affiliated with the original project.",
    manual: "Manual",
    manual_url: "https://github.com/tnarnold/sandra-mine/blob/main/docs/MANUAL.md",
    course: "Course",
    free: "Free",
    home_title: "How Bitcoin mining works",
    home_lead:
      "A short, animated, step-by-step course. Each lesson answers one question and shows the answer happening, with hashes really computed in your browser and live numbers from the network.\n\nRight now the network is at block {height}, with {hashrate} of computing power.",
    start: "Start",
    continue: "Continue",
    soon: "Coming soon",
    done: "Done",
    steps: "{n} steps",
    all_lessons: "All lessons",
    lesson_n: "Lesson {n} of {total}",
    step_n: "Step {n} of {total}",
    more: "More details",
    prev: "Previous",
    next: "Next",
    replay: "Replay this step (R)",
    next_lesson: "Next lesson",
    finish: "Finish",
    offline: "Can't reach mempool.space: network numbers are approximate.",
    one_in: "1 in {n}",
    units: { years: "years", days: "days" },
  },

  lessons: {
    follow: {
      title: "Follow one transaction",
      summary: "From the wallet to the blockchain: the whole path, in 6 steps.",
      labels: {
        wallet: "wallet",
        nodes: "network nodes",
        mempool: "mempool",
        fee_legend: "gray = low fee · orange = high fee",
        candidate: "candidate block",
        tx_line1: "Ana → Ben",
        tx_line2: "0.001 BTC · fee 2 sat/vB",
        nonce: "nonce",
        hash: "hash",
        conf_one: "{n} confirmation",
        conf_many: "{n} confirmations",
      },
      steps: [
        {
          title: "You press “send”",
          body:
            "Ana wants to send 0.001 BTC to Ben. Her wallet builds a **transaction**: where the money comes from, where it goes and how much she pays as a **fee**.\n\nThen the wallet **signs** it with Ana's private key. The signature proves the owner of the money approved it, without revealing the key.",
          more:
            "A transaction spends outputs of earlier transactions (UTXOs) and creates new outputs. The fee isn't written anywhere: it's the difference between what goes in and what comes out.",
        },
        {
          title: "The news spreads",
          body:
            "The transaction goes to a **node**, a computer running Bitcoin. It checks the signature and that the funds exist, then passes it to its neighbors. They check it and pass it on again.\n\nWithin seconds, thousands of nodes around the world know about it. Nobody is in charge: every node checks everything on its own.",
        },
        {
          title: "The waiting room",
          body:
            "It isn't confirmed yet. The transaction enters the **mempool**, each node's waiting room. Right now {mempoolCount} transactions are waiting (about {mempoolMB} MB).\n\nThe square with the white border is Ana's. The color shows the fee: the more orange, the more that person paid per byte.",
        },
        {
          title: "A miner builds a block",
          body:
            "A block has limited room, like a bus with few seats. The miner picks whoever pays the most per byte first. For the next block, the fee is around {feeFast} sat/vB.\n\nThe first seat is special: the **coinbase**, the transaction that pays the miner. Today that's {subsidy} new BTC, plus every fee in the block.",
          more:
            "The limit is 4 million weight units, about 1 MB of data. Selection takes parent-and-child packages into account (CPFP). Lesson 8 looks at fees up close.",
        },
        {
          title: "The lottery",
          body:
            "For the block to count, the miner must find a **hash** that starts with many zeros. There's no shortcut: it changes a number called the **nonce** and tries again, trillions of times per second.\n\nThe whole network does {hashrate}. Whoever finds it first wins the reward. The next lessons open this box: what a hash is (2), what exactly is mined (3) and why the zeros (4).",
        },
        {
          title: "Into the chain",
          body:
            "The winning block spreads across the network. Every node checks it again and adds it to the end of the **blockchain**. Ana's transaction now has **1 confirmation**.\n\nEvery block after it adds one more. With 6 confirmations, about 1 hour, undoing the payment would mean redoing all that work faster than the rest of the world. In practice, impossible.",
        },
      ],
    },

    hash: {
      title: "Hashes: can you predict the result?",
      summary: "A fingerprint for data, really computed here in your browser.",
      labels: {
        input: "input",
        output: "SHA-256 (hex)",
        input_b: "input with 1 letter changed",
        output_b: "new SHA-256",
        bits_a: "the 256 bits",
        bits_b: "bits of the new hash",
        bits_diff: "bits that changed",
        of_256: "of 256 bits",
        sizes: "input: {n} bytes → output: always 32 bytes (256 bits)",
        identical: "identical",
        type_here: "Type anything…",
        sample: "SandraMine",
        change_letter: "Change another letter",
        genesis_cap: "header of block 0 (80 bytes)",
        genesis_out: "hash of block 0 (3 Jan 2009)",
        genesis_bits: "hash bits · zeros in dark orange",
        no_way_back: "no way back",
      },
      steps: [
        {
          title: "A fingerprint",
          body:
            "A **hash function** takes any data and returns a fixed-size code. Bitcoin uses **SHA-256**.\n\nType in the box below the animation: the hash is recomputed on every keystroke, right here in your browser.",
        },
        {
          title: "Always the same size",
          body:
            "One letter or a whole book: the output is always **256 bits** (64 hexadecimal characters). The grid shows those bits, light = 1 and dark = 0.\n\nThat's why a hash is a great summary: you can compare huge files by looking at just 32 bytes.",
        },
        {
          title: "Same input, same output",
          body:
            "Compute it again and the result is **identical**, here or on any computer in the world. That's what lets thousands of nodes check the same block and reach the same answer.",
        },
        {
          title: "Change one letter",
          body:
            "The second row now uses the same text with **one** letter changed. The hash changes completely: {flipped} of the 256 bits flipped, about half, with no pattern at all. This is the **avalanche effect**.\n\nClick “Change another letter” or edit the text and see: you can never predict which bits will flip.",
        },
        {
          title: "No way back",
          body:
            "Looking only at the hash, there's no way to work out the input. The only way to find an input with a special hash is to **try, try and try again**.\n\nBitcoin applies SHA-256 **twice** to the block header. Above is block 0, from 2009, computed just now: its hash starts with {zeros} hexadecimal zeros ({zeroBits} bits). Those zeros aren't luck; they were the work. That's lesson 4.",
        },
      ],
    },

    merkle: {
      title: "How do thousands of transactions become one summary?",
      summary: "The Merkle tree and the 80-byte header: what is actually mined.",
      labels: {
        root: "root",
        cap_leaves: "each transaction becomes a hash (double SHA-256)",
        cap_pairs: "hash(left + right), two at a time",
        cap_root: "a single hash sums up all 8 transactions",
        cap_changed: "root before: {old}…  now: {now}…",
        tamper: "Change another transaction",
        header_cap: "block header: 80 bytes",
        f_version: "version",
        f_prev: "previous block hash",
        f_merkle: "Merkle root",
        f_time: "time",
        f_bits: "target",
        f_nonce: "nonce",
        prev_block: "previous block header",
        broken: "the link no longer matches",
      },
      steps: [
        {
          title: "Many transactions",
          body:
            "A block usually holds thousands of transactions. Here we use 8 so they fit on screen. The first one, in orange, is the **coinbase**, which pays the miner.\n\nEach transaction is represented by its hash, really computed just now.",
        },
        {
          title: "Two at a time",
          body:
            "The hashes are joined in pairs and each pair becomes a new hash, like the brackets of a tournament. 8 become 4.",
          more:
            "Each node is SHA-256d(left ‖ right). If a level has an odd number of items, the last one is duplicated.",
        },
        {
          title: "Until one is left",
          body:
            "Repeat until a single hash is left: the **Merkle root**. It sums up every transaction in the block in 32 bytes.\n\nWith 3,000 transactions it would be only 12 levels. The tree grows slowly even for huge blocks.",
        },
        {
          title: "Touch one, change everything",
          body:
            "We changed one transaction. Its hash changes, so does its pair's, and the one above, all the way to the **root**. Nobody can touch a transaction without the root giving it away.\n\nClick “Change another transaction” to watch the red path climb.",
          more:
            "This also lets you prove a transaction is in a block by showing just the hashes along the path to the root (a Merkle proof), without downloading the whole block. It's what a pool sends a miner over Stratum: the `merkle_branch`.",
        },
        {
          title: "The 80-byte header",
          body:
            "The miner doesn't hash the whole block, only an **80-byte header**. The Merkle root takes 32 of them. It's what ties the header to every transaction.\n\nThe other fields are the version, the **previous block's hash**, the time, the difficulty **target** and the **nonce**, the one field the miner keeps changing.",
          more:
            "Byte layout: version (4) | prev_hash (32) | merkle_root (32) | time (4) | bits (4) | nonce (4), integers in little-endian. Since the first 64 bytes don't change between attempts, the miner saves the SHA-256 state after them (the midstate) and saves work.",
        },
        {
          title: "A chain of headers",
          body:
            "Every header stores the **previous block's hash**. That's what makes the chain.\n\nIf someone edits an old transaction, that block's root changes, its hash changes and the link to the next block breaks. To hide it, they'd have to redo the mining of that block and every block after it, faster than the whole network.",
        },
      ],
    },

    nonce: {
      title: "What changes on each attempt?",
      summary: "Nonce, target and why the zeros: mine for fun in your browser.",
      labels: {
        header: "block header (80 bytes)",
        merkle: "Merkle root",
        prev: "previous block",
        ruler: "zero bits at the start of the hash · further right = rarer",
        net_bits: "Bitcoin today: ~{bits} bits",
        target_zeros: "target: {n} zeros",
        tries: "attempts: {n}",
        speed: "speed: {v}",
        best: "best: {n} zero bits",
        found: "found: {n} (1 every ~{e})",
        zeros_n: "{n} hexadecimal zeros",
        pause: "Pause",
        mine: "Mine",
        bars_cap: "attempts expected to find a hash with N zeros",
        net_zeros: "Bitcoin today: ~{n} zeros",
        net_tries: "≈ {n} attempts per block",
        space: "nonce: 4,294,967,296 possible values",
        sweep: "the whole network tries them all in {t}",
        extranonce: "out of nonces → change the extranonce ({n}) → new Merkle root → nonce back to 0",
      },
      steps: [
        {
          title: "A numbered ticket",
          body:
            "Almost everything in the header stays still. The field the miner changes on every attempt is the **nonce**, a number from 0 to 4.29 billion.\n\nEach new nonce gives a completely different hash (lesson 2). It's like a numbered lottery ticket: change the number and it's a new ticket.",
        },
        {
          title: "The target",
          body:
            "A hash is also a number, 256 bits long. Bitcoin's rule: the header's hash must be **below a target**. In practice, it must start with a certain number of zeros.\n\nEach dot on the ruler is one attempt: the further right, the more leading zeros. Most land near zero. The green ones beat the toy target, 4 hexadecimal zeros (16 bits). Real Bitcoin needs about {netZeroBits} bits, way off the ruler.",
          more:
            "The target is stored in the header's `bits` field, in a compact format. Comparing with the target is comparing numbers; “N leading zero bits” is just a simple way to see it.",
        },
        {
          title: "Mine it yourself",
          body:
            "Your turn. Pick how many zeros to require and watch your browser really mine: double SHA-256 over a real header, changing the nonce every time.\n\nWith 4 zeros you get one every ~65 thousand attempts. With 6, one every ~16.8 million: you can feel the wait.",
          more:
            "A browser does a few hundred thousand hashes per second. SandraMine does tens of millions, using native code, every core and the GPU. An ASIC does hundreds of trillions.",
        },
        {
          title: "Each extra zero, 16× more work",
          body:
            "Each extra hexadecimal zero divides the odds by 16. 4 zeros take 65 thousand attempts; 8 take 4.3 billion.\n\nBitcoin today asks for about {netZeros} zeros: around {netTries} attempts per block, on average. That's why a block is worth something: it **proves** that work was done, and anyone can check it with a single hash.",
        },
        {
          title: "What happens when the nonces run out?",
          body:
            "4.29 billion sounds like a lot, but the whole network tries every nonce in {nonceSweep}.\n\nThen the miner changes another detail: the **extranonce**, a field inside the coinbase. The coinbase changes, the Merkle root changes (lesson 3) and the header becomes a new one, with 4.29 billion fresh nonces.",
          more:
            "Over Stratum, the pool provides extranonce1 and the miner varies extranonce2. The time and some version bits can also change (version rolling, BIP 320). In SandraMine, each CPU thread and the GPU use their own extranonce2 so they never repeat work.",
        },
      ],
    },

    difficulty: {
      title: "Why one block every ~10 minutes?",
      summary: "The difficulty adjustment, with the next one live.",
      labels: {
        avg: "{n} blocks · average {m} min",
        row_normal: "normal hashrate",
        row_double: "twice the miners",
        row_adjusted: "after the difficulty adjustment",
        epoch_cap: "2016 blocks",
        expected: "expected: 14 days",
        took: "took: 7 days",
        result: "difficulty × 2 → back to ~10 min",
        live_cap: "current period: 2016 blocks",
        blocks_done: "{n} blocks mined",
        blocks_left: "{n} to go",
        est_change: "next adjustment (estimate)",
        orphan: "orphan: discarded",
        split: "two winners almost at once",
      },
      steps: [
        {
          title: "A lottery, not a clock",
          body:
            "Nobody times the blocks. Every hash is a draw, so a block appears when someone gets lucky: sometimes in 1 minute, sometimes in 40.\n\nOn average, though, there's one every **10 minutes**. Each square is a block in a 2-hour simulation.",
        },
        {
          title: "More miners, faster blocks",
          body:
            "If the number of miners doubles, the network makes twice the attempts per second and blocks come twice as fast.\n\nWithout a correction, new coins would come out ahead of schedule and the network's pace would change with every machine switched on.",
        },
        {
          title: "Every 2016 blocks, the rule corrects itself",
          body:
            "Every **2016 blocks** (two weeks, if the average is 10 min), each node compares the expected time with the real one and adjusts the difficulty by the same ratio.\n\nIf it took 7 days instead of 14, the target gets 2× harder and blocks go back to ~10 minutes. Nobody decides this: every node does the same math.",
          more: "New difficulty = old × 14 days ÷ actual time, limited to 4× up or down per adjustment.",
        },
        {
          title: "Live: the current period",
          body:
            "This period has {retargetBlocks} blocks to go. At the pace so far, the difficulty should change by **{retargetChange}** at the next adjustment.\n\nThe current difficulty is {difficulty}: finding a block today is {difficulty} times harder than at Bitcoin's start.",
        },
        {
          title: "So why 10 minutes?",
          body:
            "It's a compromise. Sometimes two miners find a block almost together and the network splits for a moment. The next block settles it, and the other becomes an **orphan**: its work is thrown away.\n\nWith very fast blocks this would happen all the time, because a block takes a few seconds to cross the world. With very slow blocks, confirmations would take too long.",
        },
      ],
    },

    odds: {
      title: "What are your odds?",
      summary: "Napkin math: your hashrate against the network's.",
      labels: {
        axis_cap: "hashrate (log scale: each mark = 1,000×)",
        network: "network",
        gap: "the network is {x} times faster than you",
        f_you: "you",
        f_net: "whole network",
        f_block: "chance per block",
        r_day: "chance per day",
        r_year: "chance per year",
        r_wait: "average time to a block",
        today: "today: 144 draws",
        tally: "{n} of 144 draws · no win · tomorrow the odds are the same",
        ev_day: "expected value per day",
        ev_year: "per year",
      },
      steps: [
        {
          title: "One draw per block",
          body:
            "Every ~10 minutes there's a draw, and your number of tickets is your hashrate. Pick a device below the animation.\n\nThe scale is logarithmic: each mark is 1,000 times the previous one. With {myHash}, the network ({hashrate}) is about {orders} orders of magnitude ahead of you.",
        },
        {
          title: "Do the math",
          body:
            "Your chance of finding a block is your slice of the total hashrate: **your hashrate ÷ network hashrate**.\n\nWith {myHash}, that's **{pBlock}** per block.",
        },
        {
          title: "Per day, per year",
          body:
            "There are 144 blocks a day and 52,560 a year. With {myHash}: {pDay} per day and {pYear} per year.\n\nOn average, one block every **{wait}**. For scale: the dinosaurs died out 66 million years ago. With a 50 kH/s NerdMiner, the wait is longer than the age of the universe (13.8 billion years).",
        },
        {
          title: "The lottery has no memory",
          body:
            "Every block is a new draw. A day without winning, or ten years, doesn't raise the odds of the next one: they stay exactly the same.\n\nThe flip side holds too: the odds are tiny, but never zero. It could be the next block.",
        },
        {
          title: "Expected value",
          body:
            "Multiply the odds by the prize ({subsidy} BTC, not counting fees) and the expected value with {myHash} is **{evDay} per day**, or {evYear} per year.\n\nIn a pool the math is the same: it just trades the rare prize for small, frequent payments. That's the next lesson.",
        },
      ],
    },

    pool: {
      title: "Pool or solo: what does each buy you, and cost you?",
      summary: "The whole prize, rarely, or small pieces, always.",
      labels: {
        chart_cap: "BTC earned over 1 year · a miner expecting 2 blocks a year",
        month: "month {n}",
        solo_runs: "solo: 3 possible years",
        pool_line: "pool: same average, no surprises",
        pool: "POOL",
        block: "block!",
        shares_n: "{n} shares received",
        split: "prize split by shares",
        col_solo: "Solo",
        col_pool: "Pool",
        row_prize: "prize",
        row_often: "how often",
        row_fee: "fee",
        row_variance: "variance",
        row_payout: "minimum payout",
        solo_prize: "the whole block",
        pool_prize: "a slice of every block",
        solo_often: "very rarely",
        pool_often: "every day",
        solo_fee: "0 to 2%",
        pool_fee: "1 to 4%",
        solo_variance: "huge",
        pool_variance: "low",
        solo_payout: "none",
        pool_payout: "must build up",
        at_rate: "at {h} (a regular computer)",
        pool_pays: "a pool would pay per day",
        min_payout: "~1,000 sats to withdraw: {t}",
        solo_ticket: "solo is a ticket to",
        solo_wait: "on average, 1 block every {t}",
      },
      steps: [
        {
          title: "Solo: all or nothing",
          body:
            "Picture a miner big enough to expect **2 blocks a year**. Mining alone, their year could have no blocks, one, or several: each orange line is one possible year.\n\nThe average is the same, but nobody lives on the average: months of nothing can pass between blocks.",
        },
        {
          title: "Pool: same average, no surprises",
          body:
            "In a **pool**, many miners add up their hashrate and split every prize. The green line grows every day, a little below the average because of the pool's fee.\n\nYou trade the chance of a big prize for a predictable income.",
        },
        {
          title: "How does the pool know who worked?",
          body:
            "Through **shares**: hashes that beat a target much easier than the network's. They aren't worth a block, but they prove how much each miner tried, like scratch tickets.\n\nWhen someone finds a hash good enough for the network, the prize is split by each miner's number of shares.",
          more:
            "The share target is agreed with the pool (`mining.suggest_difficulty` over Stratum). NerdMiner's screen counts “32BITS SHARES”: hashes starting with 32 zero bits.",
        },
        {
          title: "Side by side",
          body:
            "Solo and pool have the **same expected value**. The difference is how it arrives: all at once and rarely, or in small pieces and always.\n\nPools charge a fee and only pay once your balance passes a minimum.",
        },
        {
          title: "Why SandraMine mines solo",
          body:
            "On a regular computer, the pool math doesn't work: it would pay {poolDay} a day, and building up the minimum payout would take {payoutWait}.\n\nSolo, the same computer holds a real ticket for the whole block: on average, one every {soloWait}. Unlikely, and that's why it's called **lottery mining**: the point is to learn and have fun, like the original NerdMiner.",
        },
      ],
    },

    fees: {
      title: "Who pays to get into the block?",
      summary: "Fees, the mempool and the bus with limited seats.",
      labels: {
        proj_cap: "next blocks, projected from the mempool right now",
        first: "leaves first",
        mempool_total: "mempool: {mb} MB ≈ {n} blocks",
        small_tx: "simple transaction · 140 vB",
        big_tx: "transaction with many inputs · 560 vB",
        fee_calc: "{vb} vB × {rate} sat/vB = {sats} sats",
        same_priority: "same fee per byte = same priority",
        your_fee: "paying {rate} sat/vB",
        eta: "~{m} min",
        eta_later: "after these blocks: could take hours",
        stuck: "paid too little ({rate} sat/vB): left behind",
        rbf: "fee bumped to {rate} sat/vB (RBF): moved to the front",
        subsidy_cap: "new coins per block (BTC) · halved every 210,000 blocks",
        here: "now",
      },
      steps: [
        {
          title: "A bus with limited seats",
          body:
            "Each block has room for about 1 million vbytes. Right now {mempoolMB} MB are waiting, enough to fill several blocks.\n\nThe numbers are the median fee of each of the next blocks, according to mempool.space. The leftmost one is the next to leave.",
        },
        {
          title: "You pay per byte",
          body:
            "The fee doesn't depend on the amount sent but on the transaction's **size**. A transaction with many inputs takes more room and pays more in total.\n\nWhat sets the priority is the fee per byte, in **sat/vB**. It's the same for both above, so both have the same chance.",
        },
        {
          title: "How much to pay right now?",
          body:
            "Pick a fee below the animation and see which block your transaction would get into. Paying {rate} sat/vB: {eta}.\n\nRight now the next block is around {feeFast} sat/vB, and ~1 hour about {feeHour} sat/vB. It changes every minute: the mempool is a continuous auction.",
        },
        {
          title: "Stuck?",
          body:
            "Paid too little and traffic went up? The transaction isn't lost: it waits. To speed it up, the wallet can **replace** it with a version paying a higher fee (RBF, replace-by-fee).\n\nAnother way is **CPFP**: the receiver spends the still-unconfirmed coin in a high-fee transaction, and the miner takes both together.",
        },
        {
          title: "New coins and fees",
          body:
            "The block prize has two parts: **new coins** ({subsidy} BTC today) and **fees**. New coins halve every 210,000 blocks, at the **halving**. The next one is {halvingBlocks} blocks away, about {halvingTime}.\n\nAround 2140 there will be no more new coins, and the network's security will rely on fees alone.",
        },
      ],
    },

    nerdminer: {
      title: "Final project: your NerdMiner",
      summary: "Every number on SandraMine's screens, explained.",
      labels: {
        screen_cap: "SandraMine (NerdMiner v2 interface)",
        c_hashrate: "hashrate",
        c_hashrate_sub: "nonces tried per second",
        c_total: "million hashes",
        c_total_sub: "attempts since you opened it",
        c_uptime: "time mining",
        c_uptime_sub: "how long you've been buying tickets",
        c_templates: "block templates",
        c_templates_sub: "candidate blocks from the pool",
        c_best: "best difficulty",
        c_best_sub: "your best hash so far",
        c_shares: "32bits shares",
        c_shares_sub: "hashes with 32 zero bits",
        c_valid: "valid blocks",
        c_valid_sub: "blocks found: the prize!",
        c_height: "current block",
        c_height_sub: "height of the chain",
        c_difficulty: "difficulty",
        c_difficulty_sub: "how hard the target is",
        c_nethash: "global hashrate",
        c_nethash_sub: "the whole network against you",
        c_fee: "medium fee",
        c_fee_sub: "fee per byte right now",
        c_halving: "halving",
        c_halving_sub: "blocks until new coins halve",
        loop_center: "The cycle",
        loop_sub: "click a stage",
        loop_1: "Transaction",
        loop_8: "Fees and mempool",
        loop_3: "Block and header",
        loop_2: "Hash",
        loop_4: "Nonce and target",
        loop_5: "Difficulty",
        loop_6: "Your odds",
        loop_7: "Pool or solo",
      },
      steps: [
        {
          title: "The engine",
          body:
            "This is SandraMine's main screen, the same as NerdMiner's. The big number is the **hashrate**: how many nonces per second your computer tries (lesson 4).\n\nNext to it are the total hashes since you opened the app and how long it's been mining. Click a number to go to the lesson that explains it.",
        },
        {
          title: "The scoreboard",
          body:
            "**Block templates** counts the candidate blocks the pool sent (lessons 1 and 3). **Best difficulty** is your best hash, the one with the most zeros (lesson 4).\n\n**32BITS SHARES** are hashes with 32 zero bits, like a pool's shares (lesson 7). **Valid blocks** is the number everyone hopes to see turn into 1 (lesson 6).",
          more:
            "Best difficulty compares your best hash with the easiest possible target (difficulty 1). If it ever passes the network difficulty, {difficulty} today, you found a block.",
        },
        {
          title: "The network",
          body:
            "The Global Stats screen shows the whole network: the chain's **height** (lesson 1), the **difficulty** set by the adjustment (lesson 5) and the **global hashrate** you're up against (lesson 6).\n\nThey're the same numbers as in this course, from the same place: mempool.space.",
        },
        {
          title: "The money",
          body:
            "**Medium fee** is the fee per byte right now (lesson 8). The **halving** strip counts how many blocks are left until new coins halve: right now, {halvingBlocks}.",
        },
        {
          title: "The full cycle",
          body:
            "Transaction, mempool, block, hash, nonce, difficulty, odds and pool: the same path as lesson 1, now with every stage opened up. Click a stage to revisit it.\n\nTo watch all of this happen on your own computer, [download SandraMine](../#download). The app's 3D lab shows these stages using the hashes your miner just tried.",
        },
      ],
    },
  },
};
