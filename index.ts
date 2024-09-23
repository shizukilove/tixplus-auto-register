import puppeteer, { Browser, Page, PuppeteerLaunchOptions, KnownDevices } from 'puppeteer-core';
import axios from 'axios'
import { BROWSER_PATH, PWD, TG_BOT_TOKEN, TG_CHAT_ID, TIXPLUS_REGIST_URL } from './constants';
import data from './tixplus.json'

const input = data[0]
const pw = PWD

const options = { delay: 50 }

async function main() {
  const browser = await puppeteer.launch({ executablePath: BROWSER_PATH, headless: false, userDataDir: "../browserData", });
  if (!browser) {
    throw new Error("Browser did not launch");
  }

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  // await page.setUserAgent('Mozilla/5.0 (Android 15; Mobile; rv:68.0) Gecko/68.0 Firefox/130.0')
  // await page.emulate(iphone);

  await registerTixplus(page)

  // await applylawsonticket(page)
}

async function registerTixplus(page: Page) {
  await page.goto(TIXPLUS_REGIST_URL);

  await pageType(page, 'input[name="addr_num"]', input.banji);
  await pageType(page, 'input[name="passwd"]', pw);
  await pageType(page, 'input[name="repasswd"]', pw);
  await pageType(page, 'input[name="nick"]', (Math.random() + 1).toString(36).substring(7));
  await pageType(page, 'input[name="familyname"]', input.surname);
  await pageType(page, 'input[name="firstname"]', input.name);
  await pageType(page, 'input[name="familyname_kana"]', input.surnamekata);
  await pageType(page, 'input[name="firstname_kana"]', input.namekata);
  const year = input.birthday.slice(0, 4)
  const month = input.birthday.slice(4, 6).startsWith('0') ? input.birthday.slice(4, 6).slice(1) : input.birthday.slice(4, 6)
  const day = input.birthday.slice(6, 8).startsWith('0') ? input.birthday.slice(6, 8).slice(1) : input.birthday.slice(6, 8)
  await pageSelect(page, 'select[name="birth_y"]', year);
  await pageSelect(page, 'select[name="birth_m"]', month);
  await pageSelect(page, 'select[name="birth_d"]', day);
  const zip1 = input.post.slice(0, 3)
  const zip2 = input.post.slice(3, 8)
  await pageType(page, 'input[name="zip1"]', zip1);
  await pageType(page, 'input[name="zip2"]', zip2);
  await pageType(page, 'input[name="addr_etc"]', input.building);
  await pageType(page, 'input[name="tel"]', input.phone);
  await pageClick(page, 'input[id="noreadmail"]');

  const tixpluselement = await page.waitForSelector('#container > form > section:nth-child(1) > dl > dd:nth-child(2) > span')
  if (!tixpluselement) {
    throw new Error('tixplusid not found')
  }

  const tixplusid = await tixpluselement.evaluate(el => el.textContent);

  console.log(tixplusid)

  if (!tixplusid) {
    throw new Error('tixplusid not found')
  }

  await axios.post(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
    {
      chat_id: TG_CHAT_ID,
      text: `${input.email}\n${tixplusid}`
    }
  )

  await Promise.all([
    page.waitForNavigation(),
    pageClick(page, 'input[type="submit"]')
  ])

  await Promise.all([
    page.waitForNavigation(),
    pageClick(page, 'input[type="submit"]')
  ])
}

async function applylawsonticket(page: Page) {
  const cookies = await page.cookies('l-tike.com')
  for (const cookie of cookies) {
    await page.deleteCookie(cookie)
  }

  await page.goto('https://sakurazaka46.com/s/s46/ticket/detail/3rd_generation_osaka?cd=3rd_generation_osaka&ima=0000&ima=0000')

  await Promise.all([
    page.waitForNavigation(),
    pageClick(page, 'input[type="submit"]')
  ])

  // console.log('clicked')

  try {
    await pageClick(page, 'input[type="checkbox"]')

    await Promise.all([
      page.waitForNavigation(),
      await pageClick(page, 'input[id="NEXT"]')
    ])
  } catch (error) {

  }

  await sleep(3)
  await pageClick(page, 'input[id="ENTRY_DETAIL_BUTTON_0"]')

  await sleep(3)
  await pageClick(page, '#lotsameppfm > div.ml20.mr20.mb20 > p:nth-child(4) > a')

  await page.waitForSelector('#pfdaysamppfmselect', { visible: true })

  switch (input.day) {
    case "1":
      await pageClick(page, '#pfdaysamppfmselect > div > div.tabSameppfmList > div:nth-child(2)')
      break
    case "2":
      await pageClick(page, '#pfdaysamppfmselect > div > div.tabSameppfmList > div:nth-child(4)')
      break
  }

  await sleep(3)

  await pageClick(page, '#pfday > div > div.PerformanceDayTime > div.detail.pt0 > div.tab01.tsTabCont.selected > ul > li.ticketInfoWrap.cFix > div.selectSeat > div > div > div > div.tab01.tsTabCont.selected > ul > li > div > ul > li:nth-child(1) > div > div > div.seatSelectBtn.btnBoxBaseNew.btnDisplayNone')
  console.log()

  await page.waitForSelector('#hopeDisp', { visible: true })

  await page.waitForSelector('#c_PRT_CNT1', { visible: true })

  await pageSelect(page, '#c_PRT_CNT1', '1')

  await sleep(1)

  await pageClick(page, '#c_ENTRY_HOPE')

  await sleep(3)

  await page.reload()
  await page.reload()
  await page.reload()
  await page.reload()
  await page.reload()

  await pageType(page, '#MAIL_ADDRS', input.email)
  await pageType(page, '#MAIL_ADDRS_CONFIRM', input.email)
  await pageType(page, '#TEL', input.phone)
  await pageType(page, '#TEL_CONFIRM', input.phone)

  await pageClick(page, '#NEXT')
  await page.reload()
  await page.reload()
  await page.reload()
  await page.reload()
  await page.reload()

}

main()

async function sleep(sec: number) {
  return new Promise(resolve => setTimeout(resolve, sec * 1000))
}

async function pageType(page: Page, selector: string, text: string) {
  await page.type(selector, text, options)
}

async function pageClick(page: Page, selector: string) {
  await page.click(selector, options)
}

async function pageSelect(page: Page, selector: string, text: string) {
  await page.select(selector, text)
}