import requests
from bs4 import BeautifulSoup
import re
from playwright.sync_api import sync_playwright

catoid = 58

def general_program_scraper(poid):
    '''
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
    '''
    url = f'https://catalog.unr.edu/preview_program.php?catoid={catoid}&poid={poid}&print'
    response = requests.get(url)

    soup = BeautifulSoup(response.text, 'html.parser')
    h2s = soup.find_all('h2')
    recommended_schedule_tag = None
    for h2_tag in h2s:
        if "Recommended Schedule" in h2_tag.get_text():
            recommended_schedule_tag = h2_tag
            break
    print(recommended_schedule_tag)
    for h3 in recommended_schedule_tag.find_all_next("h3"):
        current_h3 = h3
        print(current_h3.get_text())
        for h4 in current_h3.find_all_next("h4"):
            current_h4 = h4
            print(current_h4.get_text())
            for course_tag in h4.find_all_next("a"):
                print(course_tag.get_text())
    #print(soup.prettify())

general_program_scraper(243351)