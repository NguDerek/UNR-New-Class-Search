import pandas as pd

# extract the data from our excel sheet
##############################################################################
df = pd.read_excel("Fall_2025_excel.xlsx", header=1, nrows=4, index_col=None)
##############################################################################

# bein tranforming the data
# 1.) rename columns
column_mapping = {
    "College": "college",
    "Acad Org": "dept_code",
    "Subject": "subject",
    "Catalog": "catalog",
    "Section": "section_number",
    "Title": "title",
    "Component": "component",
    "Session": "session_code",
    "Class Nbr": "class_nbr",
    "Instruction Mode": "instruction_mode",
    "Class Days": "class_days",
    "Class Start Time": "start_time",
    "Class End Time": "end_time",
    "Start Date": "start_date",
    "End Date": "end_date",
    "Room": "room_code",
    "Instructor First Name": "first_name",
    "Instructor Last Name": "last_name",
    "Room Capacity": "room_capacity",
    "Enrollment Capacity": "enrollment_capacity",
    "Current Enrollment": "current_enrollment",
    "Waitlist Capacity": "waitlist_capacity",
    "Waitlist Total": "waitlist_total",
    "Combined?": "combined",
    "Class Stat": "class_status",
    "Prgrss Unt": "units",
    "Acad Group": "acad_group"
}
df.rename(columns=column_mapping, inplace=True)

# 2.) drop irrelevant columns
df = df.drop(columns=["class_nbr", "room_capacity", "current_enrollment", "waitlist_capacity", "acad_group"])

# 3.)   convert time from hh.mm to hh:mm 
#       convert combined to bool
#       convert units to int 
##############################################################################

# eventually load the data into database server

##############################################################################


print(df.columns)