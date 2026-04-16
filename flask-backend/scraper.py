import requests
from bs4 import BeautifulSoup
import re
from playwright.sync_api import sync_playwright

catoid = 58

def general_program_scraper(poid):
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        page.goto(f'https://catalog.unr.edu/preview_program.php?catoid={catoid}&poid={poid}&print')

        # Click all expandable elements
        buttons = page.query_selector_all('[aria-expanded="false"]')

        for b in buttons:
            try:
                b.click()
            except:
                pass

        html = page.content()

    #url = f'https://catalog.unr.edu/preview_program.php?catoid={catoid}&poid={poid}&print'
    #response = requests.get(url)

    soup = BeautifulSoup(html, 'html.parser')
    body = soup.get_text(" ", strip=True)
    print(soup.prettify())




general_program_scraper(243351)