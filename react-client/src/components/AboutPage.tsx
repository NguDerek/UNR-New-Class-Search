export function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 lg:py-12">
      {/* Page Title Section */}
      <div className="mb-8 lg:mb-12">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-[#003366]">About Our Project</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Mission Section */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-[#003366] mb-3">New Class Search</h2>
          <p className="text-slate-600 leading-relaxed">
            CS 426 Senior Project in Computer Science | Team 25 <br></br>
            Spring 2026 | University of Nevada, Reno <br></br>
            Department of Computer Science and Engineering
          </p>
        </div>

        {/* Team information */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-[#003366] mb-3">Our Team</h2>
          <p className="text-slate-600 leading-relaxed">
            This project was developed by Gisselle Cruz-Robinson, John Michael Libed, Derek Ngu, and Dominic Valdez. <br></br> 
            <b>Our instructors</b> are David Feil-Seifer and Vinh Le. <br></br> <b>Our advisor</b> is Jordan Hastings, a 
            Research Associate at the University Center for Economic Development at UNR. 
          </p>
        </div>

        {/* Project Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-[#003366] mb-3">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed">
                The New Class Search aims to be an application that redesigns the University of Nevada, Reno’s 
                class search system with a modern and responsive web application. The current system is complex 
                to navigate, text-heavy, and challenging to use for many students. This project aims to develop 
                a better system for searching for courses, a digital planner, and resources to learn about UNR 
                degree programs. Students can find course information (such as the building, time, enrollment 
                capacity, etc) in an easier and cleaner manner.
            </p>
            <br></br>
            <p className="text-slate-600 leading-relaxed">
                This project is made for the whole student body of UNR, as well as staff such as advisors and 
                professors. Students will be do everything that is already on MyNevada, with access to some additional 
                features (course recommendations, exporting course schedules to your external calendars, etc.). Not 
                only will this project help with searching for courses, it will also provide a way for professors 
                to upload course syllabi, and also a way for advisors to upload flowcharts for students to track 
                their progress of their degree better.
            </p>
            <br></br>
            <p className="text-slate-600 leading-relaxed">
                Overall, our main goal is to revolutionize the way UNR students can research what courses to 
                take next. We hope to make this experience easier and more enjoyable without needing to go 
                through the burden of using an outdated and unintuitive application. With the New Class Search, 
                looking for courses will be cleaner and better than ever.
            </p>
        </div>

        {/* Resources and References */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-[#003366] mb-3">Resources and References</h2>
          <h3 className="text-[#003366] mb-3">Problem Domain Book</h3>
            <p className="text-slate-600 leading-relaxed">
                <b>Interaction design: Beyond human-computer interaction, 3rd Edition</b><br></br>
                This book teaches essential skills for designing interactive products across multiple disciplines from web design and to mobile devices.  The textbook covers HCI principles and shows how to apply them in real-word design and explores how technology enhances communication and work, while addressing technical, social, and ethical considerations. The book includes current examples of Web 2.0, and mobile devices, which fundamentally changed how people interact with digital systems.<br></br><br></br>
                H. Sharp, Y. Rogers, and J. Preece, “Interaction design: Beyond human-computer interaction, 3rd Edition,” O’Reilly Online Learning, https://www.oreilly.com/library/view/interaction-design-beyond/9780470665763/ 
            </p><br></br>
            
            <h3 className="text-[#003366] mb-3">Useful Websites</h3>
            <ul className="text-slate-600 leading-relaxed">
                <li className="text-blue-700"><a href="https://www.postgresql.org/docs/" target="_blank" rel="noopener noreferrer"><u>Documentation - PostgreSQL</u></a></li>
                <li className="text-blue-700"><a href="https://flask.palletsprojects.com/en/stable/" target="_blank" rel="noopener noreferrer"><u>Welcome to Flask - Flask Documentation</u></a></li>
                <li className="text-blue-700"><a href="https://react.dev/learn" target="_blank" rel="noopener noreferrer"><u>Quick Start - React</u></a></li>
            </ul><br></br>
            
            <h3 className="text-[#003366] mb-3">Academic Article</h3>
            <p className="text-slate-600 leading-relaxed">
                <b>Web Design Dilemma: A Comprehensive Guide to Adaptive and Responsive Design</b><br></br>
                This article examines the critical choice between Adaptive Web Design (AWD) and Responsive Web Design (RWD) methodologies in modern web development. The study analyzes how web design approaches must evolve to keep pace with rapidly changing device ecosystems and screen resolutions. The articles provide a comparative analysis of both design methodologies, exploring their individual strengths and weaknesses through development complexity, user experience, and device adaptability considerations.<br></br><br></br>
                R. M. A. Muzaki, O. C. Briliyant, M. A. Hasditama, and H. Ritchi, Improving Security of Web-Based Application Using ModSecurity and Reverse Proxy in Web Application Firewall, https://ieeexplore-ieee-org.unr.idm.oclc.org/stamp/stamp.jsp?tp=&arnumber=9255601 
            </p>	
        </div>
      </div>
    </div>
  );
}
