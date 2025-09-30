// src/pages/LandingPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Name */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">E</span>
              </div>
              <span className="text-white font-bold text-lg">EPH Platform</span>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              <button
                onClick={() => navigate('/')}
                className="text-white/90 hover:text-white transition-colors font-medium"
              >
                Home
              </button>
              <button
                onClick={() => navigate('/about')}
                className="text-white/90 hover:text-white transition-colors font-medium"
              >
                About
              </button>
              <button
                onClick={() => navigate('/competitions')}
                className="text-white/90 hover:text-white transition-colors font-medium"
              >
                Competitions
              </button>
              <button
                onClick={() => navigate('/roles')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-medium transition-colors border border-white/30"
              >
                Sign Up
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              <button
                onClick={() => { navigate('/'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-2 text-white/90 hover:bg-white/10 rounded-lg"
              >
                Home
              </button>
              <button
                onClick={() => { navigate('/about'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-2 text-white/90 hover:bg-white/10 rounded-lg"
              >
                About
              </button>
              <button
                onClick={() => { navigate('/competitions'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-2 text-white/90 hover:bg-white/10 rounded-lg"
              >
                Competitions
              </button>
              <button
                onClick={() => { navigate('/roles'); setMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-2 bg-white/20 text-white rounded-lg font-medium"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Engineering Projects Hub
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
            Empowering Students, Connecting Opportunities
          </p>
          <p className="text-lg text-white/80 mb-12 max-w-2xl mx-auto">
            Join competitions, showcase your projects, connect with recruiters, and unlock exclusive perks
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/competitions')}
              className="px-8 py-4 bg-white text-purple-600 rounded-xl font-bold text-lg hover:bg-white/90 transition-colors shadow-lg"
            >
              Explore Competitions
            </button>
            <button
              onClick={() => navigate('/roles')}
              className="px-8 py-4 bg-white/20 text-white rounded-xl font-bold text-lg hover:bg-white/30 transition-colors border border-white/30"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Why Choose EPH?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Compete & Win</h3>
              <p className="text-white/80">
                Participate in exciting competitions from top companies and universities
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Get Hired</h3>
              <p className="text-white/80">
                Connect with recruiters and showcase your skills to potential employers
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Unlock Perks</h3>
              <p className="text-white/80">
                Earn XP and redeem exclusive perks and rewards from our partners
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 px-4 bg-black/30">
        <div className="max-w-7xl mx-auto text-center text-white/70 text-sm">
          <p>&copy; 2025 EPH Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;