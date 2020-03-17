const express = require('express')
const app = express()
const puppeteer = require('puppeteer')
const cors = require('cors')
// const fs = require('fs')
// const path = require('path')
const ndjson = require('ndjson')
const url = 'https://pages.ffgolf.org/resultats/liste-competitions/'
app.use(cors())
app.use('/example', express.static('example'))

const puppeteerOptions = {
  args: ['--no-sandbox']
};

const scrap = async (req,res,next) => {
  let cancelRequest = false

  req.on('close', function (err){
     cancelRequest = true
     console.log('closed');
  })

  try {
    const browser = await puppeteer.launch(puppeteerOptions);
    const page = await browser.newPage();
    await page.goto(url + req.params.pageid);
    let trnIDS = []
    let trnID, trnInput, value
    await page.waitFor('select[name="resultats_length"]')
    // first we select 100 results by page
    await page.select('select[name="resultats_length"]', '100')
    // then we select 100 results by page
    const lastPageButton = await page.$("#resultats_paginate span a:last-child");
    const length = await page.evaluate(element => element.textContent, lastPageButton)
    for (var i = 1; i <= 5; i++) {
      await page.click('a.paginate_button[data-dt-idx="'+i+'"]')
      await page.select('select[name="resultats_length"]', '100')
      await page.evaluate(() => {
          var elementsOdd = document.querySelectorAll('#resultats tr.odd .bold.text-left a');
          var elementsEven = document.querySelectorAll('#resultats tr.even .bold.text-left a');
          let elements = [...elementsOdd, ...elementsEven]
          var foot = document.querySelector('footer.container-medium')
          for(var i=0; i< elements.length; i++){
            foot.appendChild(elements[i])
          }
      })
    }
    const clickThemAll = await page.$$('footer.container-medium a')
    res.setHeader('Total-Items', clickThemAll.length)
    let serialize = ndjson.serialize()
    serialize.on('data', function(line) {
      res.write(line)
    })
    for (let node of clickThemAll) {
      if (cancelRequest) {
        console.log('Request cancelled');
        return
      }
      trnID = await page.evaluate(el => el.getAttribute("trn-id"), node)
      if (!trnIDS.includes(trnID)) {
        trnIDS.push(trnID)
        await node.click()
        await page.waitForFunction(() => {
          let spin = document.getElementById('spinner')
          return spin.style.display == 'none'
        })
        await page.waitFor(300)
        const el = await page.$('#joueursSerie')
        trnInput = await page.$('#trnId')
        value = await (await el.getProperty('value')).jsonValue()
        value = JSON.parse(value)
        if (value && value !== 'null') {
          let scores = Object.keys(value).reduce((acc, key, i) => {
            return [...acc, ...value[key]]
          }, [])
          serialize.write(scores)
          // To FILE
          // fs.writeFileSync(path.join(__dirname, '/../static/datas/' + trnID + '.json'), JSON.stringify(value));
        }
      }
    }
    serialize.end()
    res.end()
    browser.close()
    next()
  } catch (e) {
    console.log(e);
  }
}

app.get('/scrap/:pageid', async (req, res, next) => {
  res.setHeader('Access-Control-Expose-Headers', 'Total-Items, Transfer-Encoding, Connection');
  res.setHeader('Connection', 'Transfer-Encoding');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  scrap(req, res, next)
})

app.listen(process.env.APP_PORT || 3001, '0.0.0.0', function () {
  console.log(`FFG Scrap listening on port ${process.env.APP_PORT || 3001}!`)
})
