import requests
from bs4 import BeautifulSoup
import re

catoid = 58

def general_program_scraper(poid):
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
    recommendation_map = {}  # Storing recommendations as a dictionary
    years = full_schedule.find_all('div', class_='custom_leftpad_20')
    for year_tag in full_schedule.find_all('div', class_='custom_leftpad_20'):
        for semester_tag in year_tag.find_all('ul'):
            course_list = []
            for course_tag in semester_tag.find_all('li'):
                temp_course = re.findall('[A-Z]+ [0-9]{3}[A-Z]?', course_tag.get_text())
                if temp_course:
                    course_list.append(temp_course[0]) #formatting individual courses into a list
            for course in course_list:
                temp_course_list = course_list.copy()
                temp_course_list.remove(course)
                #Recommended courses are courses that are often taken in the same semester for a major
                if temp_course_list:
                    recommendation_map[course] = temp_course_list 
    #print(recommendation_map)
    return recommendation_map

#general_program_scraper(243351)
#general_program_scraper(243442)