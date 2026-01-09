import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // 👈 Added

// Animated counter hook
const useCounter = (end: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let startTime: number;
    let animationFrame: number;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  
  return count;
};

// Mouse parallax hook
const useMouseParallax = (intensity: number = 0.02) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX - window.innerWidth / 2) * intensity;
      const y = (e.clientY - window.innerHeight / 2) * intensity;
      setPosition({ x, y });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [intensity]);
  
  return position;
};

// Morphing blob component
const MorphingBlob = ({ className, color }: { className: string; color: string }) => (
  <div 
    className={`absolute blur-3xl opacity-30 ${className}`}
    style={{
      background: color,
      borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
      animation: 'morph 8s ease-in-out infinite'
    }}
  />
);

// Floating ring
const FloatingRing = ({ size, left, top, delay }: { size: number; left: string; top: string; delay: number }) => (
  <div 
    className="absolute border-2 border-amber-500/20 rounded-full"
    style={{
      width: size,
      height: size,
      left,
      top,
      animation: `float ${8 + delay * 2}s ease-in-out infinite, spin ${20 + delay * 5}s linear infinite`,
      animationDelay: `${delay}s`
    }}
  />
);

// Glowing dot
const GlowDot = ({ left, top, delay }: { left: string; top: string; delay: number }) => (
  <div 
    className="absolute w-2 h-2 rounded-full bg-amber-400"
    style={{
      left,
      top,
      boxShadow: '0 0 20px 5px rgba(251, 191, 36, 0.4)',
      animation: `pulse-glow 3s ease-in-out infinite`,
      animationDelay: `${delay}s`
    }}
  />
);

