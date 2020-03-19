const express = require('express')
const app = express()
const puppeteer = require('puppeteer')
const cors = require('cors')
// const fs = require('fs')
// const path = require('path')
const splitly = require('splitly')
const ndjson = require('ndjson')
const fetch = require('node-fetch')
const {SaveStreamToDtb} = require('./scrapToDtb/transforms')
const url = 'https://pages.ffgolf.org/resultats/liste-competitions/'
app.use(cors())
app.use('/example', express.static('example'))

const puppeteerOptions = {
  args: ['--no-sandbox']
};

const scrap = async (req,res,next) => {
  let last_x = req.query.last_x
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
    let clickThemAll = await page.$$('footer.container-medium a')
    res.setHeader('Total-Items', clickThemAll.length)
    let serialize = ndjson.serialize()
    serialize.on('data', function(line) {
      res.write(line)
    })

    if (last_x) {
      clickThemAll = clickThemAll.slice(0, parseInt(last_x))
    }
    for (let node of clickThemAll) {
      if (cancelRequest) {
        break
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
    res.send({
      message: 'requete terminée'
    })
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

app.get('/testStream', async (req, res, next) => {
  let count = 0
  const response = await fetch('http://ffg-scrap:3001/scrap/' + '83502d985595aba6d37f5ac0d35c42f0')
  console.log('gooooooooooo');
  let stream = response.body
  stream.on('error', (err) => console.log(err))
  stream
    .pipe(splitly.createStream())
    .on('error', (err) => console.log(err))
    .pipe(new SaveStreamToDtb())
    .on('error', (err) => console.log(err))
    .pipe(res)
})

app.listen(process.env.APP_PORT || 3001, '0.0.0.0', function () {
  console.log(`FFG Scrap listening on port ${process.env.APP_PORT || 3001}!`)
})
