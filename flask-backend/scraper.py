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
    sections = soup.find_all('div', class_='acalog-core')
    recommended_schedule_section = None
    for section in sections:
        if 'Recommended Schedule' in section.get_text():
            recommended_schedule_section = section
            break
    # Sibling needs to be retrieved due to how the course catalog website is structured (as 
    # schedule itself is a sibling to the "Recommended Schedule" h2 tag rather than a child")
    full_schedule = recommended_schedule_section.next_sibling
    recommendation_map = {}
    years = full_schedule.find_all('div', class_='custom_leftpad_20')
    for year in full_schedule.find_all('div', class_='custom_leftpad_20'):
        # print(year.prettify())
        # print('')
        for semester in year.find_all('ul'):
            for course in semester.find_all('li'):
                print(re.findall('[A-Z]+ [0-9]{3}[A-Z]?', course.get_text()))
            print('')
                #print(course.get_text())
    # print(recommended_schedule_tag)
    # print(recommended_schedule_tag.next_element)
    # for h3 in recommended_schedule_tag.find_all_next("h3"):
    #     current_h3 = h3
    #     print(current_h3.get_text())
    #     for h4 in current_h3.find_all_next("h4"):
    #         current_h4 = h4
    #         print(current_h4.get_text())
            #for course_tag in h4.find_all_next("a"):
                #print(course_tag.get_text())
    #print(full_schedule.prettify())

general_program_scraper(243351)