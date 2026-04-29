import requests
from bs4 import BeautifulSoup
import re
import json

catoid = 58

def general_recommendation_scraper(poid):
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

def full_program_scraper():
    # Web scraping the initial catalog page with all UNR departments listed
    url = f'https://catalog.unr.edu/content.php?catoid=58&navoid=120314&print'
    response = requests.get(url)

    soup = BeautifulSoup(response.text, 'html.parser')
    undergraduate_programs_map = {}
    undergraduate_list_header = soup.find('h2')
    # For some reason, there is a blank tag between the header and list, so I have to grab the next next sibling
    # to retreive the list of undergraduate department programs (Agriculture, Engineering, Science, etc.)
    undergraduate_list = undergraduate_list_header.next_sibling.next_sibling

    # Loop for individual departments/colleges at UNR
    for department in undergraduate_list.find_all('li'):
        name = department.text
        name = name.replace('\xa0', '')
        name = name.strip() #cleaning the name so there are no excess spaces/special characters
        undergraduate_programs_map[name] = {
            'name' : name
        }
        department_link = 'https://catalog.unr.edu/' + department.find('a')['href']
        department_response = requests.get(department_link)
        # Web scraping individual departments at UNR
        department_soup = BeautifulSoup(department_response.text, 'html.parser')
        main_table = ''

        # Loop for locating correct section of the web page (table with degree programs)
        for table_element in department_soup.find_all('td', class_='th_lt acalog-highlight-ignore nowrap'):
            if 'Programs - Locations/Keyword/Phrase Matches' == table_element.text:
                main_table = table_element.parent.parent #grabbing the parent twice to get main table
                break
        
        # Loop for individual programs/majors within a department/college at UNR
        for program_major in main_table.find_all('a'):
            major_link = 'https://catalog.unr.edu/' + program_major['href'] + '&print' #&print makes web page easier to scrape
            major_title = program_major.text.strip()
            if len(major_title) == 1:
                break
            poid = re.findall('poid=[0-9]+', major_link)[0]
            poid = poid.replace('poid=', '')
            undergraduate_programs_map[name][major_title] = {
                'major_title': major_title,
                'major_poid': poid
            }
            major_response = requests.get(major_link)
            major_soup = BeautifulSoup(major_response.text, 'html.parser')
            description = major_soup.find('div', class_='program_description').text
            undergraduate_programs_map[name][major_title]['description'] = description

        # This extra section is for if a department needs multiple web pages to display all major degree programs.
        # The code here is the same as the code block above to locate and find individual programs/majors again.
        navigation_bar = main_table.find('nav')
        for navigation_page in navigation_bar.find_all('a'):
            navigation_page_url = 'https://catalog.unr.edu/' + navigation_page['href']
            navigation_response = requests.get(navigation_page_url)
            navigation_soup = BeautifulSoup(navigation_response.text, 'html.parser')
            navigation_table = ''

            for table_element in navigation_soup.find_all('td', class_='th_lt acalog-highlight-ignore nowrap'):
                if 'Programs - Locations/Keyword/Phrase Matches' == table_element.text:
                    navigation_table = table_element.parent.parent #grabbing the parent twice to get main table
                    break
                    
            for program_major in navigation_table.find_all('a'):
                major_link = 'https://catalog.unr.edu/' + program_major['href'] + '&print' #&print makes web page easier to scrape
                major_title = program_major.text.strip()
                if len(major_title) == 1:
                    break
                poid = re.findall('poid=[0-9]+', major_link)[0]
                poid = poid.replace('poid=', '')
                undergraduate_programs_map[name][major_title] = {
                    'major_title': major_title,
                    'major_poid': poid
                }
                major_response = requests.get(major_link)
                major_soup = BeautifulSoup(major_response.text, 'html.parser')
                description = major_soup.find('div', class_='program_description').text
                undergraduate_programs_map[name][major_title]['description'] = description        
            
        #print(main_table)
        break
    
    with open('data.json', 'w') as f:
        json.dump(undergraduate_programs_map, f, indent=4)
    #print(json.dumps(undergraduate_programs_map, indent=4))
    

full_program_scraper()