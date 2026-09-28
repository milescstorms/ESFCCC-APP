/*
 * ESFCCC Member App — content
 * ---------------------------------------------------------------
 * This is the ONLY file you need to edit to update the app.
 * Change the text between the quotes, save, and push to GitHub.
 * Tips:
 *   - Keep the commas at the end of each line/item.
 *   - Dates use the format "2026-10-15" (year-month-day).
 *   - Leave a link as "" if there isn't one yet; the button will hide.
 */

window.ESFCCC_CONTENT = {

  council: {
    name: "Child Care Council of Orange County",
    phone: "(845) 294-4012",
    phoneLink: "tel:+18452944012",
    address: "40 Matthews Street, Goshen, NY",
    mapLink: "https://maps.google.com/?q=40+Matthews+Street+Goshen+NY",
    applyLink: "https://wkf.ms/44SXMu2",
  },

  coach: {
    name: "Miles",
    title: "ESFCCC Business Coach",
    // Add a work email or booking link here to turn on the "Email" / "Book" buttons.
    email: "",
    bookingLink: "",
  },

  // Steps a new member works through. Members tick these off on their own phone.
  gettingStarted: [
    { id: "mou",      title: "Sign your MOU",                        detail: "Your Memorandum of Understanding is signed first, before any software is set up. Each licensed site signs its own." },
    { id: "demo",     title: "Watch the Brightwheel and Playground demos", detail: "You'll use one system for the whole year and can't switch mid-year, so compare both before you choose." },
    { id: "ccms",     title: "Finish setting up your software",      detail: "Once you're approved, Brightwheel or Playground will contact you to get your account set up." },
    { id: "coach",    title: "Meet with your business coach",        detail: "Your first one-on-one is where we talk about your goals and make a plan for your program." },
    { id: "csea",     title: "Activate CSEA VOICE",                  detail: "Free vision, dental and telehealth for owner/operators. Ask your coach for the CSEA sign-up flyer." },
    { id: "optima",   title: "Set up your $25/month Optima stipend", detail: "For you and each of your staff members, to use toward wellness benefits." },
    { id: "staff",    title: "Enroll your staff in telehealth",      detail: "Tell your coach who your employees are. Allyhealth will reach out to help them sign up." },
  ],

  benefits: [
    {
      icon: "💻", color: "sky",
      title: "Brightwheel",
      tag: "Child care software",
      who: "Owner/operators who choose Brightwheel",
      what: "A free Premium subscription: check-in/out, parent messaging, daily reports, billing and payments.",
      tips: [
        "Your software choice is locked in for the year once it's turned on.",
        "Taking subsidy? Call KindConnect and ask them to link your account to Brightwheel.",
      ],
      link: "https://info.mybrightwheel.com/empire", linkText: "Learn about Brightwheel",
    },
    {
      icon: "🛝", color: "mint",
      title: "Playground",
      tag: "Child care software",
      who: "Owner/operators who choose Playground",
      what: "The base Playground subscription ($50/month value) is covered: attendance, billing, parent communication and more.",
      tips: [
        "The payroll add-on ($40/month + $5 per employee) is NOT covered by ESFCCC.",
        "Your software choice is locked in for the year once it's turned on.",
      ],
      link: "https://www.tryplayground.com/partnerships/newyork", linkText: "Learn about Playground",
    },
    {
      icon: "🦷", color: "coral",
      title: "CSEA VOICE",
      tag: "Vision · Dental · Telehealth",
      who: "Owner/operators",
      what: "Free vision, dental and telehealth coverage.",
      tips: [
        "Ask your coach for the CSEA flyer with sign-up steps.",
        "You can have CSEA VOICE and the Optima stipend at the same time.",
      ],
      link: "", linkText: "",
    },
    {
      icon: "💳", color: "sun",
      title: "Optima Wellness Stipend",
      tag: "$25 per month",
      who: "Owner/operators AND each of their employees",
      what: "$25 every month to spend on wellness benefits. What you buy can cover your family members too.",
      tips: [
        "Family members don't get their own $25, but they can be covered by what you choose.",
        "If CSEA VOICE doesn't fit your needs, you can use this stipend for vision, dental or telehealth instead.",
      ],
      link: "", linkText: "",
    },
    {
      icon: "🩺", color: "lavender",
      title: "Staff Telehealth (Allyhealth)",
      tag: "For your employees",
      who: "Your assistants and employees",
      what: "Telehealth access for the people who work in your program.",
      tips: [
        "Give your coach your staff list. Allyhealth will contact you to enroll them.",
      ],
      link: "", linkText: "",
    },
    {
      icon: "🏦", color: "sky",
      title: "Retirement Planning",
      tag: "Webinars + 1:1 help",
      who: "Providers and their staff",
      what: "Free webinars on saving for retirement, with one-on-one consultations available.",
      tips: ["See the Events tab for upcoming sessions."],
      link: "", linkText: "",
    },
    {
      icon: "🧾", color: "coral",
      title: "Tax Prep Help",
      tag: "Evening sessions",
      who: "Providers",
      what: "Tax preparation sessions hosted by Civitas to help you get ready for tax season.",
      tips: ["See the Events tab for dates."],
      link: "", linkText: "",
    },
    {
      icon: "🍎", color: "mint",
      title: "My Food Program",
      tag: "For CACFP providers",
      who: "Providers on the food program (CACFP)",
      what: "An option for tracking your CACFP meals and claims.",
      tips: ["Ask your coach whether it's a good fit compared to what you use now."],
      link: "", linkText: "",
    },
    {
      icon: "🎯", color: "sun",
      title: "Business Coaching",
      tag: "One-on-one",
      who: "Every member",
      what: "Personal coaching on your rates, budget, enrollment, marketing, policies and goals.",
      tips: ["Head to the Coaching tab to track your goals and reach your coach."],
      link: "", linkText: "",
    },
  ],

  coachingTopics: [
    { icon: "💲", title: "Setting your rates" },
    { icon: "📊", title: "Budget & bookkeeping" },
    { icon: "📣", title: "Marketing & filling spots" },
    { icon: "📝", title: "Parent handbook & policies" },
    { icon: "🧾", title: "Taxes & records" },
    { icon: "💻", title: "Using Brightwheel / Playground" },
  ],

  // Upcoming events. Add a new { ... }, block for each one.
  // Events whose date has passed are hidden automatically.
  // Leave date "" for "date coming soon" items.
  events: [
    {
      title: "Retirement Planning Webinar Series",
      date: "", time: "",
      where: "Online",
      detail: "Learn simple ways to save for retirement as a child care business owner. Staff are welcome too.",
      link: "",
    },
    {
      title: "Tax Prep Session with Civitas",
      date: "", time: "7:00–8:00 pm",
      where: "Online",
      detail: "Get organized for tax season with help from Civitas.",
      link: "",
    },
    {
      title: "Brightwheel & Playground Demos",
      date: "", time: "",
      where: "Online",
      detail: "See both systems in action before you choose. Ask your coach for the next demo.",
      link: "",
    },
  ],

  faq: [
    {
      q: "Does it cost anything to be a member?",
      a: "No. Membership in the Empire State Family Child Care Collaborative is free.",
    },
    {
      q: "Can I switch from Brightwheel to Playground (or the other way) later?",
      a: "Not during the year. Once your software is turned on, that license is paid for and can't be moved. That's why we recommend watching both demos before you choose.",
    },
    {
      q: "Who gets the $25 Optima stipend?",
      a: "You (the owner/operator) and each of your employees get $25 a month. What you buy with it can cover your family members, but family members don't get their own $25.",
    },
    {
      q: "Can I use CSEA VOICE and the Optima stipend?",
      a: "Yes. CSEA VOICE gives owners free vision, dental and telehealth. You also get the $25 Optima stipend for other wellness benefits.",
    },
    {
      q: "How do my assistants get telehealth?",
      a: "Tell your coach who your employees are. Allyhealth will then contact you to help get them enrolled.",
    },
    {
      q: "Is Playground payroll included?",
      a: "No. The basic Playground subscription is covered, but the payroll add-on ($40/month plus $5 per employee) is not.",
    },
    {
      q: "My subsidy billing isn't connecting to Brightwheel. What do I do?",
      a: "Call KindConnect and let them know you want to link your account to Brightwheel. If you're still stuck, reach out to your coach.",
    },
    {
      q: "I own more than one licensed site. How does that work?",
      a: "Each licensed site gets its own software subscription and its own MOU. The owner and the provider at each site both sign.",
    },
    {
      q: "I don't have any children enrolled right now. Can I still take part?",
      a: "Yes. You're still welcome at our webinars and workshops. Talk with your coach about which benefits apply while you're on hold.",
    },
  ],
};