// 3D Card component
const Card3D = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
  };
  
  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0deg) rotateY(0deg)');
  };
  
  return (
    <div 
      ref={cardRef}
      className={`transition-transform duration-200 ${className}`}
      style={{ transform }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

// Stat card with glassmorphism
const GlassStatCard = ({ value, label, suffix = '', icon, delay }: { value: number; label: string; suffix?: string; icon: React.ReactNode; delay: number }) => {
  const count = useCounter(value, 2500);
  
  return (
    <Card3D>
      <div 
        className="relative group"
        style={{ animation: `rise ${0.8}s ease-out forwards`, animationDelay: `${delay}s`, opacity: 0 }}
      >
        {/* Glow background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 via-amber-400/20 to-amber-500/30 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
        
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/90 via-amber-900/80 to-amber-950/90 border border-amber-500/20 backdrop-blur-xl p-8">
          {/* Shine effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent"
              style={{ animation: 'shine 1.5s ease-in-out' }}
            />
          </div>
          
          {/* Icon with animated ring */}
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 animate-pulse" style={{ animationDuration: '3s' }} />
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40">
              {icon}
            </div>
            <div className="absolute -inset-2 rounded-2xl border border-amber-500/30 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
          </div>
          
          {/* Value with gradient */}
          <div className="text-5xl font-black mb-2">
            <span className="bg-gradient-to-r from-amber-100 via-amber-50 to-amber-100 bg-clip-text text-transparent">
              {count.toLocaleString()}{suffix}
            </span>
          </div>
          
          {/* Label */}
          <div className="text-amber-300/70 font-medium tracking-wide uppercase text-sm">
            {label}
          </div>
        </div>
      </div>
    </Card3D>
  );
};

// Premium feature card
const PremiumFeatureCard = ({ icon, title, description, accentColor, delay }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  accentColor: string;
  delay: number;
}) => (
  <div 
    className="group relative"
    style={{ animation: `rise 0.8s ease-out forwards`, animationDelay: `${delay}s`, opacity: 0 }}
  >
    {/* Hover glow */}
    <div className={`absolute -inset-1 ${accentColor} rounded-3xl blur-xl opacity-0 group-hover:opacity-30 transition-all duration-500`} />
    
    <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/80 via-amber-900/60 to-amber-950/80 border border-amber-500/10 backdrop-blur-xl p-8 transition-all duration-500 group-hover:border-amber-500/30">
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-3xl overflow-hidden">
        <div 
          className="absolute inset-0 opacity-0 group-hover:opacity-100"
          style={{
            background: 'conic-gradient(from 0deg, transparent, rgba(251, 191, 36, 0.3), transparent)',
            animation: 'rotate 4s linear infinite'
          }}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl ${accentColor} flex items-center justify-center mb-6 shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
          {icon}
        </div>
        
        {/* Title */}
        <h3 className="text-xl font-bold text-amber-50 mb-4 group-hover:text-amber-200 transition-colors duration-300">
          {title}
        </h3>
        
        {/* Description */}
        <p className="text-amber-200/60 leading-relaxed mb-6">
          {description}
        </p>
        
        {/* Learn more link */}
        <div className="flex items-center gap-2 text-amber-400 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <span className="text-sm font-semibold">Discover more</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </div>
  </div>
);

// Process step with animated connector
const ProcessStep = ({ step, title, description, icon, isLast = false, delay }: { 
  step: number; 
  title: string; 
  description: string; 
  icon: React.ReactNode;
  isLast?: boolean;
  delay: number;
}) => (
  <div 
    className="relative flex items-start gap-6 group"
    style={{ animation: `slideInLeft 0.6s ease-out forwards`, animationDelay: `${delay}s`, opacity: 0 }}
  >
    {/* Connector line */}
    {!isLast && (
      <div className="absolute left-7 top-20 w-0.5 h-24 bg-gradient-to-b from-amber-500/60 via-amber-500/30 to-transparent" />
    )}
    
    {/* Step indicator */}
    <div className="relative flex-shrink-0">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40 group-hover:shadow-amber-500/60 transition-shadow duration-300">
          {icon}
        </div>
        {/* Step number badge */}
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-950 border-2 border-amber-500 flex items-center justify-center">
          <span className="text-xs font-bold text-amber-400">{step}</span>
        </div>
        {/* Pulse ring */}
        <div className="absolute inset-0 rounded-2xl bg-amber-500/30 opacity-0 group-hover:opacity-100 group-hover:scale-150 transition-all duration-700" />
      </div>
    </div>
    
    {/* Content */}
    <div className="flex-1 pb-12">
      <h4 className="text-xl font-bold text-amber-50 mb-2 group-hover:text-amber-200 transition-colors duration-300">
        {title}
      </h4>
      <p className="text-amber-200/60 leading-relaxed max-w-md">
        {description}
      </p>
    </div>
  </div>
);

// Team member with hover effect
const TeamMember = ({ name, role, initials, delay }: { name: string; role: string; initials: string; delay: number }) => (
  <div 
    className="group relative"
    style={{ animation: `rise 0.8s ease-out forwards`, animationDelay: `${delay}s`, opacity: 0 }}
  >
    <Card3D>
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-950/80 to-amber-900/60 border border-amber-500/10 p-8 text-center transition-all duration-500 group-hover:border-amber-500/30">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Avatar */}
        <div className="relative w-28 h-28 mx-auto mb-6">
          <div className="w-full h-full rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30 group-hover:shadow-amber-500/50 transition-shadow duration-500">
            <span className="text-3xl font-black text-amber-950">{initials}</span>
          </div>
          {/* Animated ring */}
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/40 scale-100 group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all duration-700" />
          <div className="absolute inset-0 rounded-full border border-amber-500/20 scale-100 group-hover:scale-150 opacity-0 group-hover:opacity-60 transition-all duration-700" style={{ transitionDelay: '100ms' }} />
        </div>
        
        {/* Info */}
        <h4 className="text-lg font-bold text-amber-50 mb-1 group-hover:text-white transition-colors duration-300">{name}</h4>
        <p className="text-amber-400/80 text-sm font-medium mb-4">{role}</p>
        
        {/* Social links */}
        <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 hover:bg-amber-500/40 flex items-center justify-center cursor-pointer transition-colors duration-200">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500/20 hover:bg-amber-500/40 flex items-center justify-center cursor-pointer transition-colors duration-200">
            <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </div>
        </div>
      </div>
    </Card3D>
  </div>
);

const AboutPage = () => {
  const parallax = useMouseParallax(0.02);
  const navigate = useNavigate(); // 👈 Initialize navigation

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Morphing blobs */}
        <MorphingBlob 
          className="w-[700px] h-[700px] -top-40 -right-40" 
          color="radial-gradient(circle, rgba(251, 191, 36, 0.4) 0%, transparent 70%)"
        />
        <MorphingBlob 
          className="w-[600px] h-[600px] top-1/2 -left-40" 
          color="radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)"
        />
        <MorphingBlob 
          className="w-[500px] h-[500px] bottom-20 right-1/4" 
          color="radial-gradient(circle, rgba(217, 119, 6, 0.25) 0%, transparent 70%)"
        />
        
        {/* Floating rings */}
        <FloatingRing size={200} left="5%" top="20%" delay={0} />
        <FloatingRing size={150} left="80%" top="10%" delay={1} />
        <FloatingRing size={100} left="70%" top="60%" delay={2} />
        <FloatingRing size={180} left="15%" top="70%" delay={1.5} />
        
        {/* Glowing dots */}
        <GlowDot left="20%" top="30%" delay={0} />
        <GlowDot left="85%" top="25%" delay={0.5} />
        <GlowDot left="75%" top="75%" delay={1} />
        <GlowDot left="10%" top="85%" delay={1.5} />
        <GlowDot left="50%" top="15%" delay={2} />
        <GlowDot left="40%" top="65%" delay={2.5} />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(251, 191, 36, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(251, 191, 36, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            transform: `translate(${parallax.x}px, ${parallax.y}px)`
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-16">
        
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto text-center mb-32">
          {/* Floating badge */}
          <div 
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-amber-500/10 border border-amber-500/30 backdrop-blur-xl mb-10"
            style={{ animation: 'float 4s ease-in-out infinite' }}
          >
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div className="absolute inset-0 rounded-full bg-amber-400 animate-ping" />
            </div>
            <span className="text-amber-300 text-sm font-semibold tracking-widest uppercase">About Qezzy</span>
          </div>
          
          {/* Animated logo */}
          <div className="relative inline-block mb-10">
            <div 
              className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 rounded-full blur-3xl opacity-40"
              style={{ animation: 'pulse-glow 4s ease-in-out infinite' }}
            />
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/40">
              <span className="text-6xl font-black text-amber-950">Q</span>
            </div>
            {/* Orbiting elements */}
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  width: 160 + i * 30,
                  height: 160 + i * 30,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  animation: `spin ${20 + i * 5}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
                }}
              >
                <div 
                  className="absolute w-3 h-3 rounded-full bg-amber-400 shadow-lg shadow-amber-400/50"
                  style={{ top: 0, left: '50%', transform: 'translateX(-50%)' }}
                />
              </div>
            ))}
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
            <span className="block text-amber-100 mb-2">Empowering</span>
            <span className="block">
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">
                Kenyans
              </span>
              <span className="text-amber-100"> to </span>
              <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 bg-clip-text text-transparent">
                Thrive
              </span>
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-amber-200/70 max-w-3xl mx-auto mb-12 leading-relaxed">
            We're building the future of micro-earning in Kenya. Share your opinions, 
            complete simple surveys, and turn your time into real money.
          </p>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Start Earning Now Button */}
            <button 
              onClick={() => navigate('/login')}
              className="group relative px-10 py-5 rounded-2xl overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 text-amber-950 font-bold text-lg flex items-center gap-2">
                Start Earning Now
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>
            
            {/* Watch Story Button → also goes to /login per your request */}
            <button 
              onClick={() => navigate('/login')}
              className="group px-10 py-5 rounded-2xl border-2 border-amber-500/40 text-amber-300 font-bold text-lg hover:border-amber-500/80 hover:bg-amber-500/10 transition-all duration-300 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Story
              </span>
            </button>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-6xl mx-auto mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassStatCard 
              value={50000} 
              suffix="+" 
              label="Happy Users"
              delay={0.1}
              icon={<svg className="w-7 h-7 text-amber-950" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
            />
            <GlassStatCard 
              value={5} 
              suffix="M+" 
              label="KES Paid Out"
              delay={0.2}
              icon={<svg className="w-7 h-7 text-amber-950" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <GlassStatCard 
              value={200000} 
              suffix="+" 
              label="Surveys Done"
              delay={0.3}
              icon={<svg className="w-7 h-7 text-amber-950" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
            />
            <GlassStatCard 
              value={99} 
              suffix="%" 
              label="Satisfaction"
              delay={0.4}
              icon={<svg className="w-7 h-7 text-amber-950" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
            />
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-6xl mx-auto mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              <span className="text-amber-100">Why </span>
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">Qezzy</span>
              <span className="text-amber-100">?</span>
            </h2>
            <p className="text-xl text-amber-200/60 max-w-2xl mx-auto">
              We've built the most rewarding and user-friendly survey platform in Kenya
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <PremiumFeatureCard 
              icon={<svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              title="Lightning Fast Payouts"
              description="Get paid within minutes of approval. No waiting weeks for your money — instant M-Pesa transfers."
              accentColor="bg-gradient-to-br from-amber-500 to-orange-600"
              delay={0.1}
            />
            <PremiumFeatureCard 
              icon={<svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              title="Bank-Grade Security"
              description="Your data is protected with enterprise encryption. We never sell your information to third parties."
              accentColor="bg-gradient-to-br from-emerald-500 to-teal-600"
              delay={0.2}
            />
            <PremiumFeatureCard 
              icon={<svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              title="Daily Fresh Surveys"
              description="New surveys delivered every day. Never run out of earning opportunities tailored to your interests."
              accentColor="bg-gradient-to-br from-blue-500 to-indigo-600"
              delay={0.3}
            />
            <PremiumFeatureCard 
              icon={<svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>}
              title="Referral Rewards"
              description="Invite friends and earn bonus KES for each signup. Build your network, multiply your income."
              accentColor="bg-gradient-to-br from-purple-500 to-pink-600"
              delay={0.4}
            />
            <PremiumFeatureCard 
              icon={<svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>}
              title="Mobile First Design"
              description="Designed for your phone. Complete surveys anywhere, anytime with our optimized mobile experience."
              accentColor="bg-gradient-to-br from-cyan-500 to-blue-600"
              delay={0.5}
            />
            <PremiumFeatureCard 
              icon={<svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
              title="24/7 Support"
              description="Our dedicated team is always ready to help. Get answers fast via chat, email, or WhatsApp."
              accentColor="bg-gradient-to-br from-rose-500 to-red-600"
              delay={0.6}
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section className="max-w-4xl mx-auto mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              <span className="text-amber-100">How It </span>
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">Works</span>
            </h2>
            <p className="text-xl text-amber-200/60">
              Start earning in just three simple steps
            </p>
          </div>
          
          <div className="space-y-2">
            <ProcessStep 
              step={1}
              title="Create Your Free Account"
              description="Sign up in under a minute with just your phone number. No fees, no hidden charges — completely free to join."
              icon={<svg className="w-6 h-6 text-amber-950" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
              delay={0.1}
            />
            <ProcessStep 
              step={2}
              title="Complete Daily Surveys"
              description="Browse available surveys and complete them at your own pace. Each question earns you KES 10 — quick and simple."
              icon={<svg className="w-6 h-6 text-amber-950" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>}
              delay={0.2}
            />
            <ProcessStep 
              step={3}
              title="Get Paid Instantly"
              description="Once approved, your earnings hit your wallet immediately. Withdraw anytime directly to M-Pesa — no minimums."
              icon={<svg className="w-6 h-6 text-amber-950" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              isLast
              delay={0.3}
            />
          </div>
        </section>

        {/* Team Section */}
        <section className="max-w-5xl mx-auto mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-6">
              <span className="text-amber-100">Meet The </span>
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 bg-clip-text text-transparent">Team</span>
            </h2>
            <p className="text-xl text-amber-200/60">
              The passionate people building Qezzy
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <TeamMember name="Deuk Mose" role="Founder & CEO" initials="DM" delay={0.1} />
            <TeamMember name="Richard Kenagwa" role="Product Lead" initials="RK" delay={0.2} />
            <TeamMember name="David Omondi" role="Tech Lead" initials="DO" delay={0.3} />
            <TeamMember name="Grace Achieng" role="Community" initials="GA" delay={0.4} />
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(0,0,0,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(0,0,0,0.1) 0%, transparent 50%)'
              }}
            />
            <div 
              className="absolute inset-0"
              style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
              }}
            />
            
            {/* Content */}
            <div className="relative px-8 py-20 text-center">
              <h2 className="text-4xl md:text-6xl font-black text-amber-950 mb-6">
                Ready to Start Earning?
              </h2>
              <p className="text-xl text-amber-900/80 max-w-2xl mx-auto mb-10">
                Join over 50,000 Kenyans already earning with Qezzy. 
                Your opinions matter — let them pay your bills.
              </p>
              {/* Final CTA Button */}
              <button 
                onClick={() => navigate('/login')}
                className="group relative px-12 py-5 rounded-2xl bg-amber-950 text-amber-100 font-bold text-xl overflow-hidden shadow-2xl hover:shadow-amber-950/50 transition-shadow duration-300 cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Get Started Free
                  <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-900 to-amber-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes morph {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        
        @keyframes spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes rise {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes shine {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default AboutPage;