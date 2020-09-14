const puppeteer = require("puppeteer");
const fs = require("fs");
const { Parser } = require("json2csv");
const API = "http://www.batdongsan.vn";
(async () => {
  var twirlTimer = (function () {
    var P = ["\\", "|", "/", "-"];
    var x = 0;
    return setInterval(function () {
      process.stdout.write("\r" + P[x++]);
      x &= 3;
    }, 250);
  })();
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  page.setRequestInterception(true);
  page.on("request", (request) => {
    if (["stylesheet", "font", "image"].indexOf(request.resourceType()) != -1) {
      return request.abort();
    }
    return request.continue();
  });
  let allLinks = [];
  for (let i = 1; i <= 50; i++) {
    let links = await parserLinkInPage(i, page);
    allLinks = allLinks.concat(links);
  }
  let data = [];
  for (let i = 0; i < allLinks.length; i++) {
    data.push(await getContent(page, allLinks[i]));
  }
  const fields = Object.keys(data[0]);
  const opts = { fields };
  try {
    const parser = new Parser(opts);
    const csv = parser.parse(data);
    fs.writeFileSync("data.csv", JSON.stringify(csv), "utf-8");
    console.log("crawler completed !!!");
  } catch (err) {
    console.error(err);
  }
})();

const parserLinkInPage = async (pagination, page) => {
  if (page === 1) uri = "/giao-dich/ban-nha-dat-tai-ha-noi.html";
  await page.goto(
    `${API}/giao-dich/ban-nha-dat-tai-ha-noi/pageindex-${pagination}.html`
  );
  if ((await page.$("body > pre")) !== null) {
    await page.goto("http://www.batdongsan.vn/default.aspx?removedos=true");
    await page.goto(
      `${API}/giao-dich/ban-nha-dat-tai-ha-noi/pageindex-${pagination}.html`
    );
  } else {
    await page.goto(
      `${API}/giao-dich/ban-nha-dat-tai-ha-noi/pageindex-${pagination}.html`
    );
  }
  const data = await page.evaluate(() => {
    let wrapperData = [...document.querySelectorAll("#cat_0 > ul > li")];
    const getLink = (html) =>
      html.querySelector("div.wrap > div.content1 > h2 > a").href;
    console.log(wrapperData);
    let links = wrapperData
      .filter((data) => data.classList.length === 1)
      .map((data) => getLink(data));
    return links;
  });
  return data;
};

const getContent = async (page, url) => {
  await page.goto(url);
  if ((await page.$("body > pre")) !== null) {
    await page.goto("http://www.batdongsan.vn/default.aspx?removedos=true");
    await page.goto(url);
  } else await page.goto(url);
  let content = await page.evaluate(() => {
    // Function support
    function removeAccents(str) {
      var AccentsMap = [
        "aàảãáạăằẳẵắặâầẩẫấậ",
        "AÀẢÃÁẠĂẰẲẴẮẶÂẦẨẪẤẬ",
        "dđ",
        "DĐ",
        "eèẻẽéẹêềểễếệ",
        "EÈẺẼÉẸÊỀỂỄẾỆ",
        "iìỉĩíị",
        "IÌỈĨÍỊ",
        "oòỏõóọôồổỗốộơờởỡớợ",
        "OÒỎÕÓỌÔỒỔỖỐỘƠỜỞỠỚỢ",
        "uùủũúụưừửữứự",
        "UÙỦŨÚỤƯỪỬỮỨỰ",
        "yỳỷỹýỵ",
        "YỲỶỸÝỴ",
      ];
      for (var i = 0; i < AccentsMap.length; i++) {
        var re = new RegExp("[" + AccentsMap[i].substr(1) + "]", "g");
        var char = AccentsMap[i][0];
        str = str.replace(re, char);
      }
      str = str.replace(
        /[^0-9a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ\s]/gi,
        ""
      );
      return str;
    }
    function camelize(str) {
      str = removeAccents(str);
      return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
          return index === 0 ? word.toLowerCase() : word.toUpperCase();
        })
        .replace(/\s+/g, "");
    }

    // Crawler data
    let infomation = {};
    let wrapper = [
      ...document.querySelectorAll(
        "#Home1_ctl33_viewdetailproduct > div > div.row > div.PD_Thongso.col-md-5.col-md-push-7 > div > div"
      ),
    ];
    wrapper.forEach((info) => {
      let obj = new Object();

      if (info.classList.contains("details-warp-item")) {
        let name = camelize(info.querySelector("label").innerText.trim());
        let value = info.querySelector("span").innerText.trim();
        obj[name] = value;
        infomation = { ...infomation, ...obj };
      }
    });
    let attrs = {};
    wrapper = document.querySelector(
      "#Home1_ctl33_viewdetailproduct > div > div.row > div.PD_Thongso.col-md-5.col-md-push-7 > div"
    );
    let wrapperAttr = wrapper.querySelectorAll(
      "div > div.details-warp-item-attribute > ul > li"
    )
      ? [
          ...wrapper.querySelectorAll(
            "div > div.details-warp-item-attribute > ul > li"
          ),
        ]
      : [];
    if (wrapperAttr.length > 0) {
      wrapperAttr.forEach((atrr) => {
        let obj = new Object();

        let name = camelize(
          atrr.querySelector("span.attributename").innerText.trim()
        );
        let value = atrr.querySelector("span.attributevalue").innerText.trim();
        obj[name] = value;
        attrs = { ...attrs, ...obj };
      });
    }

    let img1 = document.querySelector(
      "#Home1_ctl24_viewdetailproduct > div > div > div > div.warp_images > div > div > div > a"
    );
    let img2 = document.querySelector(
      "#Home1_ctl24_viewdetailproduct > div > div > div > div.warp_images > div > div > div.owl-stage-outer > div > div.owl-item.active.center > div > a"
    );
    let imgSrc = "";
    if (img1) {
      imgSrc = img1.href;
    } else if (img2) {
      imgSrc = img2.href;
    }

    let tenNguoiBan = document.querySelector(
      "#Home1_ctl41_viewdetailproduct > div > ul > li > div > div:nth-child(1) > div.content > div.name > a"
    )
      ? document.querySelector(
          "#Home1_ctl41_viewdetailproduct > div > ul > li > div > div:nth-child(1) > div.content > div.name > a"
        ).innerText
      : "";
    let emailNguoiBan = document.querySelector(
      "#Home1_ctl41_viewdetailproduct > div > ul > li > div > div:nth-child(1) > div.content > div.email > a"
    )
      ? document.querySelector(
          "#Home1_ctl41_viewdetailproduct > div > ul > li > div > div:nth-child(1) > div.content > div.email > a"
        ).innerText
      : "";
    let diaChiNguoiBan = document.querySelector(
      "#Home1_ctl41_viewdetailproduct > div > ul > li > div > div:nth-child(1) > div.content > div.Addrees"
    )
      ? document.querySelector(
          "#Home1_ctl41_viewdetailproduct > div > ul > li > div > div:nth-child(1) > div.content > div.Addrees"
        ).innerText
      : "";
    let moTa = document.querySelector(
      "#Home1_ctl33_viewdetailproduct > div > div.row > div.PD_Gioithieu.col-md-7.col-md-pull-5"
    )
      ? document.querySelector(
          "#Home1_ctl33_viewdetailproduct > div > div.row > div.PD_Gioithieu.col-md-7.col-md-pull-5"
        ).innerText
      : "";
    return {
      ...infomation,
      ...attrs,
      imgSrc,
      tenNguoiBan,
      emailNguoiBan,
      diaChiNguoiBan,
    };
  });
  return content;
};
