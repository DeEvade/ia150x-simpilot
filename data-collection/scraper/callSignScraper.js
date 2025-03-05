const cheerio = require('cheerio');

const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const run = async () => {
  for (let i = 0; i < letters.length; i++) {
    await (async () => {
      const url = 'https://123atc.com/call-signs/' + letters[i];
      const response = await fetch(url);

      const $ = cheerio.load(await response.text());
      const $rows = $('table tbody tr');
      const $threeLetters = $rows.find('td a');
      const $phonetic = $rows.find('td:eq(2)');

      //   console.log($.html());
      //   console.log($rows.text());
      $('table tbody tr').each((index, row) => {
        let $letters = $(row).find('td').first().find('a');
        let $phonetic = $(row).find('td').eq(1);
        if ($phonetic.text() === '(None)') return;

        console.log($letters.text() + ' : ' + $phonetic.text());
      });

      //   console.log($threeLetters.html());
      //   console.log($phonetic.text());
    })();
  }
};

run();
