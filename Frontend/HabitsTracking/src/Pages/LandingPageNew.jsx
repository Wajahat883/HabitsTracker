import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Import available assets
import logoImage from '../assets/logo-habit-tracker.png';
import bookImage from '../assets/pexels-yaroslav-shuraev-4503979.jpg';
import cyclingImage from '../assets/pexels-gustavorodrigues-1748447.jpg';
import horseRidingImage from '../assets/pexels-elly-fairytale-3822583.jpg';

const LandingPageNew = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState({});

  useEffect(() => {
    // Stagger animations on load
    const timeouts = [];
    ['hero', 'gallery', 'features', 'testimonials', 'motivation', 'cta'].forEach((section, index) => {
      const timeout = setTimeout(() => {
        setIsVisible(prev => ({...prev, [section]: true}));
      }, index * 300);
      timeouts.push(timeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      {/* Navigation Header */}
      <nav className="relative z-50 px-6 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
            <img 
              src={logoImage} 
              alt="HabitTracker Logo" 
              className="w-10 h-10 object-contain group-hover:rotate-12 transition-transform duration-300"
            />
            <span className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300">
              HabitTracker
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 text-white/80 hover:text-white transition-colors duration-300 font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className={`relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 transform transition-all duration-1000 ${isVisible.hero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                Unlock Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Greatest Potential
                </span>
              </h1>
              <p className="text-xl text-white/70 leading-relaxed max-w-lg">
                <span className="font-semibold text-white">Every champion was once a beginner.</span> Transform your life one habit at a time. 
                Our AI-powered system doesn't just track your habits—it evolves with you, celebrates your wins, and turns your dreams into daily reality.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">✨</span>
                <span className="text-white font-semibold">Why settle for ordinary when you can be extraordinary?</span>
              </div>
              <p className="text-white/80 text-sm">
                Success isn't about perfection—it's about progress. Start today, and in 90 days, 
                you'll thank yourself for taking that first step.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/signup')}
                className="px-8 py-4 bg-white text-purple-900 rounded-full font-semibold text-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 shadow-xl"
              >
                Start Your Journey Today
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 border-2 border-white/30 text-white rounded-full font-semibold text-lg hover:border-white/50 hover:bg-white/10 transition-all duration-300"
              >
                Watch Success Stories
              </button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">50k+</div>
                <div className="text-white/60 text-sm">Lives Changed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">2M+</div>
                <div className="text-white/60 text-sm">Goals Achieved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">98%</div>
                <div className="text-white/60 text-sm">See Results</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <img 
                src={bookImage}
                alt="Success Journey"
                className="w-full h-96 lg:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 via-transparent to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <p className="text-white font-semibold text-sm">
                    "The difference between who you are and who you want to be is what you do."
                  </p>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-2xl animate-bounce shadow-lg">
              🏆
            </div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-xl animate-pulse shadow-lg">
              📈
            </div>
          </div>
        </div>
      </div>

      {/* Inspirational Gallery Section */}
      <div className={`relative z-10 max-w-7xl mx-auto px-6 py-20 transform transition-all duration-1000 delay-300 ${isVisible.gallery ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Your Journey to
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Greatness Starts Here
            </span>
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            <span className="font-semibold text-white">"A journey of a thousand miles begins with a single step."</span> 
            See yourself in these moments of growth, determination, and triumph.
          </p>
        </div>

        {/* Dynamic Image Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { image: bookImage, title: "Knowledge & Learning", desc: "Every expert was once a beginner who never stopped learning" },
            { image: cyclingImage, title: "Active Lifestyle", desc: "Your body is your temple—treat it like one" },
            { image: horseRidingImage, title: "Adventure & Growth", desc: "Life begins at the end of your comfort zone" }
          ].map((item, index) => (
            <div 
              key={index}
              className="group relative rounded-2xl overflow-hidden hover:scale-105 transition-all duration-500"
              style={{animationDelay: `${index * 100}ms`}}
            >
              <img 
                src={item.image}
                alt={item.title}
                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h4 className="text-white font-semibold text-lg mb-2">{item.title}</h4>
                <p className="text-white/90 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section with Motivational Content */}
      <div className={`relative z-10 max-w-7xl mx-auto px-6 py-20 transform transition-all duration-1000 delay-600 ${isVisible.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Tools That Transform
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Dreams Into Reality
            </span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "AI-Powered Insights",
              description: "Your personal success coach that learns from your patterns and guides you toward breakthrough moments.",
              motivation: "Intelligence applied to habit formation—this is where magic happens.",
              icon: "🧠",
              gradient: "from-blue-500 to-purple-500"
            },
            {
              title: "Visual Progress Tracking",
              description: "Watch your transformation unfold with beautiful analytics that celebrate every milestone on your journey.",
              motivation: "Progress, not perfection. See how far you've come.",
              icon: "📊",
              gradient: "from-purple-500 to-pink-500"
            },
            {
              title: "Community Support",
              description: "Connect with like-minded achievers who understand your journey and celebrate your victories.",
              motivation: "Together we rise. Your success inspires others to succeed.",
              icon: "👥",
              gradient: "from-pink-500 to-orange-500"
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="group relative rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all duration-500 hover:scale-105"
              style={{animationDelay: `${index * 200}ms`}}
            >
              <div className="relative p-8 space-y-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center text-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-white/70 leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg p-4 border-l-4 border-purple-400">
                  <p className="text-purple-200 text-sm font-medium italic">
                    💡 {feature.motivation}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials Section */}
      <div className={`relative z-10 max-w-7xl mx-auto px-6 py-20 transform transition-all duration-1000 delay-900 ${isVisible.testimonials ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Real Stories,
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Real Transformations
            </span>
          </h2>
          <p className="text-xl text-white/70">
            Your success story could be next. These champions started exactly where you are now.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Sarah M.",
              title: "Fitness Enthusiast",
              image: cyclingImage,
              quote: "HabitTracker didn't just change my routine—it changed my entire mindset. I've lost 40 pounds and gained confidence I never knew I had.",
              achievement: "Lost 40lbs in 6 months"
            },
            {
              name: "Michael R.",
              title: "Entrepreneur",
              image: bookImage,
              quote: "The habit of reading 30 minutes daily led to launching my dream business. Small habits, massive results. This app made it possible.",
              achievement: "Built $100K business"
            },
            {
              name: "Emma L.",
              title: "Adventure Seeker",
              image: horseRidingImage,
              quote: "From struggling with procrastination to conquering my fears. HabitTracker taught me that consistency beats perfection every time.",
              achievement: "Completed 10K marathon"
            }
          ].map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-500 hover:scale-105"
            >
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-purple-400"
                />
                <div>
                  <h4 className="text-white font-bold">{testimonial.name}</h4>
                  <p className="text-white/60 text-sm">{testimonial.title}</p>
                </div>
              </div>
              
              <blockquote className="text-white/80 text-lg leading-relaxed mb-4 italic">
                "{testimonial.quote}"
              </blockquote>
              
              <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-3 border border-green-400/30">
                <p className="text-green-300 font-semibold text-sm">
                  🎉 {testimonial.achievement}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Motivation Section */}
      <div className={`relative z-10 max-w-4xl mx-auto px-6 py-20 text-center transform transition-all duration-1000 delay-1200 ${isVisible.motivation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur-sm rounded-3xl border border-white/20 p-12 space-y-8">
          <div className="text-6xl mb-4">🌟</div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            The Time Is
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              NOW
            </span>
          </h2>
          
          <p className="text-xl text-white leading-relaxed max-w-3xl mx-auto">
            <span className="font-bold text-purple-300">Tomorrow you'll wish you started today.</span> 
            Every moment you wait is a moment you could be building the life you've always dreamed of. 
            Your future self is counting on the decision you make right now.
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
            <p className="text-white/90 text-lg font-semibold">
              "The best time to plant a tree was 20 years ago. The second best time is now." 
            </p>
            <p className="text-white/60 text-sm mt-2">- Chinese Proverb</p>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className={`relative z-10 max-w-4xl mx-auto px-6 py-20 text-center transform transition-all duration-1000 delay-1500 ${isVisible.cta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 p-12 space-y-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-white">
            Your Transformation
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Begins Today
            </span>
          </h2>
          
          <p className="text-xl text-white/70 max-w-2xl mx-auto">
            Join over <span className="font-bold text-white">50,000+ achievers</span> who chose progress over procrastination. 
            Your habits shape your destiny—make them count.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={() => navigate('/signup')}
              className="px-12 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-purple-500/25"
            >
              Start Your Journey Now
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-12 py-4 border-2 border-white/30 text-white rounded-full font-semibold text-lg hover:border-white/50 hover:bg-white/10 transition-all duration-300"
            >
              Welcome Back, Champion
            </button>
          </div>
          
          <div className="text-white/60 text-sm space-y-2">
            <div>✨ Free forever • No credit card required • Setup in 60 seconds</div>
            <div>🔒 Your data is secure and private • 🎯 Cancel anytime</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/20 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={logoImage} 
                alt="HabitTracker Logo" 
                className="w-8 h-8 object-contain"
              />
              <span className="text-lg font-bold text-white">HabitTracker</span>
            </div>
            
            <div className="text-white/60 text-sm text-center">
              <div>© 2025 HabitTracker. All rights reserved.</div>
              <div className="text-purple-300 text-xs mt-1">
                "Your future is created by what you do today, not tomorrow."
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageNew;