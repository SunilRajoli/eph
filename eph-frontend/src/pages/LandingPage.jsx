import React, { useState } from "react";
import { Link } from "react-scroll";
import { Link as RouterLink } from "react-router-dom";

import {
  Rocket,
  GraduationCap,
  Briefcase,
  Compass,
  School,
  TrendingUp,
  Lightbulb,
  Users,
  Target,
  Award,
  Mail,
  Linkedin,
  Instagram,
  Twitter,
  Youtube,
  Menu,
  X,
  CheckCircle,
  Sun,
  Moon,
} from "lucide-react";
import logo from "../assets/logo.jpg";

// Modern Card Component for reusability (Unchanged)
const InfoCard = ({ icon, title, children, isDark }) => (
  <div
    className={`p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 ${
      isDark ? "bg-slate-800" : "bg-white"
    }`}
  >
    <div className="flex items-center gap-4 mb-3">
      {icon}
      <h3
        className={`text-xl font-bold ${
          isDark ? "text-slate-100" : "text-slate-800"
        }`}
      >
        {title}
      </h3>
    </div>
    <p className={isDark ? "text-slate-300" : "text-slate-600"}>{children}</p>
  </div>
);

export default function PPLWebsite() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const navLinks = [
    { href: "#about", label: "About" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#course", label: "Course" },
    { href: "#why-ppl", label: "Why PPL" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${
        isDark ? "bg-slate-900 text-slate-200" : "bg-slate-50 text-slate-700"
      }`}
    >
      {/* Navigation */}
      <nav
        className={`backdrop-blur-lg shadow-sm sticky top-0 z-50 transition-colors duration-300 ${
          isDark ? "bg-slate-800/90" : "bg-white/80"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <img
                src={logo}
                alt="EPH Logo"
                className="h-8 w-8 rounded-full object-cover"
              />
              <span
                className={`ml-3 text-2xl font-bold tracking-tight ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                PPL
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href.substring(1)}
                  smooth={true}
                  duration={1500} // CHANGE: Slower scroll speed
                  offset={-80}
                  className={`transition-colors duration-300 font-medium cursor-pointer ${
                    isDark
                      ? "text-slate-300 hover:text-cyan-400"
                      : "text-slate-600 hover:text-cyan-500"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-lg transition-colors duration-300 ${
                  isDark
                    ? "bg-slate-700 hover:bg-slate-600"
                    : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-amber-400" />
                ) : (
                  <Moon className="h-5 w-5 text-slate-700" />
                )}
              </button>

              <div className="flex items-center gap-2">
                <RouterLink
                  to="/roles"
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-300 ${
                    isDark
                      ? "bg-cyan-500 text-white hover:bg-cyan-600"
                      : "bg-cyan-500 text-white hover:bg-cyan-600"
                  }`}
                >
                  Register
                </RouterLink>
              </div>
            </div>
            <div className="md:hidden flex items-center gap-3">
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-lg transition-colors duration-300 ${
                  isDark
                    ? "bg-slate-700 hover:bg-slate-600"
                    : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-amber-400" />
                ) : (
                  <Moon className="h-5 w-5 text-slate-700" />
                )}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={isDark ? "text-white" : "text-slate-800"}
              >
                {mobileMenuOpen ? (
                  <X className="h-7 w-7" />
                ) : (
                  <Menu className="h-7 w-7" />
                )}
              </button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div
            className={`md:hidden border-t transition-colors duration-300 ${
              isDark
                ? "bg-slate-800 border-slate-700"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="px-4 pt-2 pb-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href.substring(1)}
                  smooth={true}
                  duration={1500} // CHANGE: Slower scroll speed
                  offset={-80}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 rounded-md text-base font-medium transition-colors duration-300 cursor-pointer ${
                    isDark
                      ? "text-slate-300 hover:text-cyan-400"
                      : "text-slate-700 hover:text-cyan-500"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        className={`relative text-center py-24 sm:py-32 px-4 overflow-hidden transition-colors duration-300 ${
          isDark ? "bg-slate-800" : "bg-gradient-to-br from-sky-50 to-blue-50"
        }`}
      >
        <div
          className={`absolute top-0 left-0 w-64 h-64 rounded-full opacity-50 -translate-x-16 -translate-y-16 blur-2xl ${
            isDark ? "bg-cyan-900" : "bg-cyan-200"
          }`}
        ></div>
        <div
          className={`absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-50 translate-x-16 translate-y-16 blur-2xl ${
            isDark ? "bg-purple-900" : "bg-purple-200"
          }`}
        ></div>
        <div className="max-w-4xl mx-auto relative z-10">
          <h1
            className={`text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tighter ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Where Student Projects Meet Real Investors
          </h1>
          <p
            className={`text-lg md:text-xl mb-10 max-w-3xl mx-auto ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            Transform your college projects into successful startups. Compete,
            learn, and pitch to real investors through PPL – the ultimate
            startup league for students.
          </p>
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <RouterLink
              to="/competitions"
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md flex items-center gap-2 ${
                isDark
                  ? "bg-cyan-500 text-white hover:bg-cyan-600"
                  : "bg-sky-500 text-white hover:bg-sky-600"
              }`}
            >
              <Compass className="h-5 w-5" />
              Explore Competitions
            </RouterLink>
            <RouterLink
              to="/roles"
              className={`px-8 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md flex items-center gap-2 border ${
                isDark
                  ? "bg-slate-700 text-white hover:bg-slate-600 border-slate-600"
                  : "bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
              }`}
            >
              <Rocket className="h-5 w-5" />
              Get Started
            </RouterLink>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        id="about"
        className={`py-20 sm:py-24 px-4 transition-colors duration-300 ${
          isDark ? "bg-slate-900" : "bg-white"
        }`}
      >
        <div className="max-w-5xl mx-auto text-center">
          <h2
            className={`text-3xl sm:text-4xl font-bold mb-4 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            About PPL
          </h2>
          <p
            className={`text-lg mb-12 max-w-3xl mx-auto ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            The{" "}
            <span
              className={`font-bold ${
                isDark ? "text-cyan-400" : "text-sky-600"
              }`}
            >
              Premier Project League (PPL)
            </span>{" "}
            is India's first platform connecting students, colleges, and
            investors to turn academic projects into startup opportunities.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div
              className={`p-8 rounded-xl shadow-sm text-center transition-colors duration-300 ${
                isDark ? "bg-slate-800" : "bg-sky-50"
              }`}
            >
              <GraduationCap
                className={`h-12 w-12 mx-auto mb-4 ${
                  isDark ? "text-cyan-400" : "text-sky-500"
                }`}
              />
              <h3
                className={`font-semibold text-lg mb-2 ${
                  isDark ? "text-white" : "text-slate-800"
                }`}
              >
                Entrepreneurial Knowledge
              </h3>
              <p className={isDark ? "text-slate-300" : "text-slate-600"}>
                Learn through our comprehensive Startup Course.
              </p>
            </div>
            <div
              className={`p-8 rounded-xl shadow-sm text-center transition-colors duration-300 ${
                isDark ? "bg-slate-800" : "bg-sky-50"
              }`}
            >
              <Target
                className={`h-12 w-12 mx-auto mb-4 ${
                  isDark ? "text-cyan-400" : "text-sky-500"
                }`}
              />
              <h3
                className={`font-semibold text-lg mb-2 ${
                  isDark ? "text-white" : "text-slate-800"
                }`}
              >
                Compete & Excel
              </h3>
              <p className={isDark ? "text-slate-300" : "text-slate-600"}>
                Challenge top projects from other colleges.
              </p>
            </div>
            <div
              className={`p-8 rounded-xl shadow-sm text-center transition-colors duration-300 ${
                isDark ? "bg-slate-800" : "bg-sky-50"
              }`}
            >
              <TrendingUp
                className={`h-12 w-12 mx-auto mb-4 ${
                  isDark ? "text-cyan-400" : "text-sky-500"
                }`}
              />
              <h3
                className={`font-semibold text-lg mb-2 ${
                  isDark ? "text-white" : "text-slate-800"
                }`}
              >
                Pitch to Investors
              </h3>
              <p className={isDark ? "text-slate-300" : "text-slate-600"}>
                Present to industry experts and investors.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How PPL Works */}
      <section
        id="how-it-works"
        className={`py-20 sm:py-24 px-4 transition-colors duration-300 ${
          isDark ? "bg-slate-800" : "bg-gradient-to-br from-sky-50 to-blue-50"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2
            className={`text-3xl sm:text-4xl font-bold text-center mb-16 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            How PPL Works
          </h2>
          <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div
              className={`absolute top-1/2 left-0 w-full h-px hidden lg:block ${
                isDark ? "bg-slate-600" : "bg-slate-300"
              }`}
            ></div>
            {[
              {
                num: 1,
                title: "Register",
                desc: "Students or colleges register their projects on the PPL platform.",
              },
              {
                num: 2,
                title: "Learn",
                desc: "Go through our 8-Week Startup Course to refine ideas.",
              },
              {
                num: 3,
                title: "Compete",
                desc: "Projects are evaluated and top teams are shortlisted.",
              },
              {
                num: 4,
                title: "Pitch Day",
                desc: "Top projects pitch directly to investors during PPL Investor Day.",
              },
            ].map((step, index) => (
              <div
                key={index}
                className={`relative rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-2 ${
                  isDark ? "bg-slate-700" : "bg-white"
                }`}
              >
                <div
                  className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl border-4 ${
                    isDark
                      ? "bg-cyan-500 border-slate-800"
                      : "bg-sky-500 border-sky-50"
                  }`}
                >
                  {step.num}
                </div>
                <h3
                  className={`text-xl font-semibold mb-3 mt-8 text-center ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`text-center ${
                    isDark ? "text-slate-300" : "text-slate-600"
                  }`}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Startup Course */}
      <section
        id="course"
        className={`py-20 sm:py-24 px-4 transition-colors duration-300 ${
          isDark ? "bg-slate-900" : "bg-white"
        }`}
      >
        <div className="max-w-6xl mx-auto text-center">
          <h2
            className={`text-3xl sm:text-4xl font-bold mb-4 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            PPL Startup Course
          </h2>
          <p
            className={`text-lg mb-12 ${
              isDark ? "text-slate-300" : "text-slate-600"
            }`}
          >
            An 8-week program to build a validated business model and a pitch
            deck.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Ideation & Validation",
              "Business Model Basics",
              "MVP & Prototyping",
              "Market Research",
              "Financials & Funding 101",
              "Pitching & Storytelling",
              "Legal & Startup Essentials",
              "Demo & Investor Prep",
            ].map((topic) => (
              <div
                key={topic}
                className={`rounded-lg p-4 text-center font-medium transition-colors duration-300 ${
                  isDark
                    ? "bg-slate-800 text-slate-200 hover:bg-cyan-900 hover:text-cyan-300"
                    : "bg-sky-50 text-slate-700 hover:bg-sky-100 hover:text-sky-800"
                }`}
              >
                {topic}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why PPL */}
      <section
        id="why-ppl"
        className={`py-20 sm:py-24 px-4 transition-colors duration-300 ${
          isDark ? "bg-slate-800" : "bg-gradient-to-br from-sky-50 to-blue-50"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <h2
            className={`text-3xl sm:text-4xl font-bold text-center mb-12 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Why PPL?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <InfoCard
              icon={
                <GraduationCap
                  className={`h-8 w-8 ${
                    isDark ? "text-cyan-400" : "text-sky-500"
                  }`}
                />
              }
              title="For Students"
              isDark={isDark}
            >
              Opportunity to convert projects into real startups with investor
              backing.
            </InfoCard>
            <InfoCard
              icon={
                <School
                  className={`h-8 w-8 ${
                    isDark ? "text-purple-400" : "text-purple-500"
                  }`}
                />
              }
              title="For Colleges"
              isDark={isDark}
            >
              Showcase innovation and attract industry partnerships to your
              campus.
            </InfoCard>
            <InfoCard
              icon={
                <Briefcase
                  className={`h-8 w-8 ${
                    isDark ? "text-indigo-400" : "text-indigo-500"
                  }`}
                />
              }
              title="For Investors"
              isDark={isDark}
            >
              Early access to high-potential student startups with fresh ideas.
            </InfoCard>
          </div>
        </div>
      </section>

      {/* Evaluation Criteria */}
      <section
        className={`py-20 sm:py-24 px-4 transition-colors duration-300 ${
          isDark ? "bg-slate-900" : "bg-white"
        }`}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className={`text-3xl sm:text-4xl font-bold text-center mb-12 ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            Evaluation Criteria
          </h2>
          <div
            className={`p-8 rounded-xl shadow-sm transition-colors duration-300 ${
              isDark ? "bg-slate-800" : "bg-sky-50"
            }`}
          >
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
              {[
                "Innovation & Creativity",
                "Market Relevance",
                "Feasibility & Execution Potential",
                "Scalability",
                "Impact (Social/Economic/Environmental)",
              ].map((criteria) => (
                <li key={criteria} className="flex items-center gap-3">
                  <CheckCircle
                    className={`h-6 w-6 flex-shrink-0 ${
                      isDark ? "text-green-400" : "text-green-500"
                    }`}
                  />
                  <span
                    className={isDark ? "text-slate-200" : "text-slate-700"}
                  >
                    {criteria}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Investor Day */}
      <section
        className={`py-20 sm:py-24 px-4 text-white transition-colors duration-300 ${
          isDark ? "bg-slate-800" : "bg-gradient-to-br from-sky-600 to-blue-700"
        }`}
      >
        <div className="max-w-6xl mx-auto text-center">
          <Award className="h-16 w-16 mx-auto mb-6 text-amber-400" />
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Investor Day: The Grand Finale
          </h2>
          <p
            className={`text-lg mb-12 max-w-3xl mx-auto ${
              isDark ? "text-slate-300" : "text-sky-50"
            }`}
          >
            Top student teams pitch to a panel of investors, mentors, and
            incubators.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "💰",
                title: "Potential Investments",
                desc: "Secure funding for your startup journey.",
              },
              {
                icon: "🤝",
                title: "Industry Mentorship",
                desc: "Get guidance from experienced professionals.",
              },
              {
                icon: "🎓",
                title: "Incubation Opportunities",
                desc: "Access top incubators and accelerators.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`rounded-lg p-6 backdrop-blur-sm border transition-colors duration-300 ${
                  isDark
                    ? "bg-slate-700/50 border-slate-600"
                    : "bg-white/20 border-sky-400/30"
                }`}
              >
                <h3 className="text-4xl mb-3">{item.icon}</h3>
                <h4 className="font-semibold text-lg mb-2 text-white">
                  {item.title}
                </h4>
                <p className={isDark ? "text-slate-300" : "text-sky-50"}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className={`py-20 sm:py-24 px-4 transition-colors duration-300 ${
          isDark ? "bg-slate-900" : "bg-white"
        }`}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2
                className={`text-3xl sm:text-4xl font-bold mb-4 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Join the Movement
              </h2>
              <p
                className={`text-lg mb-8 ${
                  isDark ? "text-slate-300" : "text-slate-600"
                }`}
              >
                Whether you're a student with a big idea, a college fostering
                innovation, or an investor looking for the next big thing—PPL is
                for you.
              </p>
            </div>
            <div className="space-y-6">
              <div
                className={`p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex items-center justify-between ${
                  isDark ? "bg-slate-800" : "bg-sky-50"
                }`}
              >
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      isDark ? "text-cyan-400" : "text-sky-600"
                    }`}
                  >
                    Students
                  </h3>
                  <p className={isDark ? "text-slate-300" : "text-slate-600"}>
                    Take your project beyond the classroom.
                  </p>
                </div>
                {/* CHANGE: Button is now a RouterLink to /roles */}
                <RouterLink
                  to="/roles"
                  className={`px-6 py-2 rounded-full font-semibold transition-colors duration-300 flex-shrink-0 ${
                    isDark
                      ? "bg-cyan-500 text-white hover:bg-cyan-600"
                      : "bg-sky-500 text-white hover:bg-sky-600"
                  }`}
                >
                  Register Now
                </RouterLink>
              </div>
              <div
                className={`p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex items-center justify-between ${
                  isDark ? "bg-slate-800" : "bg-purple-50"
                }`}
              >
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      isDark ? "text-purple-400" : "text-purple-600"
                    }`}
                  >
                    Colleges
                  </h3>
                  <p className={isDark ? "text-slate-300" : "text-slate-600"}>
                    Empower your students to become founders.
                  </p>
                </div>
                {/* CHANGE: Button is now a RouterLink to /roles */}
                <RouterLink
                  to="/roles"
                  className={`px-6 py-2 rounded-full font-semibold transition-colors duration-300 flex-shrink-0 ${
                    isDark
                      ? "bg-purple-500 text-white hover:bg-purple-600"
                      : "bg-purple-500 text-white hover:bg-purple-600"
                  }`}
                >
                  Partner With Us
                </RouterLink>
              </div>
              <div
                className={`p-6 rounded-lg shadow-sm hover:shadow-lg transition-shadow duration-300 flex items-center justify-between ${
                  isDark ? "bg-slate-800" : "bg-indigo-50"
                }`}
              >
                <div>
                  <h3
                    className={`text-xl font-bold ${
                      isDark ? "text-indigo-400" : "text-indigo-600"
                    }`}
                  >
                    Investors
                  </h3>
                  <p className={isDark ? "text-slate-300" : "text-slate-600"}>
                    Discover tomorrow's startups, today.
                  </p>
                </div>
                {/* CHANGE: Button is now a RouterLink to /roles */}
                <RouterLink
                  to="/roles"
                  className={`px-6 py-2 rounded-full font-semibold transition-colors duration-300 flex-shrink-0 ${
                    isDark
                      ? "bg-indigo-500 text-white hover:bg-indigo-600"
                      : "bg-indigo-500 text-white hover:bg-indigo-600"
                  }`}
                >
                  Get Started
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <footer
        id="contact"
        className={`py-16 px-4 transition-colors duration-300 ${
          isDark
            ? "bg-slate-800 text-slate-300"
            : "bg-gradient-to-br from-sky-600 to-blue-700 text-white"
        }`}
      >
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center mb-4">
            <Rocket className="h-8 w-8 text-primary" />
            <span
              className={`ml-3 text-2xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-white"
              }`}
            >
              Premier Project League
            </span>
          </div>
          <div className="flex items-center justify-center gap-4 my-8">
            <Mail className="h-5 w-5 text-secondary-text" />
            <a
              href="mailto:contact@ppl.com"
              className={`text-lg transition-colors duration-300 ${
                isDark
                  ? "text-slate-300 hover:text-white"
                  : "text-sky-50 hover:text-white"
              }`}
            >
              contact@ppl.com
            </a>
          </div>
          <div className="flex justify-center gap-6 mb-8">
            <a
              href="#"
              className={`transition-colors duration-300 ${
                isDark ? "hover:text-cyan-400" : "hover:text-sky-200"
              }`}
            >
              <Linkedin className="h-7 w-7" />
            </a>
            <a
              href="#"
              className={`transition-colors duration-300 ${
                isDark ? "hover:text-cyan-400" : "hover:text-sky-200"
              }`}
            >
              <Instagram className="h-7 w-7" />
            </a>
            <a
              href="#"
              className={`transition-colors duration-300 ${
                isDark ? "hover:text-cyan-400" : "hover:text-sky-200"
              }`}
            >
              <Twitter className="h-7 w-7" />
            </a>
            <a
              href="#"
              className={`transition-colors duration-300 ${
                isDark ? "hover:text-cyan-400" : "hover:text-sky-200"
              }`}
            >
              <Youtube className="h-7 w-7" />
            </a>
          </div>
          <p className={isDark ? "text-slate-400" : "text-sky-100"}>
            © 2025 Premier Project League. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}