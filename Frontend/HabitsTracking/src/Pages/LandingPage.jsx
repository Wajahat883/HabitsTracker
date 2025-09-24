// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import logoImage from '../assets/logo-habit-tracker.png';
// // import heroImage from '../assets/pexels-yaroslav-shuraev-4503979.jpg';
// // import feature1Image from '../assets/pexels-elly-fairytale-3822583.jpg';
// // import feature2Image from '../assets/pexels-cottonbro-4058794.jpg';
// // import feature3Image from '../assets/pexels-julieaagaard-1426718.jpg';
// // import statsImage from '../assets/pexels-kinkate-421160.jpg';
// // import testimonialImage from '../assets/pexels-helenalopes-1996334.jpg';

// const LandingPage = () => {
//   const navigate = useNavigate();
//   const [isVisible, setIsVisible] = useState({});

//   useEffect(() => {
//     // Stagger animations on load
//     const timeouts = [];
//     ['hero', 'features', 'benefits', 'cta'].forEach((section, index) => {
//       const timeout = setTimeout(() => {
//         setIsVisible(prev => ({...prev, [section]: true}));
//       }, index * 200);
//       timeouts.push(timeout);
//     });

//     return () => timeouts.forEach(clearTimeout);
//   }, []);

//   const features = [
//     {
//       title: "Build Better Habits",
//       description: "Transform your life one habit at a time with our AI-powered tracking system",
//       icon: "🎯",
//       image: bookImage,
//       gradient: "from-blue-500 to-indigo-600"
//     },
//     {
//       title: "Stay Motivated",
//       description: "Dynamic progress tracking and intelligent streaks keep you motivated every day",
//       icon: "📈",
//       image: cyclingImage,
//       gradient: "from-emerald-500 to-teal-600"
//     },
//     {
//       title: "Track Progress",
//       description: "Advanced analytics and insights help you understand patterns and celebrate wins",
//       icon: "🏆",
//       image: horseRidingImage,
//       gradient: "from-purple-500 to-pink-600"
//     }
//   ];

//   return (
//     <div className="min-h-screen relative overflow-hidden" style={{background: 'var(--gradient-bg)'}}>
//       {/* Animated Background */}
//       <div className="fixed inset-0 animate-gradient">
//         <div className="absolute inset-0" style={
//           {background: 'var(--gradient-bg)'}
//           }></div>
//         <div className="absolute inset-0" style={{background: 'var(--gradient-accent)', opacity: 0.1}}></div>
//         <div className="absolute inset-0 backdrop-blur-3xl"></div>
//       </div>

//       {/* Floating Elements */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-float" style={{background: 'var(--color-primary)', opacity: 0.1}}></div>
//         <div className="absolute top-3/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-float" style={{background: 'var(--color-accent)', opacity: 0.1, animationDelay: '1s'}}></div>
//         <div className="absolute top-1/2 left-3/4 w-72 h-72 rounded-full blur-3xl animate-float" style={{background: 'var(--color-success)', opacity: 0.1, animationDelay: '2s'}}></div>
//       </div>

//       <div className="relative z-10">
//         <div className="container mx-auto px-6 py-20">
//           {/* Hero Section */}
//           <div className={`text-center mb-20 transform transition-all duration-1000 ${isVisible.hero ? 'animate-fadein-up' : 'opacity-0 translate-y-20'}`}>
//             <div className="flex justify-center mb-8">
//               <div className="relative group">
//                 <div className="absolute inset-0 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300" style={{background: 'var(--gradient-primary)'}}></div>
//                 <img 
//                   src={logoImage} 
//                   alt="Habit Tracker Logo" 
//                   className="relative w-32 h-32 md:w-48 md:h-48 object-contain animate-float"
//                 />
//               </div>
//             </div>
            
//             <h1 className="text-display mb-6 text-shadow-lg">
//               <span className="text-morph">Transform Your Life with</span>
//               <br />
//               <span className="text-glow animate-gradient">Better Habits</span>
//             </h1>
            
