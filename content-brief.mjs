// content-brief.mjs
  // Takes a keyword, pulls top Google results via Serper, outputs a content brief

  const SERPER_API_KEY = process.env.SERPER_API_KEY;
  const keyword = process.argv[2];

  if (!keyword) {
    console.error('Usage: node content-brief.mjs "your keyword here"');
    process.exit(1);
  }

  if (!SERPER_API_KEY) {
    console.error('Set SERPER_API_KEY environment variable');
    process.exit(1);
  }

  async function getSearchResults(query) {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query, num: 10 })
    });

    return res.json();
  }

  async function getPeopleAlsoAsk(query) {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query, num: 10 })
    });

    const data = await res.json();
    return data.peopleAlsoAsk || [];
  }

  function buildBrief(keyword, results, questions) {
    const organic = results.organic || [];

    let brief = '';
    brief += `\n# CONTENT BRIEF: "${keyword}"\n`;
    brief += `Generated: ${new Date().toISOString().split('T')[0]}\n\n`;

    // Top ranking content analysis
    brief += `## TOP 10 RANKING PAGES\n\n`;
    organic.slice(0, 10).forEach((r, i) => {
      brief += `${i + 1}. **${r.title}**\n`;
      brief += `   ${r.link}\n`;
      brief += `   ${r.snippet || ''}\n\n`;
    });

    // People also ask
    if (questions.length > 0) {
      brief += `## PEOPLE ALSO ASK\n\n`;
      questions.forEach(q => {
        brief += `- ${q.question}\n`;
      });
      brief += `\n`;
    }

    // Prompt for Claude/OpenClaw to generate the actual brief
    brief += `## BRIEF GENERATION PROMPT\n\n`;
    brief += `Use the above data to create a content brief with:\n\n`;
    brief += `1. **RECOMMENDED TITLE OPTIONS** (3 options, include the keyword "${keyword}")\n`;
    brief += `2. **TARGET WORD COUNT** (based on top-ranking content)\n`;
    brief += `3. **SEARCH INTENT** (informational, transactional, navigational)\n`;
    brief += `4. **OUTLINE** - H1, H2s, H3s that cover the topic. Include sections competitors have + 2-3 sections they're
  MISSING\n`;
    brief += `5. **PEOPLE ALSO ASK** - Address these questions in the content\n`;
    brief += `6. **COMPETITOR GAPS** - What are the top results missing?\n`;
    brief += `7. **INTERNAL LINKING** - Suggest links to/from simplefileupload.com pages\n`;

    return brief;
  }

  async function main() {
    console.log(`Searching for: "${keyword}"...\n`);

    const [results, questions] = await Promise.all([
      getSearchResults(keyword),
      getPeopleAlsoAsk(keyword)
    ]);

    const brief = buildBrief(keyword, results, questions);
    console.log(brief);
  }

  main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
