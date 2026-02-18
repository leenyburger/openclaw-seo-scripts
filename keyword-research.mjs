// keyword-research.mjs

  const API_KEY = process.env.KEYWORDS_EVERYWHERE_API_KEY;
  const BASE_URL = 'https://api.keywordseverywhere.com/v1';

  const SEED_KEYWORDS = [
          "file upload",
          "react file upload",
          "drag and drop file upload",
          "S3 file upload",
          "upload files to S3",
          "file upload widget",
          "file upload API",
          "image upload service",
          "easy file upload",
          "file upload SaaS"
  ];

  async function getKeywordData(keywords) {
    const formData = new URLSearchParams();
    formData.append('country', 'us');
    formData.append('currency', 'usd');
    formData.append('dataSource', 'gkp');
    keywords.forEach(kw => formData.append('kw[]', kw));

    const response = await fetch(`${BASE_URL}/get_keyword_data`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: formData
    });

    return response.json();
  }

  async function getRelatedKeywords(seed) {
    const formData = new URLSearchParams();
    formData.append('country', 'us');
    formData.append('currency', 'usd');
    formData.append('dataSource', 'gkp');
    formData.append('kw', seed);

    const response = await fetch(`${BASE_URL}/get_related_keywords`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: formData
    });

    return response.json();
  }

  async function main() {
    const allKeywords = new Set(SEED_KEYWORDS);

    for (const seed of SEED_KEYWORDS) {
      console.log(`Expanding: ${seed}`);
      const related = await getRelatedKeywords(seed);
      related.data?.forEach(kw => allKeywords.add(kw.keyword));
      await new Promise(r => setTimeout(r, 500));
    }

    const fullData = await getKeywordData([...allKeywords].slice(0, 100));
    console.log('API response:', JSON.stringify(fullData, null, 2));
    const sorted = fullData.data.sort((a, b) => b.vol - a.vol);

    console.log('\nTOP KEYWORDS BY VOLUME:\n');
    sorted.slice(0, 30).forEach(kw => {
      console.log(`${kw.keyword.padEnd(40)} | Vol: ${String(kw.vol).padStart(6)} | CPC: ${kw.cpc?.value || '—'}`);
    });
  }

  main();