//             <p className="text-lead mb-12 max-w-4xl mx-auto leading-relaxed" style={{color: 'var(--color-text-light)'}}>
//               Build lasting habits, track your progress with advanced analytics, and achieve your goals with our 
//               <span className="text-blue-600 dark:text-blue-400 font-semibold"> AI-powered </span>
//               habit tracking platform. Start your transformation today!
//             </p>

//             {/* Modern CTA Buttons */}
//             <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
//               <button
//                 onClick={() => navigate('/signup')}
//                 className="btn btn-xl magnetic micro-bounce particle-system nav-button-enhance transition-all duration-300 hover:scale-105"
//               >
//                 <span className="relative z-10 flex items-center gap-3">
//                   <span className="text-2xl morphing-blob transition-transform duration-300 hover:rotate-12">🚀</span>
//                   Start Your Journey
//                 </span>
//               </button>
//               <button
//                 onClick={() => navigate('/login')}
//                 className="btn-neon btn-lg magnetic micro-bounce nav-button-enhance transition-all duration-300 hover:scale-105"
//               >
//                 <span className="flex items-center gap-3">
//                   <span className="text-xl transition-transform duration-300 hover:scale-110">👋</span>
//                   Welcome Back
//                 </span>
//               </button>
//             </div>

//             {/* Stats */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
//               <div className="card-floating magnetic particle-system">
//                 <div className="text-3xl font-bold mb-2 text-shimmer" style={{color: 'var(--color-primary)'}}>10K+</div>
//                 <div style={{color: 'var(--color-text-muted)'}}>Active Users</div>
//               </div>
//               <div className="card-3d magnetic particle-system">
//                 <div className="text-3xl font-bold mb-2 text-shimmer" style={{color: 'var(--color-success)'}}>1M+</div>
//                 <div style={{color: 'var(--color-text-muted)'}}>Habits Tracked</div>
//               </div>
//               <div className="card-neon magnetic particle-system">
//                 <div className="text-3xl font-bold mb-2" style={
//                   {color: 'var(--color-accent)'}
//                   }>95%</div>
//                 <div style={{color: 'var(--color-text-muted)'}}>Success Rate</div>
//               </div>
//             </div>
//           </div>

//           {/* Modern Features Grid */}
//           <div className={`grid md:grid-cols-3 gap-8 mb-20 transform transition-all duration-1000 delay-300 ${isVisible.features ? 'animate-fadein-up' : 'opacity-0 translate-y-20'}`}>
//             {features.map((feature, index) => (
//               <div 
//                 key={index}
//                 className="relative group overflow-hidden"
//                 style={{animationDelay: `${index * 150}ms`}}
//               >
//                 {/* Card Background with Glassmorphism */}
//                 <div className="card-liquid magnetic micro-bounce">
//                   {/* Gradient Overlay */}
//                   <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl`}></div>
                  
//                   {/* Content */}
//                   <div className="relative z-10">
//                     <div className="w-20 h-20 mx-auto mb-6 rounded-2xl backdrop-blur-sm flex items-center justify-center text-4xl animate-float group-hover:animate-bounce-in" style={{background: 'var(--glass-bg)', border: '1px solid var(--glass-border)'}}>
//                       {feature.icon}
//                     </div>
                    
//                     <h3 className="text-2xl font-bold mb-4 text-center group-hover:text-gradient transition-all duration-300" style={{color: 'var(--color-text)'}}>
//                       {feature.title}
//                     </h3>
                    
//                     <p className="leading-relaxed text-center transition-colors duration-300" style={{color: 'var(--color-text-muted)'}}>
//                       {feature.description}
//                     </p>
                    
//                     {/* Interactive Element */}
//                     <div className="mt-6 flex justify-center">
//                       <div className={`w-12 h-1 bg-gradient-to-r ${feature.gradient} rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>

//           {/* Modern Benefits Section */}
//           <div className={`card-3d particle-system transform transition-all duration-1000 delay-600 ${isVisible.benefits ? 'animate-fadein-up' : 'opacity-0 translate-y-20'}`}>
//             <div className="text-center mb-12">
//               <h2 className="text-4xl md:text-5xl font-bold mb-6 text-shadow-lg text-shimmer" style={{color: 'var(--color-text)'}}>
//                 Why Habit Tracking
//                 <span className="text-gradient"> Actually Works</span>
//               </h2>
//               <p className="text-xl max-w-3xl mx-auto leading-relaxed" style={{color: 'var(--color-text-muted)'}}>
//                 Science-backed approach powered by behavioral psychology and advanced analytics 
//                 to create lasting positive changes in your life
//               </p>
//             </div>

