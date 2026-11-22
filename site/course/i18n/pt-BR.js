// Português (Brasil). Mesma estrutura de en.js; o que faltar aqui aparece em inglês.
// Texto: linha em branco = parágrafo, **negrito**, `código`, {valor} = número ao vivo.
export default {
  ui: {
    page_title: "Como funciona a mineração de Bitcoin · curso animado grátis · SandraMine",
    page_description: "Curso gratuito, animado e passo a passo sobre como funciona a mineração de Bitcoin, com dados reais da rede.",
    nav: { lottery: "Loteria", features: "Recursos", status: "Status", lab: "Laboratório", course: "Curso", download: "Download", setup: "Configurar", faq: "FAQ" },
    footer_note: "Licença MIT. Interface baseada no NerdMiner v2 © 2023 BitMaker (MIT). Dados da rede por mempool.space. Sem vínculo com o projeto original.",
    memorial: "Em memória de Sandra",
    manual: "Manual",
    manual_url: "https://github.com/tnarnold/sandra-mine/blob/main/docs/MANUAL.pt-BR.md",
    course: "Curso",
    free: "Grátis",
    home_title: "Como funciona a mineração de Bitcoin",
    home_lead:
      "Um curso curto, animado e passo a passo. Cada lição responde a uma pergunta e mostra a resposta acontecendo, com hashes calculados de verdade no seu navegador e números ao vivo da rede.\n\nAgora mesmo a rede está no bloco {height}, com {hashrate} de poder de cálculo.",
    start: "Começar",
    continue: "Continuar",
    soon: "Em breve",
    done: "Concluída",
    steps: "{n} passos",
    all_lessons: "Todas as lições",
    lesson_n: "Lição {n} de {total}",
    step_n: "Passo {n} de {total}",
    more: "Mais detalhes",
    prev: "Anterior",
    next: "Próximo",
    replay: "Repetir este passo (R)",
    next_lesson: "Próxima lição",
    finish: "Concluir",
    offline: "Sem conexão com o mempool.space: os números da rede são aproximados.",
    one_in: "1 em {n}",
    units: { years: "anos", days: "dias" },
  },

  lessons: {
    follow: {
      title: "Siga uma transação",
      summary: "Da carteira até a corrente de blocos: o caminho inteiro, em 6 passos.",
      labels: {
        wallet: "carteira",
        nodes: "nós da rede",
        mempool: "mempool",
        fee_legend: "cinza = taxa baixa · laranja = taxa alta",
        candidate: "bloco candidato",
        tx_line1: "Ana → Beto",
        tx_line2: "0,001 BTC · taxa 2 sat/vB",
        nonce: "nonce",
        hash: "hash",
        conf_one: "{n} confirmação",
        conf_many: "{n} confirmações",
      },
      steps: [
        {
          title: "Você aperta “enviar”",
          body:
            "Ana quer mandar 0,001 BTC para Beto. A carteira dela monta uma **transação**: de onde vem o dinheiro, para onde vai e quanto ela paga de **taxa**.\n\nDepois a carteira **assina** a transação com a chave privada da Ana. A assinatura prova que a dona do dinheiro autorizou, sem revelar a chave.",
          more:
            "Uma transação gasta saídas de transações anteriores (UTXOs) e cria saídas novas. A taxa não aparece escrita: é a diferença entre o que entra e o que sai.",
        },
        {
          title: "A notícia se espalha",
          body:
            "A transação vai para um **nó**, um computador que roda o Bitcoin. Ele confere a assinatura e se o saldo existe, e repassa para os vizinhos. Eles conferem e repassam de novo.\n\nEm poucos segundos, milhares de nós no mundo todo conhecem a transação. Ninguém manda na rede: cada nó confere tudo sozinho.",
        },
        {
          title: "A sala de espera",
          body:
            "Ainda não está confirmada. A transação entra na **mempool**, a sala de espera de cada nó. Agora mesmo há {mempoolCount} transações esperando (cerca de {mempoolMB} MB).\n\nO quadrado com borda branca é a da Ana. A cor indica a taxa: quanto mais laranja, mais a pessoa pagou por byte.",
        },
        {
          title: "Um minerador monta um bloco",
          body:
            "O bloco tem espaço limitado, como um ônibus com poucos lugares. O minerador escolhe primeiro quem paga mais por byte. Para o próximo bloco, a taxa está em torno de {feeFast} sat/vB.\n\nO primeiro lugar é especial: a **coinbase**, a transação que paga o próprio minerador. Hoje são {subsidy} BTC novos, mais todas as taxas do bloco.",
          more:
            "O limite é de 4 milhões de weight units, cerca de 1 MB de dados. A seleção leva em conta pacotes de pai e filho (CPFP). Na lição 8 a gente olha as taxas de perto.",
        },
        {
          title: "A loteria",
          body:
            "Para o bloco valer, o minerador precisa encontrar um **hash** que comece com muitos zeros. Não existe atalho: ele muda um número chamado **nonce** e tenta de novo, trilhões de vezes por segundo.\n\nA rede inteira faz {hashrate}. Quem acha primeiro ganha a recompensa. As próximas lições abrem essa caixa: o que é um hash (2), o que é minerado (3) e por que os zeros (4).",
        },
        {
          title: "Entra na corrente",
          body:
            "O bloco vencedor é espalhado pela rede. Cada nó confere tudo de novo e o coloca no fim da **corrente de blocos**. A transação da Ana tem agora **1 confirmação**.\n\nCada bloco que vem depois soma mais uma. Com 6 confirmações, cerca de 1 hora, desfazer o pagamento exigiria refazer todo esse trabalho mais rápido que o resto do mundo. Na prática, é impossível.",
        },
      ],
    },

    hash: {
      title: "Hash: dá para prever o resultado?",
      summary: "A impressão digital dos dados, calculada de verdade aqui no navegador.",
      labels: {
        input: "entrada",
        output: "SHA-256 (hex)",
        input_b: "entrada com 1 letra diferente",
        output_b: "novo SHA-256",
        bits_a: "os 256 bits",
        bits_b: "bits do novo hash",
        bits_diff: "bits que mudaram",
        of_256: "de 256 bits",
        sizes: "entrada: {n} bytes → saída: sempre 32 bytes (256 bits)",
        identical: "idêntico",
        type_here: "Digite qualquer coisa…",
        sample: "SandraMine",
        change_letter: "Mudar outra letra",
        genesis_cap: "cabeçalho do bloco 0 (80 bytes)",
        genesis_out: "hash do bloco 0 (3 jan. 2009)",
        genesis_bits: "bits do hash · zeros em laranja-escuro",
        no_way_back: "não dá para voltar",
      },
      steps: [
        {
          title: "Uma impressão digital",
          body:
            "Uma **função de hash** pega qualquer dado e devolve um código de tamanho fixo. O Bitcoin usa o **SHA-256**.\n\nDigite na caixa abaixo da animação: o hash é recalculado a cada tecla, aqui mesmo no seu navegador.",
        },
        {
          title: "Sempre do mesmo tamanho",
          body:
            "Uma letra ou um livro inteiro: a saída tem sempre **256 bits** (64 caracteres em hexadecimal). A grade mostra esses bits, com claro = 1 e escuro = 0.\n\nPor isso o hash é um ótimo resumo: dá para comparar arquivos enormes olhando só 32 bytes.",
        },
        {
          title: "Mesma entrada, mesmo resultado",
          body:
            "Calcule de novo e o resultado sai **idêntico**, aqui ou em qualquer computador do mundo. É isso que deixa milhares de nós conferirem o mesmo bloco e chegarem à mesma resposta.",
        },
        {
          title: "Mude uma letra",
          body:
            "Agora a segunda linha usa o mesmo texto com **uma** letra trocada. O hash muda por completo: {flipped} dos 256 bits viraram, cerca de metade, sem padrão nenhum. Isso se chama **efeito avalanche**.\n\nClique em “Mudar outra letra” ou edite o texto e veja: nunca dá para prever quais bits vão virar.",
        },
        {
          title: "Não dá para voltar",
          body:
            "Olhando só o hash, não existe jeito de descobrir a entrada. A única forma de achar uma entrada com um hash especial é **tentar, tentar e tentar**.\n\nO Bitcoin aplica o SHA-256 **duas vezes** no cabeçalho do bloco. Acima está o bloco 0, de 2009, calculado agora: o hash começa com {zeros} zeros hexadecimais ({zeroBits} bits). Esses zeros não são sorte; foram o trabalho. É o assunto da lição 4.",
        },
      ],
    },

    merkle: {
      title: "Como milhares de transações viram um resumo só?",
      summary: "A árvore de Merkle e o cabeçalho de 80 bytes: o que de fato é minerado.",
      labels: {
        root: "raiz",
        cap_leaves: "cada transação vira um hash (SHA-256 duplo)",
        cap_pairs: "hash(esquerda + direita), de dois em dois",
        cap_root: "um único hash resume as 8 transações",
        cap_changed: "raiz antes: {old}…  agora: {now}…",
        tamper: "Alterar outra transação",
        header_cap: "cabeçalho do bloco: 80 bytes",
        f_version: "versão",
        f_prev: "hash do bloco anterior",
        f_merkle: "raiz de Merkle",
        f_time: "horário",
        f_bits: "alvo",
        f_nonce: "nonce",
        prev_block: "cabeçalho do bloco anterior",
        broken: "o elo não bate mais",
      },
      steps: [
        {
          title: "Muitas transações",
          body:
            "Um bloco costuma ter milhares de transações. Aqui usamos 8 para caber na tela. A primeira, em laranja, é a **coinbase**, que paga o minerador.\n\nCada transação é representada pelo seu hash, calculado de verdade agora.",
        },
        {
          title: "De duas em duas",
          body:
            "Os hashes são juntados aos pares e cada par vira um hash novo, como as chaves de um torneio. De 8 sobram 4.",
          more:
            "Cada nó é SHA-256d(esquerda ‖ direita). Se um nível tiver número ímpar de itens, o último é duplicado.",
        },
        {
          title: "Até sobrar um",
          body:
            "Repete-se até sobrar um único hash: a **raiz de Merkle**. Ela resume todas as transações do bloco em 32 bytes.\n\nCom 3 mil transações seriam só 12 níveis. A árvore cresce devagar mesmo para blocos enormes.",
        },
        {
          title: "Mexeu em uma, muda tudo",
          body:
            "Alteramos uma transação. O hash dela muda, então muda o do par, e o do par acima, até a **raiz**. Ninguém consegue mexer numa transação sem que a raiz denuncie.\n\nClique em “Alterar outra transação” para ver o caminho vermelho subir.",
          more:
            "Isso também permite provar que uma transação está no bloco mostrando só os hashes do caminho até a raiz (prova de Merkle), sem baixar o bloco inteiro. É o que uma pool envia ao minerador no Stratum: o `merkle_branch`.",
        },
        {
          title: "O cabeçalho de 80 bytes",
          body:
            "O minerador não faz hash do bloco inteiro, só de um **cabeçalho de 80 bytes**. A raiz de Merkle ocupa 32 deles. É ela que liga o cabeçalho a todas as transações.\n\nOs outros campos são a versão, o **hash do bloco anterior**, o horário, o **alvo** de dificuldade e o **nonce**, o único campo que o minerador fica mudando.",
          more:
            "Ordem dos bytes: version (4) | prev_hash (32) | merkle_root (32) | time (4) | bits (4) | nonce (4), com inteiros em little-endian. Como os primeiros 64 bytes não mudam entre tentativas, o minerador guarda o estado do SHA-256 depois deles (o midstate) e economiza trabalho.",
        },
        {
          title: "Uma corrente de cabeçalhos",
          body:
            "Cada cabeçalho guarda o **hash do bloco anterior**. É isso que forma a corrente.\n\nSe alguém alterar uma transação antiga, a raiz daquele bloco muda, o hash dele muda e o elo com o bloco seguinte quebra. Para disfarçar, teria que refazer a mineração desse bloco e de todos os que vieram depois, mais rápido que a rede inteira.",
        },
      ],
    },

    nonce: {
      title: "O que muda a cada tentativa?",
      summary: "Nonce, alvo e por que os zeros: mine de brincadeira no navegador.",
      labels: {
        header: "cabeçalho do bloco (80 bytes)",
        merkle: "raiz de Merkle",
        prev: "bloco anterior",
        ruler: "bits zero no início do hash · mais à direita = mais raro",
        net_bits: "Bitcoin hoje: ~{bits} bits",
        target_zeros: "alvo: {n} zeros",
        tries: "tentativas: {n}",
        speed: "velocidade: {v}",
        best: "recorde: {n} bits zero",
        found: "achados: {n} (1 a cada ~{e})",
        zeros_n: "{n} zeros hexadecimais",
        pause: "Pausar",
        mine: "Minerar",
        bars_cap: "tentativas esperadas para achar um hash com N zeros",
        net_zeros: "Bitcoin hoje: ~{n} zeros",
        net_tries: "≈ {n} tentativas por bloco",
        space: "nonce: 4.294.967.296 valores possíveis",
        sweep: "a rede inteira testa todos em {t}",
        extranonce: "acabou → muda o extranonce ({n}) → nova raiz de Merkle → nonce volta a 0",
      },
      steps: [
        {
          title: "Um bilhete numerado",
          body:
            "No cabeçalho, quase tudo fica parado. O campo que o minerador muda a cada tentativa é o **nonce**, um número de 0 a 4,29 bilhões.\n\nCada nonce novo dá um hash completamente diferente (lição 2). É como um bilhete de loteria numerado: mudou o número, é um bilhete novo.",
        },
        {
          title: "O alvo",
          body:
            "Um hash também é um número, de 256 bits. A regra do Bitcoin: o hash do cabeçalho precisa ficar **abaixo de um alvo**. Na prática, começar com uma certa quantidade de zeros.\n\nCada ponto na régua é uma tentativa: quanto mais à direita, mais zeros no começo. A maioria fica perto do zero. Os verdes passaram do alvo de brincadeira, 4 zeros hexadecimais (16 bits). O Bitcoin de verdade exige uns {netZeroBits} bits, bem fora da régua.",
          more:
            "O alvo fica no campo `bits` do cabeçalho, num formato compacto. Comparar com o alvo é comparar números; “ter N bits zero no começo” é só um jeito simples de enxergar isso.",
        },
        {
          title: "Mine você mesmo",
          body:
            "Agora é com você. Escolha quantos zeros exigir e veja o navegador minerar de verdade: SHA-256 duplo sobre um cabeçalho real, mudando o nonce a cada vez.\n\nCom 4 zeros sai um a cada ~65 mil tentativas. Com 6, um a cada ~16,8 milhões: dá para sentir a espera.",
          more:
            "O navegador faz algumas centenas de milhares de hashes por segundo. O SandraMine faz dezenas de milhões, porque usa código nativo, todos os núcleos e a GPU. Um ASIC faz centenas de trilhões.",
        },
        {
          title: "Cada zero a mais, 16× mais trabalho",
          body:
            "Cada zero hexadecimal a mais divide a chance por 16. Com 4 zeros são 65 mil tentativas; com 8, 4,3 bilhões.\n\nO Bitcoin hoje pede uns {netZeros} zeros: cerca de {netTries} tentativas por bloco, em média. É por isso que o bloco vale alguma coisa: ele **prova** que esse trabalho foi feito, e qualquer um confere com um único hash.",
        },
        {
          title: "E quando os nonces acabam?",
          body:
            "4,29 bilhões parece muito, mas a rede inteira testa todos os nonces em {nonceSweep}.\n\nAí o minerador muda outro detalhe: o **extranonce**, um campo dentro da coinbase. A coinbase muda, a raiz de Merkle muda (lição 3) e o cabeçalho vira outro, com 4,29 bilhões de nonces novinhos.",
          more:
            "No Stratum, a pool fornece o extranonce1 e o minerador varia o extranonce2. Também dá para variar o horário e alguns bits da versão (version rolling, BIP 320). No SandraMine, cada thread de CPU e a GPU usam um extranonce2 próprio para não repetir trabalho.",
        },
      ],
    },

    difficulty: {
      title: "Por que um bloco a cada ~10 minutos?",
      summary: "O ajuste de dificuldade, com o próximo ajuste ao vivo.",
      labels: {
        avg: "{n} blocos · média {m} min",
        row_normal: "hashrate normal",
        row_double: "o dobro de mineradores",
        row_adjusted: "depois do ajuste de dificuldade",
        epoch_cap: "2016 blocos",
        expected: "previsto: 14 dias",
        took: "levou: 7 dias",
        result: "dificuldade × 2 → de volta a ~10 min",
        live_cap: "período atual: 2016 blocos",
        blocks_done: "{n} blocos minerados",
        blocks_left: "faltam {n}",
        est_change: "próximo ajuste (estimativa)",
        orphan: "órfão: descartado",
        split: "dois vencedores quase juntos",
      },
      steps: [
        {
          title: "Uma loteria, não um relógio",
          body:
            "Ninguém marca o tempo dos blocos. Cada hash é um sorteio, então o bloco sai quando alguém dá sorte: às vezes em 1 minuto, às vezes em 40.\n\nEm média, porém, sai um a cada **10 minutos**. Cada quadrado é um bloco numa simulação de 2 horas.",
        },
        {
          title: "Mais mineradores, blocos mais rápidos",
          body:
            "Se o número de mineradores dobra, a rede faz o dobro de tentativas por segundo e os blocos saem duas vezes mais rápido.\n\nSem correção, as moedas novas sairiam antes do previsto e o ritmo da rede mudaria a cada máquina ligada.",
        },
        {
          title: "A cada 2016 blocos, a regra corrige",
          body:
            "A cada **2016 blocos** (duas semanas, se a média for 10 min), cada nó compara o tempo previsto com o real e ajusta a dificuldade na mesma proporção.\n\nSe levou 7 dias em vez de 14, o alvo fica 2× mais difícil e os blocos voltam para ~10 minutos. Ninguém decide isso: todo nó faz a mesma conta.",
          more: "Nova dificuldade = antiga × 14 dias ÷ tempo real, limitada a 4× para cima ou para baixo em cada ajuste.",
        },
        {
          title: "Ao vivo: o período atual",
          body:
            "Neste período faltam {retargetBlocks} blocos. Pelo ritmo até agora, a dificuldade deve mudar **{retargetChange}** no próximo ajuste.\n\nA dificuldade atual é {difficulty}: achar um bloco hoje é {difficulty} vezes mais difícil que no começo do Bitcoin.",
        },
        {
          title: "E por que 10 minutos?",
          body:
            "É um meio-termo. Às vezes dois mineradores acham um bloco quase juntos e a rede se divide por um instante. O bloco seguinte desempata, e o outro vira **órfão**: o trabalho dele é jogado fora.\n\nCom blocos muito rápidos isso aconteceria o tempo todo, porque um bloco leva alguns segundos para atravessar o mundo. Com blocos muito lentos, as confirmações demorariam demais.",
        },
      ],
    },

    odds: {
      title: "Quais são as suas chances?",
      summary: "Conta de guardanapo: o seu hashrate contra o da rede.",
      labels: {
        axis_cap: "hashrate (escala logarítmica: cada marca = 1.000×)",
        network: "rede",
        gap: "a rede é {x} vezes mais rápida que você",
        f_you: "você",
        f_net: "rede inteira",
        f_block: "chance por bloco",
        r_day: "chance por dia",
        r_year: "chance por ano",
        r_wait: "tempo médio até um bloco",
        today: "hoje: 144 sorteios",
        tally: "{n} de 144 sorteios · nenhum prêmio · amanhã a chance é a mesma",
        ev_day: "valor esperado por dia",
        ev_year: "por ano",
      },
      steps: [
        {
          title: "Um sorteio a cada bloco",
          body:
            "A cada ~10 minutos acontece um sorteio, e o seu número de bilhetes é o seu hashrate. Escolha um equipamento abaixo da animação.\n\nA escala é logarítmica: cada marca vale 1.000 vezes a anterior. Com {myHash}, a rede ({hashrate}) está cerca de {orders} ordens de grandeza à sua frente.",
        },
        {
          title: "Faça a conta",
          body:
            "A chance de achar um bloco é a sua fatia do hashrate total: **seu hashrate ÷ hashrate da rede**.\n\nCom {myHash}, dá **{pBlock}** por bloco.",
        },
        {
          title: "Por dia, por ano",
          body:
            "São 144 blocos por dia e 52.560 por ano. Com {myHash}: {pDay} por dia e {pYear} por ano.\n\nEm média, um bloco a cada **{wait}**. Para comparar: os dinossauros sumiram há 66 milhões de anos. Com um NerdMiner de 50 kH/s, a espera passa da idade do universo (13,8 bilhões de anos).",
        },
        {
          title: "A loteria não tem memória",
          body:
            "Cada bloco é um sorteio novo. Um dia sem ganhar, ou dez anos, não aumenta a chance do próximo: ela continua exatamente a mesma.\n\nO outro lado também vale: a chance é minúscula, mas nunca é zero. Pode ser no próximo bloco.",
        },
        {
          title: "Valor esperado",
          body:
            "Multiplicando a chance pelo prêmio ({subsidy} BTC, sem contar as taxas), o valor esperado com {myHash} é de **{evDay} por dia**, ou {evYear} por ano.\n\nNuma pool a conta é a mesma: ela só troca o prêmio raro por pagamentos pequenos e frequentes. É a próxima lição.",
        },
      ],
    },

    pool: {
      title: "Pool ou solo: o que cada um te dá e te custa?",
      summary: "Prêmio inteiro raramente ou pedacinhos sempre.",
      labels: {
        chart_cap: "BTC acumulado em 1 ano · minerador que espera 2 blocos por ano",
        month: "mês {n}",
        solo_runs: "solo: 3 anos possíveis",
        pool_line: "pool: mesma média, sem sustos",
        pool: "POOL",
        block: "bloco!",
        shares_n: "{n} shares recebidas",
        split: "prêmio dividido pelas shares",
        col_solo: "Solo",
        col_pool: "Pool",
        row_prize: "prêmio",
        row_often: "frequência",
        row_fee: "taxa",
        row_variance: "variância",
        row_payout: "saque mínimo",
        solo_prize: "o bloco inteiro",
        pool_prize: "uma fração de cada bloco",
        solo_often: "raríssimo",
        pool_often: "todo dia",
        solo_fee: "0 a 2%",
        pool_fee: "1 a 4%",
        solo_variance: "enorme",
        pool_variance: "baixa",
        solo_payout: "não tem",
        pool_payout: "precisa acumular",
        at_rate: "com {h} (um computador comum)",
        pool_pays: "uma pool pagaria por dia",
        min_payout: "~1.000 sats para sacar: {t}",
        solo_ticket: "o solo é um bilhete para",
        solo_wait: "em média, 1 bloco a cada {t}",
      },
      steps: [
        {
          title: "Solo: tudo ou nada",
          body:
            "Imagine um minerador grande o bastante para esperar **2 blocos por ano**. Minerando sozinho, o ano dele pode não ter bloco nenhum, ter um ou ter vários: cada linha laranja é um ano possível.\n\nA média é a mesma, mas ninguém vive da média: entre um bloco e outro podem passar meses de zero.",
        },
        {
          title: "Pool: a mesma média, sem sustos",
          body:
            "Numa **pool**, muitos mineradores somam o hashrate e dividem cada prêmio. A linha verde cresce todo dia, um pouco abaixo da média por causa da taxa da pool.\n\nVocê troca a chance de um prêmio grande por uma renda previsível.",
        },
        {
          title: "Como a pool sabe quem trabalhou?",
          body:
            "Pelas **shares**: hashes que passam de um alvo bem mais fácil que o da rede. Elas não valem um bloco, mas provam quanto cada um tentou, como bilhetes de rascunho.\n\nQuando alguém acha um hash bom o bastante para a rede, o prêmio é dividido pela quantidade de shares de cada um.",
          more:
            "O alvo das shares é combinado com a pool (`mining.suggest_difficulty` no Stratum). A tela do NerdMiner conta as “32BITS SHARES”: hashes com 32 bits zero no começo.",
        },
        {
          title: "Lado a lado",
          body:
            "Solo e pool têm o **mesmo valor esperado**. A diferença está em como ele chega: tudo de uma vez e raramente, ou aos pouquinhos e sempre.\n\nPools cobram uma taxa e só pagam quando o saldo passa de um mínimo.",
        },
        {
          title: "Por que o SandraMine minera solo",
          body:
            "Com um computador comum, a conta da pool não fecha: ela pagaria {poolDay} por dia, e juntar o mínimo para sacar levaria {payoutWait}.\n\nNo solo, o mesmo computador tem um bilhete de verdade para o bloco inteiro: em média, um a cada {soloWait}. Improvável, e é por isso que se chama **mineração-loteria**: o objetivo é aprender e se divertir, como no NerdMiner original.",
        },
      ],
    },

    fees: {
      title: "Quem paga para entrar no bloco?",
      summary: "Taxas, mempool e o ônibus de lugares limitados.",
      labels: {
        proj_cap: "próximos blocos, projetados a partir da mempool agora",
        first: "sai primeiro",
        mempool_total: "mempool: {mb} MB ≈ {n} blocos",
        small_tx: "transação simples · 140 vB",
        big_tx: "transação com muitas entradas · 560 vB",
        fee_calc: "{vb} vB × {rate} sat/vB = {sats} sats",
        same_priority: "mesma taxa por byte = mesma prioridade",
        your_fee: "pagando {rate} sat/vB",
        eta: "~{m} min",
        eta_later: "depois desses blocos: pode levar horas",
        stuck: "pagou pouco ({rate} sat/vB): ficou para trás",
        rbf: "taxa aumentada para {rate} sat/vB (RBF): passou para a frente",
        subsidy_cap: "moedas novas por bloco (BTC) · caem à metade a cada 210.000 blocos",
        here: "agora",
      },
      steps: [
        {
          title: "Um ônibus com lugares limitados",
          body:
            "Cada bloco tem espaço para cerca de 1 milhão de vbytes. Agora há {mempoolMB} MB esperando, o que daria para encher vários blocos.\n\nOs números são a taxa mediana de cada um dos próximos blocos, segundo o mempool.space. O primeiro da esquerda é o próximo a sair.",
        },
        {
          title: "Paga-se por byte",
          body:
            "A taxa não depende do valor enviado, e sim do **tamanho** da transação. Uma transação com muitas entradas ocupa mais espaço e paga mais no total.\n\nO que define a prioridade é a taxa por byte, em **sat/vB**. Nas duas acima ela é igual, então as duas têm a mesma chance.",
        },
        {
          title: "Quanto pagar agora?",
          body:
            "Escolha uma taxa abaixo da animação e veja em qual bloco a sua transação entraria. Pagando {rate} sat/vB: {eta}.\n\nAgora o próximo bloco está em torno de {feeFast} sat/vB, e para ~1 hora uns {feeHour} sat/vB. Isso muda a cada minuto: a mempool é um leilão contínuo.",
        },
        {
          title: "Ficou presa?",
          body:
            "Pagou pouco e o movimento subiu? A transação não se perde: ela espera. Para acelerar, a carteira pode **substituí-la** por uma versão com taxa maior (RBF, replace-by-fee).\n\nOutro jeito é o **CPFP**: quem recebe gasta a moeda ainda não confirmada numa transação com taxa alta, e o minerador leva as duas juntas.",
        },
        {
          title: "Moedas novas e taxas",
          body:
            "O prêmio do bloco tem duas partes: as **moedas novas** ({subsidy} BTC hoje) e as **taxas**. As moedas novas caem à metade a cada 210.000 blocos, no **halving**. O próximo é daqui a {halvingBlocks} blocos, cerca de {halvingTime}.\n\nPor volta de 2140 não haverá mais moedas novas, e a segurança da rede vai depender só das taxas.",
        },
      ],
    },

    nerdminer: {
      title: "Projeto final: o seu NerdMiner",
      summary: "Cada número das telas do SandraMine, explicado.",
      labels: {
        screen_cap: "SandraMine (interface do NerdMiner v2)",
        c_hashrate: "hashrate",
        c_hashrate_sub: "nonces testados por segundo",
        c_total: "million hashes",
        c_total_sub: "tentativas desde que você abriu",
        c_uptime: "tempo minerando",
        c_uptime_sub: "há quanto tempo compra bilhetes",
        c_templates: "block templates",
        c_templates_sub: "blocos candidatos vindos da pool",
        c_best: "best difficulty",
        c_best_sub: "o seu melhor hash até agora",
        c_shares: "32bits shares",
        c_shares_sub: "hashes com 32 bits zero",
        c_valid: "valid blocks",
        c_valid_sub: "blocos achados: o prêmio!",
        c_height: "current block",
        c_height_sub: "altura da corrente",
        c_difficulty: "difficulty",
        c_difficulty_sub: "quão difícil está o alvo",
        c_nethash: "global hashrate",
        c_nethash_sub: "a rede inteira contra você",
        c_fee: "medium fee",
        c_fee_sub: "taxa por byte agora",
        c_halving: "halving",
        c_halving_sub: "blocos até as moedas novas caírem à metade",
        loop_center: "O ciclo",
        loop_sub: "clique numa etapa",
        loop_1: "Transação",
        loop_8: "Taxa e mempool",
        loop_3: "Bloco e cabeçalho",
        loop_2: "Hash",
        loop_4: "Nonce e alvo",
        loop_5: "Dificuldade",
        loop_6: "Suas chances",
        loop_7: "Pool ou solo",
      },
      steps: [
        {
          title: "O motor",
          body:
            "Esta é a tela principal do SandraMine, igual à do NerdMiner. O número grande é o **hashrate**: quantos nonces por segundo o seu computador testa (lição 4).\n\nAo lado ficam o total de hashes desde que você abriu o app e há quanto tempo ele está minerando. Clique num número para ir à lição que o explica.",
        },
        {
          title: "O placar",
          body:
            "**Block templates** conta os blocos candidatos que a pool mandou (lições 1 e 3). **Best difficulty** é o seu melhor hash, o que teve mais zeros (lição 4).\n\n**32BITS SHARES** são hashes com 32 bits zero, como as shares de uma pool (lição 7). **Valid blocks** é o número que todo mundo espera ver virar 1 (lição 6).",
          more:
            "A best difficulty compara o seu melhor hash com o alvo mais fácil possível (dificuldade 1). Se ela passar da dificuldade da rede, hoje {difficulty}, você achou um bloco.",
        },
        {
          title: "A rede",
          body:
            "A tela Global Stats mostra a rede inteira: a **altura** da corrente (lição 1), a **dificuldade** definida pelo ajuste (lição 5) e o **hashrate global** que você enfrenta (lição 6).\n\nSão os mesmos números deste curso, vindos do mesmo lugar: o mempool.space.",
        },
        {
          title: "O dinheiro",
          body:
            "**Medium fee** é a taxa por byte do momento (lição 8). A faixa do **halving** conta quantos blocos faltam para as moedas novas caírem à metade: agora, {halvingBlocks}.",
        },
        {
          title: "O ciclo completo",
          body:
            "Transação, mempool, bloco, hash, nonce, dificuldade, chances e pool: o mesmo caminho da lição 1, agora com cada etapa aberta. Clique numa etapa para revê-la.\n\nPara ver tudo isso acontecendo no seu computador, [baixe o SandraMine](../#download). O laboratório 3D do app mostra estas etapas com os hashes que o seu minerador acabou de testar.",
        },
      ],
    },
  },
};
