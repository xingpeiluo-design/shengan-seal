#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
盛安密封 · 线上冒烟测试套件（browser-use 驱动，真实无头浏览器）

用法（需先在受管环境安装 browser-use CLI）：
    SHENGAN_ADMIN_PASS=<后台密码> \
    BASE_URL=https://maichewei.com/shengan \
    browser-use < tests/smoke/browser_smoke.py

设计原则：
  - 不硬编码任何凭据：管理员密码从环境变量 SHENGAN_ADMIN_PASS 读取；
    缺失时，需要鉴权的用例（TC-09/TC-10 保留 / TC-13）自动跳过并标记 SKIP，绝不写死口令。
  - 不改动生产真实数据：TC-13 用 is_test 产品做创建→校验→删除的受控闭环，跑完即清理。
  - 断言以“浏览器内同步 XHR + DOM 查询”为证据，输出 results.json 供报告生成。

本文件由 WorkBuddy browser-use 自动化测试沉淀而来，可作为上线后回归冒烟。
"""
import json, os, time

BASE = os.environ.get("BASE_URL", "https://maichewei.com/shengan").rstrip("/")
API = BASE + "/api"
ADMIN_USER = os.environ.get("SHENGAN_ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("SHENGAN_ADMIN_PASS")  # 无默认值：不硬编码口令
OUT_DIR = os.environ.get("SMOKE_OUT_DIR", "/tmp/shengan_report")

results = []


def api_call(method, path, data=None, token=None):
    """浏览器内同域同步 XHR，返回 {status, body, json}"""
    data_json = json.dumps(data) if data is not None else None
    js_code = """
    (function(){
      var x = new XMLHttpRequest();
      x.open("%s", "%s", false);
      if (%s) x.setRequestHeader('Content-Type','application/json');
      if (%s) x.setRequestHeader('Authorization','Bearer '+%s);
      x.send(%s);
      return JSON.stringify({status: x.status, body: x.responseText});
    })()
    """ % (
        method, path,
        "true" if data_json else "false",
        "true" if token else "false",
        repr(token) if token else "null",
        repr(data_json) if data_json else "null",
    )
    out = js(js_code)
    try:
        d = json.loads(out)
    except Exception:
        return {"status": -1, "body": out, "json": None}
    try:
        d["json"] = json.loads(d["body"])
    except Exception:
        d["json"] = None
    return d


def dom(query):
    return js("return document.querySelectorAll(%s).length" % json.dumps(query))


def run(tid, name, fn):
    try:
        passed, detail = fn()
    except Exception as e:
        passed, detail = False, "EXCEPTION: %s" % e
    status = "PASS" if passed is True else ("SKIP" if passed is None else "FAIL")
    results.append({"id": tid, "name": name, "status": status, "detail": detail})
    print("[%s] %s -> %s | %s" % (status, tid, name, str(detail)[:160]))


def login_token():
    """返回 token；无密码时返回 None（用于跳过鉴权用例）"""
    if not ADMIN_PASS:
        return None
    r = api_call("POST", API + "/auth/login", {"user": ADMIN_USER, "pass": ADMIN_PASS})
    return (r.get("json") or {}).get("token")


# ---------- 打开首页 ----------
new_tab(BASE + "/")
wait_for_load()
title = js("return document.title")
body_len = js("return document.body ? document.body.innerText.length : 0")


def tc01():
    ok = ("盛安密封" in (title or "")) and (body_len > 200)
    return ok, "title=%r bodyTextLen=%s" % (title, body_len)
run("TC-01", "首页可访问 & React 已挂载", tc01)


def tc02():
    urls = js("""return Array.from(document.querySelectorAll('script[src],link[rel=stylesheet][href]'))
        .map(e=>e.src||e.href).filter(Boolean);""")
    bad = []
    for u in urls:
        r = api_call("GET", u)
        if r["status"] != 200:
            bad.append("%s=%s" % (u, r["status"]))
    return (len(bad) == 0), "assets=%d bad=%s" % (len(urls), bad)
run("TC-02", "前端 JS/CSS 资源加载无 404", tc02)


def tc03():
    r = api_call("GET", API + "/products")
    n = len(r.get("json") or [])
    nodes = dom("a[href*='/product'], [class*='product' i], [class*='Product']")
    return (n > 0 and nodes > 0), "apiProducts=%s domProductNodes=%s" % (n, nodes)
run("TC-03", "产品列表从 /api/products 渲染", tc03)


def tc04():
    r = api_call("GET", API + "/products")
    items = r.get("json") or []
    leaked = [it.get("name") for it in items if it.get("is_test") is True]
    return (len(leaked) == 0), "total=%d leakedTest=%s" % (len(items), leaked)
run("TC-04", "公开接口不泄露 is_test 测试产品", tc04)


def tc05():
    r = api_call("GET", API + "/settings")
    hotline = (r.get("json") or {}).get("hotline", "")
    page_text = js("return document.body ? document.body.innerText : ''")
    return ((hotline != "") and (hotline in (page_text or ""))), \
        "hotline=%s inPage=%s" % (hotline, hotline in (page_text or ""))
run("TC-05", "后台热线设置动态同步到前台", tc05)


def tc06():
    r = api_call("GET", API + "/settings")
    hotline = (r.get("json") or {}).get("hotline", "")
    tel_href = js("var a=document.querySelector(\"a[href^='tel:']\"); return a?a.getAttribute('href'):null")
    return (tel_href == ("tel:" + hotline)), "telHref=%r expect=%r" % (tel_href, "tel:" + hotline)
run("TC-06", "tel: 链接号码 = 后台设置值", tc06)


def tc07():
    r = api_call("GET", API + "/news")
    n = len(r.get("json") or [])
    news_nodes = dom("[class*='news' i], [class*='News']")
    return (n > 0 and news_nodes > 0), "apiNews=%s domNewsNodes=%s" % (n, news_nodes)
run("TC-07", "新闻板块从 /api/news 渲染", tc07)


def tc08():
    desc = js("var m=document.querySelector(\"meta[name='description']\"); return m?m.getAttribute('content'):null")
    has_ld = dom("script[type='application/ld+json']") > 0
    return (bool(desc) and len(desc or "") > 5 and has_ld), \
        "descLen=%s jsonLd=%s" % (len(desc or ""), has_ld)
run("TC-08", "SEO：meta description & JSON-LD 存在", tc08)


def tc09():
    if not ADMIN_PASS:
        return None, "SKIP：未提供 SHENGAN_ADMIN_PASS"
    r = api_call("POST", API + "/auth/login", {"user": ADMIN_USER, "pass": ADMIN_PASS})
    tok = (r.get("json") or {}).get("token")
    return (r["status"] == 200 and bool(tok)), "status=%s hasToken=%s" % (r["status"], bool(tok))
run("TC-09", "后台管理员登录返回 token", tc09)


def tc10():
    r = api_call("GET", API + "/admin/products")
    return (r["status"] in (401, 403)), "status=%s" % r["status"]
run("TC-10", "未授权访问 /api/admin 被拒(401/403)", tc10)


def tc11():
    vp = js("var m=document.querySelector('meta[name=viewport]'); return m?m.getAttribute('content'):null")
    return bool(vp), "viewport=%r" % vp
run("TC-11", "移动端 viewport meta 存在", tc11)


def tc12():
    r = api_call("GET", API + "/settings")
    pdd = (r.get("json") or {}).get("pdd_link", "")
    page_html = js("return document.body ? document.body.innerHTML : ''")
    return ((pdd != "") and (pdd in (page_html or ""))), "pdd_link=%r" % pdd
run("TC-12", "拼多多外链在前台渲染", tc12)


def tc13():
    token = login_token()
    if not token:
        return None, "SKIP：未提供 SHENGAN_ADMIN_PASS，跳过 CRUD 闭环"
    name = "__AUTO_TEST_%s" % int(time.time())
    cr = api_call("POST", API + "/admin/products",
                  {"name": name, "category": "自动化测试", "is_test": True}, token)
    created_id = (cr.get("json") or {}).get("id")
    pub = api_call("GET", API + "/products")
    hidden = name not in [it.get("name") for it in (pub.get("json") or [])]
    cleaned = False
    if created_id:
        dr = api_call("DELETE", API + "/admin/products/%s" % created_id, None, token)
        cleaned = dr["status"] in (200, 204)
    pub2 = api_call("GET", API + "/products")
    still_gone = name not in [it.get("name") for it in (pub2.get("json") or [])]
    ok = (cr["status"] in (200, 201)) and hidden and cleaned and still_gone
    return ok, "created=%s hidden=%s deleted=%s stillGone=%s" % (created_id, hidden, cleaned, still_gone)
run("TC-13", "后台创建→公开过滤→删除 数据闭环", tc13)


# ---------- 截图 & 汇总 ----------
os.makedirs(OUT_DIR, exist_ok=True)
try:
    capture_screenshot(os.path.join(OUT_DIR, "home.png"))
    shot = "saved"
except Exception as e:
    shot = "skip:%s" % e
print("SCREENSHOT:", shot)

passed = sum(1 for r in results if r["status"] == "PASS")
failed = sum(1 for r in results if r["status"] == "FAIL")
skipped = sum(1 for r in results if r["status"] == "SKIP")
with open(os.path.join(OUT_DIR, "results.json"), "w") as f:
    json.dump({"target": BASE, "title": title, "total": len(results),
               "passed": passed, "failed": failed, "skipped": skipped,
               "results": results}, f, ensure_ascii=False, indent=2)
print("SUMMARY:", json.dumps({"total": len(results), "passed": passed,
                              "failed": failed, "skipped": skipped}, ensure_ascii=False))