//             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
//               {[
//                 { icon: "📊", title: "Advanced Analytics", desc: "AI-powered insights reveal your behavior patterns and optimal habit timing", color: "from-blue-500 to-cyan-500" },
//                 { icon: "🎯", title: "Smart Goals", desc: "Adaptive goal setting that adjusts based on your progress and lifestyle", color: "from-purple-500 to-pink-500" },
//                 { icon: "🔥", title: "Streak Power", desc: "Psychological momentum building through gamified streak tracking", color: "from-orange-500 to-red-500" },
//                 { icon: "⚡", title: "Instant Feedback", desc: "Real-time progress updates and motivational insights keep you engaged", color: "from-yellow-500 to-orange-500" },
//                 { icon: "🌟", title: "Personal Growth", desc: "Transform your identity through consistent small wins and habit stacking", color: "from-emerald-500 to-teal-500" },
//                 { icon: "🧠", title: "Neural Rewiring", desc: "Build new neural pathways through consistent repetition and positive reinforcement", color: "from-indigo-500 to-purple-500" }
//               ].map((benefit, index) => (
//                 <div 
//                   key={index}
//                   className="group hover-lift"
//                   style={{animationDelay: `${index * 100}ms`}}
//                 >
//                   <div className="card-floating magnetic micro-bounce">
//                     <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center text-2xl morphing-blob`}>
//                       {benefit.icon}
//                     </div>
//                     <h4 className="font-bold mb-3 text-center text-shimmer transition-all duration-300" style={{color: 'var(--color-text)'}}>
//                       {benefit.title}
//                     </h4>
//                     <p className="text-sm leading-relaxed text-center transition-colors duration-300" style={{color: 'var(--color-text-muted)'}}>
//                       {benefit.desc}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Final CTA Section */}
//           <div className={`text-center transform transition-all duration-1000 delay-900 ${isVisible.cta ? 'animate-fadein-up' : 'opacity-0 translate-y-20'}`}>
//             <div className="card-neon particle-system max-w-4xl mx-auto">
//               <h3 className="text-4xl md:text-5xl font-bold mb-6 text-shadow-lg text-shimmer" style={{color: 'var(--color-text)'}}>
//                 Ready to 
//                 <span className="text-gradient"> Transform Your Life?</span>
//               </h3>
//               <p className="text-xl mb-10 leading-relaxed" style={{color: 'var(--color-text-muted)'}}>
//                 Join over <span className="font-bold" style={{color: 'var(--color-primary)'}}>10,000+ users</span> who have already 
//                 transformed their lives through the power of consistent habits
//               </p>
              
//               <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
//                 <button
//                   onClick={() => navigate('/signup')}
//                   className="btn-glass btn-xl magnetic micro-bounce liquid-loader nav-button-enhance transition-all duration-300 hover:scale-105"
//                 >
//                   <span className="relative z-10 flex items-center gap-3">
//                     <span className="text-2xl morphing-blob transition-transform duration-300 hover:rotate-12">🎉</span>
//                     Start Free Today
//                   </span>
//                 </button>
//                 <div className="text-neutral-400 text-sm transition-all duration-300 hover:text-neutral-300">
//                   No credit card required • Setup in 30 seconds
//                 </div>
//               </div>

//               {/* Trust Indicators */}
//               <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 opacity-60">
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">4.9★</div>
//                   <div className="text-xs text-slate-500 dark:text-neutral-400">App Rating</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">10K+</div>
//                   <div className="text-xs text-slate-500 dark:text-neutral-400">Happy Users</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">1M+</div>
//                   <div className="text-xs text-slate-500 dark:text-neutral-400">Habits Tracked</div>
//                 </div>
//                 <div className="text-center">
//                   <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">24/7</div>
//                   <div className="text-xs text-slate-500 dark:text-neutral-400">Support</div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LandingPage;