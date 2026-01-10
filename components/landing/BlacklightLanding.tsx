'use client';

import { ArrowRight, Shield, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NetworkGlobe, networkExampleData } from '../globe/globe.js';

export function BlacklightLanding() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const activeIndexRef = useRef(0);

  useEffect(() => {
    setMounted(true);

    // WebGL Support Check
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebGLSupported(false);
      return;
    }

    if (!canvasRef.current) return;

    // Network globe background.
    const networkGlobe = new NetworkGlobe(
      canvasRef.current.parentElement,
      () => canvasRef.current!,
      networkExampleData,
      true
    );

    let animationFrameId: number;
    const animate = () => {
      networkGlobe.render();
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      networkGlobe.unload(animationFrameId);
    };
  }, [mounted]);

  const steps = [
    {
      title: 'Install and run your node',
      subtext:
        "Pull the Blacklight verifier Docker image, run it to generate your node wallet, and register the node's wallet address.",
      image: '/images/step1.png',
    },
    {
      title: 'Stake NIL to your node',
      subtext:
        'Stake NIL to activate your node. The more you stake, the more verification work your node will be assigned.',
      image: '/images/step2.png',
    },
    {
      title: 'Monitor your node and rewards',
      subtext:
        'View the rewards your node has earned and monitor the verification work your node has performed.',
      image: '/images/step3.png',
    },
  ];

  const handleNext = () => {
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevious = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  const faqs = [
    {
      question: "What is the Blacklight Network?",
      answer: "..."
    },
    {
      question: "How do I run a verifier node?",
      answer: "..."
    },
    {
      question: "What are the hardware requirements?",
      answer: "..."
    },
    {
      question: "How are rewards calculated?",
      answer: "..."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  // Show loading state during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="blacklight-landing">
        <div style={{ minHeight: '100vh', backgroundColor: '#000000' }} />
      </div>
    );
  }

  return (
    <div
      id="scroll-container"
      className="blacklight-landing h-screen overflow-y-auto scroll-smooth"
    >
      <section
        className="relative h-screen w-full snap-start snap-alwaysshrink-0 overflow-hidden"
        style={{ backgroundColor: '#000000' }}
      >
        {/* Network globe visualization or fallback image. */}
        {webGLSupported ? (
          <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full pointer-events-auto"
            style={{
              display: 'block',
              width: '100vw',
              height: '100vh',
              minHeight: '700px',
              zIndex: 5,
            }}
          />
        ) : (
          <img
            src="/images/earth/earth-landing.png"
            alt="Blacklight Network"
            className="fixed inset-0 w-full h-full object-cover"
            style={{
              zIndex: 5,
              opacity: 0.8,
              // This creates a transparency gradient from top to bottom
              WebkitMaskImage:
                'linear-gradient(to bottom, black 60%, transparent 100%)',
              maskImage:
                'linear-gradient(to bottom, black 60%, transparent 100%)',
            }}
          />
        )}

        {/* Subtle gradient overlay */}
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(to bottom right, rgba(1, 1, 29, 0.3), transparent, rgba(65, 89, 246, 0.2))',
          }}
        />

        {/* Abstract blue dot pattern background */}
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="fixed top-0 right-0 w-full h-full">
            <svg
              className="w-full h-full"
              viewBox="0 0 1200 800"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="blueDot1" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#4159F6" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#4159F6" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="blueDot2" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#0000FF" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#0000FF" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="blueDot3" cx="50%" cy="50%">
                  <stop offset="0%" stopColor="#4159F6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#4159F6" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Curved wave pattern of dots */}
              {Array.from({ length: 120 }).map((_, i) => {
                const t = i / 120;
                const angle = t * Math.PI * 1.5;
                const radius = 250 + Math.sin(t * Math.PI * 4) * 80;
                const x = 1000 + Math.cos(angle) * radius;
                const y = 350 + Math.sin(angle) * radius;
                const size = 4 + Math.sin(t * Math.PI * 2) * 2;
                const opacity = 0.4 + Math.sin(t * Math.PI * 3) * 0.3;
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r={size}
                    fill="url(#blueDot1)"
                    opacity={opacity}
                  />
                );
              })}
              {/* Secondary layer */}
              {Array.from({ length: 80 }).map((_, i) => {
                const t = i / 80;
                const angle = t * Math.PI * 1.2 + 0.3;
                const radius = 200 + Math.cos(t * Math.PI * 3) * 60;
                const x = 950 + Math.cos(angle) * radius;
                const y = 400 + Math.sin(angle) * radius;
                const size = 3 + Math.cos(t * Math.PI * 2) * 1.5;
                const opacity = 0.3 + Math.cos(t * Math.PI * 2) * 0.2;
                return (
                  <circle
                    key={`layer2-${i}`}
                    cx={x}
                    cy={y}
                    r={size}
                    fill="url(#blueDot2)"
                    opacity={opacity}
                  />
                );
              })}
              {/* Tertiary scattered dots */}
              {Array.from({ length: 60 }).map((_, i) => {
                const x = 700 + (i % 15) * 35 + Math.sin(i) * 15;
                const y = 150 + Math.floor(i / 15) * 50 + Math.cos(i) * 20;
                const size = 2.5 + Math.sin(i * 0.5) * 1;
                const opacity = 0.25 + Math.sin(i * 0.3) * 0.15;
                return (
                  <circle
                    key={`scatter-${i}`}
                    cx={x}
                    cy={y}
                    r={size}
                    fill="url(#blueDot3)"
                    opacity={opacity}
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Logo in top left. */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-8 lg:left-12 z-10 pointer-events-none">
          <img
            src="/images/nillion-logo.png"
            alt="Nillion"
            className="h-5 sm:h-6 md:h-8 lg:h-10 w-auto"
            onError={(e) => {
              /* Image failed to load */
            }}
          />
        </div>

        {/* Main content */}
        <div className="relative z-10 min-h-screen flex flex-col justify-center pt-20 pb-12 sm:pt-28 sm:pb-16 md:pt-32 md:pb-20 lg:pt-40 pointer-events-none">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-32">
            <div className="pl-0 sm:pl-2 md:pl-4 lg:pl-12">
              {/* Nillion's Blacklight Network label */}
              <div
                className="text-sm sm:text-base md:text-lg lg:text-xl font-bold tracking-wider uppercase mb-3 sm:mb-2"
                style={{ color: '#F2F2FF' }}
              >
                Blacklight Network
              </div>

              {/* Main headline */}
              <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 xl:space-y-16">
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] sm:leading-[1.05] tracking-tight"
                  style={{ color: '#FFFFFF' }}
                >
                  <span className="block sm:inline">
                    Continuously{' '}
                    <span
                      className="text-transparent bg-clip-text"
                      style={{
                        backgroundImage:
                          'linear-gradient(to right, #4159F6, #0000FF, #FFFFFF)',
                      }}
                    >
                      verifying
                    </span>{' '}
                    as
                  </span>
                  <br className="hidden sm:block" />
                  <span className="block sm:inline">
                    you focus on what matters.
                  </span>
                </h1>

                {/* Subtext */}
                <p
                  className="text-sm sm:text-base md:text-lg leading-relaxed max-w-4xl pr-2 sm:pr-0"
                  style={{ color: '#F2F2FF' }}
                >
                  The Blacklight Network is a decentralised collection of
                  verifier nodes that continuously verify TEEs across multiple
                  operators.
                </p>

                {/* CTAs - Functional navigation */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 sm:pt-4 pointer-events-none select-none">
                  <button
                    onClick={() => router.push('/setup')}
                    className="group px-5 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 text-sm sm:text-base md:text-lg font-semibold rounded-none shadow-2xl transition-all hover:scale-105 border-0 w-full sm:w-auto select-none"
                    style={{
                      background: 'linear-gradient(to right, #4159F6, #0000FF)',
                      color: '#FFFFFF',
                      boxShadow: '0 25px 50px -12px rgba(65, 89, 246, 0.3)',
                      cursor: 'pointer',
                    }}
                    ref={(el) => {
                      if (el) {
                        el.style.setProperty(
                          'pointer-events',
                          'auto',
                          'important'
                        );
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'linear-gradient(to right, #0000FF, #4159F6)';
                      e.currentTarget.style.boxShadow =
                        '0 25px 50px -12px rgba(65, 89, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        'linear-gradient(to right, #4159F6, #0000FF)';
                      e.currentTarget.style.boxShadow =
                        '0 25px 50px -12px rgba(65, 89, 246, 0.3)';
                    }}
                  >
                    <span className="whitespace-normal sm:whitespace-nowrap">
                      Set up node and earn rewards
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1 flex-shrink-0 inline-block" />
                  </button>
                  <button
                    onClick={() => router.push('/workloads')}
                    className="group px-6 py-5 sm:px-8 sm:py-6 text-base sm:text-lg font-semibold rounded-none backdrop-blur-sm transition-all hover:scale-105 w-full sm:w-auto select-none"
                    style={{
                      border: '2px solid rgba(242, 242, 255, 0.2)',
                      backgroundColor: 'rgba(242, 242, 255, 0.05)',
                      color: '#FFFFFF',
                      cursor: 'pointer',
                    }}
                    ref={(el) => {
                      if (el) {
                        el.style.setProperty(
                          'pointer-events',
                          'auto',
                          'important'
                        );
                      }
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        'rgba(242, 242, 255, 0.1)';
                      e.currentTarget.style.borderColor =
                        'rgba(242, 242, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        'rgba(242, 242, 255, 0.05)';
                      e.currentTarget.style.borderColor =
                        'rgba(242, 242, 255, 0.2)';
                    }}
                  >
                    <Shield className="mr-2 h-4 w-4 sm:h-5 sm:w-5 inline-block" />
                    Verify your apps
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Logo carousel - full width, below CTAs */}
          <div
            className="relative z-10 py-4 sm:py-6 mt-8 sm:mt-10 md:mt-12 lg:mt-16 -mx-4 sm:-mx-6 lg:-mx-12 xl:-mx-20 2xl:-mx-32"
            style={{
              marginTop: '48px',
              borderTop: '1px solid rgba(242, 242, 255, 0.2)',
              borderBottom: '1px solid rgba(242, 242, 255, 0.2)',
            }}
          >
            <div className="relative w-full overflow-hidden">
              <div className="flex animate-scroll gap-8 sm:gap-12 md:gap-16 items-center">
                {/* Duplicate sets for seamless infinite loop */}
                {[...Array(4)].map((_, setIndex) => (
                  <div
                    key={setIndex}
                    className="flex gap-8 sm:gap-12 md:gap-16 items-center"
                  >
                    {/* PHALA Logo */}
                    <div className="flex-shrink-0 flex items-center justify-center h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 opacity-80 hover:opacity-100 transition-opacity">
                      <img
                        src="/images/phala-logo.png"
                        alt="PHALA"
                        className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                        style={{ maxWidth: '200px' }}
                        onError={(e) => {
                          // Image failed to load
                        }}
                      />
                    </div>

                    {/* Divider */}
                    <div
                      className="h-6 sm:h-7 md:h-8 w-px"
                      style={{ backgroundColor: 'rgba(242, 242, 255, 0.2)' }}
                    />

                    {/* AWS Logo */}
                    <div className="flex-shrink-0 flex items-center justify-center h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 opacity-80 hover:opacity-100 transition-opacity">
                      <img
                        src="/images/aws_logo.png"
                        alt="AWS"
                        className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                        style={{ maxWidth: '200px' }}
                        onError={(e) => {
                          // Image failed to load
                        }}
                      />
                    </div>

                    {/* Divider */}
                    <div
                      className="h-6 sm:h-7 md:h-8 w-px"
                      style={{ backgroundColor: 'rgba(242, 242, 255, 0.2)' }}
                    />

                    {/* Google Cloud Logo */}
                    <div className="flex-shrink-0 flex items-center justify-center h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 opacity-80 hover:opacity-100 transition-opacity">
                      <img
                        src="/images/gcp_logo.png"
                        alt="Google Cloud"
                        className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                        style={{ maxWidth: '200px' }}
                        onError={(e) => {
                          // Image failed to load
                        }}
                      />
                    </div>

                    {/* Divider */}
                    <div
                      className="h-6 sm:h-7 md:h-8 w-px"
                      style={{ backgroundColor: 'rgba(242, 242, 255, 0.2)' }}
                    />

                    {/* Azure Logo */}
                    <div className="flex-shrink-0 flex items-center justify-center h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 opacity-80 hover:opacity-100 transition-opacity">
                      <img
                        src="/images/azure_logo.png"
                        alt="Azure"
                        className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                        style={{ maxWidth: '200px' }}
                        onError={(e) => {
                          // Image failed to load
                        }}
                      />
                    </div>

                    {/* Divider */}
                    <div
                      className="h-6 sm:h-7 md:h-8 w-px"
                      style={{ backgroundColor: 'rgba(242, 242, 255, 0.2)' }}
                    />

                    {/* Secret Network Logo */}
                    <div className="flex-shrink-0 flex items-center justify-center h-12 sm:h-14 md:h-16 px-4 sm:px-6 md:px-8 opacity-80 hover:opacity-100 transition-opacity">
                      <img
                        src="/images/secret_network_logo.png"
                        alt="Secret Network"
                        className="h-8 sm:h-10 md:h-12 w-auto object-contain"
                        style={{ maxWidth: '200px' }}
                        onError={(e) => {
                          // Image failed to load
                        }}
                      />
                    </div>

                    {/* Divider */}
                    <div
                      className="h-6 sm:h-7 md:h-8 w-px"
                      style={{ backgroundColor: 'rgba(242, 242, 255, 0.2)' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative z-10 min-h-screen w-full snap-start snap-always flex-shrink-0 flex flex-col justify-center px-6"
        style={{
          backgroundColor: '#0D1235',
          opacity: 0.9,
          borderTop: '1px solid rgba(242, 242, 255, 0.2)'
        }}
      >
        {/* Running a node section - Carousel */}
        <div
          className="relative w-full pt-12 lg:pt-16 pb-12 lg:pb-16 overflow-hidden"
          style={{ backgroundColor: '#0D1235' }}
        >
          {/* Torch spotlight for Section 2 - From right side */}
          <div
            className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
            style={{ opacity: 0.5 }}
          >
            <div className="absolute inset-0" style={{ opacity: 0.5 }}>
              {/* Main cone beam */}
              <div
                className="absolute top-0"
                style={{
                  right: '15%',
                  width: '100%',
                  height: '100%',
                  // Modified background to fade in at the top and fade out at the bottom
                  background: `linear-gradient(to bottom, 
                    rgba(65, 89, 246, 0) 0%,
                    rgba(65, 89, 246, 0.3) 10%,
                    rgba(0, 0, 255, 0.22) 25%, 
                    rgba(65, 89, 246, 0.12) 50%, 
                    rgba(0, 0, 255, 0.04) 75%, 
                    rgba(65, 89, 246, 0.01) 90%,
                    rgba(65, 89, 246, 0) 100%
                  )`,
                  clipPath: 'polygon(48% 0%, 52% 0%, 95% 100%, 5% 100%)',
                  filter: 'blur(80px)',
                  transformOrigin: '50% 0%',
                  transform: 'rotate(-6deg)',
                }}
              />
              {/* Secondary beam layer */}
              <div
                className="absolute top-0"
                style={{
                  right: '15%',
                  width: '100%',
                  height: '90%',
                  background:
                    'linear-gradient(to bottom, rgba(65, 89, 246, 0.22) 0%, rgba(0, 0, 255, 0.18) 12%, rgba(65, 89, 246, 0.14) 25%, rgba(0, 0, 255, 0.1) 40%, rgba(65, 89, 246, 0.07) 55%, rgba(0, 0, 255, 0.04) 70%, rgba(65, 89, 246, 0.02) 85%, transparent 95%)',
                  clipPath: 'polygon(49% 0%, 51% 0%, 92% 100%, 8% 100%)',
                  filter: 'blur(40px)',
                  transformOrigin: '50% 0%',
                  transform: 'rotate(-6deg)',
                }}
              />
            </div>
          </div>

          <div className="relative z-10 w-full px-6 lg:px-12 xl:px-20 2xl:px-32">
            {/* Title at the top */}
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 lg:mb-6"
              style={{ color: '#FFFFFF' }}
            >
              Running a Blacklight Verifier Node
            </h2>

            {/* Intro Text */}
            <p
              className="text-lg md:text-xl leading-relaxed mb-6 lg:mb-8"
              style={{ color: '#F2F2FF' }}
            >
              Set up your node in 5 minutes and begin earning rewards.
            </p>

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start lg:items-center">
              {/* Left side - Active Step + Controls */}
              <div className="space-y-8 order-1 lg:order-1 -mt-4 lg:-mt-2">
                {/* Stage Indicator and Title Group */}
                <div className="space-y-1">
                  {/* Stage Indicator */}
                  <div
                    className="text-sm md:text-base font-semibold tracking-wider uppercase"
                    style={{ color: '#F2F2FF' }}
                  >
                    Stage {activeStep} of 3
                  </div>

                  {/* Active Step Title and Description */}
                  <div className="space-y-0">
                    <h3
                      className="text-2xl md:text-3xl font-bold mb-0"
                      style={{ color: '#FFFFFF' }}
                    >
                      {steps[activeStep - 1].title}
                    </h3>
                    <p
                      className="text-base md:text-lg leading-relaxed mt-0"
                      style={{ color: '#F2F2FF' }}
                    >
                      {steps[activeStep - 1].subtext}
                    </p>
                  </div>
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={handlePrevious}
                    disabled={activeStep === 1}
                    className="p-3 rounded-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      border: '2px solid rgba(242, 242, 255, 0.2)',
                      backgroundColor:
                        activeStep === 1
                          ? 'rgba(242, 242, 255, 0.05)'
                          : 'rgba(242, 242, 255, 0.1)',
                      color: '#FFFFFF',
                      cursor: activeStep === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={activeStep === 3}
                    className="p-3 rounded-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      border: '2px solid rgba(242, 242, 255, 0.2)',
                      backgroundColor:
                        activeStep === 3
                          ? 'rgba(242, 242, 255, 0.05)'
                          : 'rgba(242, 242, 255, 0.1)',
                      color: '#FFFFFF',
                      cursor: activeStep === 3 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                {/* CTA Button - Functional navigation */}
                <div className="pt-6">
                  <button
                    onClick={() => router.push('/setup')}
                    className="group px-5 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 text-sm sm:text-base md:text-lg font-semibold rounded-none shadow-2xl transition-all hover:scale-105 border-0 w-full"
                    style={{
                      background: 'linear-gradient(to right, #4159F6, #0000FF)',
                      color: '#FFFFFF',
                      boxShadow: '0 25px 50px -12px rgba(65, 89, 246, 0.3)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'linear-gradient(to right, #0000FF, #4159F6)';
                      e.currentTarget.style.boxShadow =
                        '0 25px 50px -12px rgba(65, 89, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        'linear-gradient(to right, #4159F6, #0000FF)';
                      e.currentTarget.style.boxShadow =
                        '0 25px 50px -12px rgba(65, 89, 246, 0.3)';
                    }}
                  >
                    <span className="whitespace-normal sm:whitespace-nowrap">
                      Set up node and earn rewards
                    </span>
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1 flex-shrink-0 inline-block" />
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div
                className="hidden lg:block absolute left-1/2 top-1/2 h-16 w-px -translate-x-1/2 -translate-y-1/2"
                style={{ opacity: 0.0 }}
              />

              {/* Right side - Screenshot */}
              <div className="hidden lg:flex relative h-[400px] lg:h-[450px] w-full order-1 lg:order-2 -mt-8 lg:-mt-0 items-center justify-center">
                {steps.map((step, index) => {
                  const imageSize = index < 2 ? '90%' : '100%';
                  const isActive = activeStep === index + 1;
                  return (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-500 ease-in-out flex items-center justify-center ${
                        isActive
                          ? 'opacity-100'
                          : 'opacity-0 pointer-events-none'
                      }`}
                      style={{
                        visibility: isActive ? 'visible' : 'hidden',
                        zIndex: isActive ? 10 : 0,
                      }}
                    >
                      <div
                        className="step-image-wrapper"
                        style={{
                          width: imageSize,
                          height: imageSize,
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'transparent',
                        }}
                      >
                        <img
                          src={step.image}
                          alt={step.title}
                          className="step-image-rounded"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            display: 'block',
                          }}
                          onError={(e) => {
                            // Image failed to load
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="z-10 relative min-h-screen w-full snap-start snap-always flex-shrink-0 flex flex-col justify-center"
        style={{
          backgroundColor: '#000022',
          opacity: 0.9,
          borderTop: '1px solid rgba(242, 242, 255, 0.2)'
        }}
      >
        {/* Section 3 - Verifying Many TEE Operators */}
        <div
          className="relative z-10 w-full pt-12 lg:pt-16 pb-20 lg:pb-32 overflow-hidden"
          style={{ backgroundColor: '#000022' }}
        >
          {/* Torch spotlight for Section 3 - From left side */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute inset-0">
              {/* Main cone beam. */}
              <div
                className="absolute top-0"
                style={{
                  left: '-10%', // Moved from 15% to -10% to shift left
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(to bottom,
                    rgba(65, 89, 246, 0) 0%,
                    rgba(65, 89, 246, 0) 10%,
                    rgba(65, 89, 246, 0.3) 25%,
                    rgba(0, 0, 255, 0.15) 50%,
                    rgba(65, 89, 246, 0) 75%,
                    rgba(65, 89, 246, 0) 100%
                  )`,
                  clipPath: 'polygon(48% 0%, 52% 0%, 95% 100%, 5% 100%)',
                  filter: 'blur(70px)',
                  transformOrigin: '50% 0%',
                  transform: 'rotate(8deg)', // Slightly increased rotation to sweep across the text
                  opacity: 0.7,
                }}
              />

              {/* Secondary beam layer. */}
              <div
                className="absolute top-0"
                style={{
                  left: '-10%',
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(to bottom,
                    rgba(65, 89, 246, 0) 0%,
                    rgba(65, 89, 246, 0) 15%,
                    rgba(65, 89, 246, 0.22) 30%,
                    rgba(0, 0, 255, 0.1) 45%,
                    rgba(65, 89, 246, 0) 65%,
                    rgba(65, 89, 246, 0) 100%
                  )`,
                  clipPath: 'polygon(49% 0%, 51% 0%, 92% 100%, 8% 100%)',
                  filter: 'blur(45px)',
                  transformOrigin: '50% 0%',
                  transform: 'rotate(8deg)', // Matches rotation
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
          <div className="relative z-10 w-full px-6 lg:px-12 xl:px-20 2xl:px-32">
            {/* Section Title and CTA */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12 lg:mb-16 max-w-7xl mx-auto gap-6">
              <h2
                className="text-4xl md:text-5xl lg:text-6xl font-bold"
                style={{ color: '#FFFFFF' }}
              >
                The Universal Verification Layer
              </h2>
              <div className="flex justify-start lg:justify-end">
                <button
                  onClick={() => router.push('/workloads')}
                  className="group px-8 py-6 text-lg font-semibold rounded-none shadow-2xl transition-all hover:scale-105 border-0"
                  style={{
                    background: 'linear-gradient(to right, #4159F6, #0000FF)',
                    color: '#FFFFFF',
                    boxShadow: '0 25px 50px -12px rgba(65, 89, 246, 0.3)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      'linear-gradient(to right, #0000FF, #4159F6)';
                    e.currentTarget.style.boxShadow =
                      '0 25px 50px -12px rgba(65, 89, 246, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      'linear-gradient(to right, #4159F6, #0000FF)';
                    e.currentTarget.style.boxShadow =
                      '0 25px 50px -12px rgba(65, 89, 246, 0.3)';
                  }}
                >
                  Verify your app
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 inline-block" />
                </button>
              </div>
            </div>

            {/* Three Card Layout - Context → Layer → Action */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-7xl mx-auto">
              {/* Card 1 - The Problem */}
              <div
                className="p-6 lg:p-8 rounded-none"
                style={{
                  backgroundColor: 'rgba(65, 89, 246, 0.05)',
                  border: '1px solid rgba(242, 242, 255, 0.1)',
                }}
              >
                <h3
                  className="text-sm md:text-base uppercase tracking-wider mb-4"
                  style={{ color: '#F2F2FF', opacity: 0.8 }}
                >
                  The problem
                </h3>
                <p
                  className="text-base md:text-lg leading-relaxed"
                  style={{ color: '#F2F2FF' }}
                >
                  TEEs are becoming commoditised and are used widely. But how
                  can they be held accountable for the workflows they are
                  continuously executing?
                </p>
              </div>

              {/* Card 2 - Blacklight's Solution */}
              <div
                className="p-6 lg:p-8 rounded-none"
                style={{
                  backgroundColor: 'rgba(65, 89, 246, 0.05)',
                  border: '1px solid rgba(242, 242, 255, 0.1)',
                }}
              >
                <h3
                  className="text-sm md:text-base uppercase tracking-wider mb-4"
                  style={{ color: '#F2F2FF', opacity: 0.8 }}
                >
                  Blacklight's solution
                </h3>
                <p
                  className="text-base md:text-lg leading-relaxed"
                  style={{ color: '#F2F2FF' }}
                >
                  Blacklight's decentralised network consists of nodes that
                  continuously verify attestations of TEEs, ensuring their
                  trustworthiness.
                </p>
              </div>

              {/* Card 3 - Verify Your Apps */}
              <div
                className="p-6 lg:p-8 rounded-none"
                style={{
                  backgroundColor: 'rgba(65, 89, 246, 0.05)',
                  border: '1px solid rgba(242, 242, 255, 0.1)',
                }}
              >
                <h3
                  className="text-sm md:text-base uppercase tracking-wider mb-4"
                  style={{ color: '#F2F2FF', opacity: 0.8 }}
                >
                  Verify your apps
                </h3>
                <p
                  className="text-base md:text-lg leading-relaxed mb-6"
                  style={{ color: '#F2F2FF' }}
                >
                  Verify your apps and workloads that rely on multiple TEE
                  providers by submitting them to the Blacklight Network.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => router.push('/workloads')}
                    className="group px-6 py-3 text-base font-semibold rounded-none shadow-xl transition-all hover:scale-105 border-0"
                    style={{
                      background: 'linear-gradient(to right, #4159F6, #0000FF)',
                      color: '#FFFFFF',
                      boxShadow: '0 15px 35px -10px rgba(65, 89, 246, 0.3)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'linear-gradient(to right, #0000FF, #4159F6)';
                      e.currentTarget.style.boxShadow =
                        '0 15px 35px -10px rgba(65, 89, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        'linear-gradient(to right, #4159F6, #0000FF)';
                      e.currentTarget.style.boxShadow =
                        '0 15px 35px -10px rgba(65, 89, 246, 0.3)';
                    }}
                  >
                    Verify your app
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 inline-block" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative min-h-screen w-full snap-start snap-always flex-shrink-0 flex flex-col justify-center"
        style={{
          backgroundColor: '#0D1235',
          borderTop: '1px solid rgba(242, 242, 255, 0.2)'
        }}
      >
        {/* FAQ Section */}
        <div className="relative z-10 w-full px-6 lg:px-12 xl:px-20 2xl:px-32">
          <div className="max-w-4xl mx-auto">
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 lg:mb-12 text-center"
              style={{ color: '#FFFFFF' }}
            >
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-none overflow-hidden"
                  style={{
                    backgroundColor: 'rgba(65, 89, 246, 0.05)',
                    border: '1px solid rgba(242, 242, 255, 0.1)'
                  }}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left transition-all hover:bg-opacity-10"
                    style={{
                      backgroundColor: openFaqIndex === index ? 'rgba(65, 89, 246, 0.1)' : 'transparent'
                    }}
                  >
                    <span
                      className="text-lg md:text-xl font-semibold pr-4"
                      style={{ color: '#FFFFFF' }}
                    >
                      {faq.question}
                    </span>
                    <ChevronDown
                      className="flex-shrink-0 transition-transform duration-300"
                      style={{
                        color: '#4159F6',
                        transform: openFaqIndex === index ? 'rotate(180deg)' : 'rotate(0deg)'
                      }}
                      size={24}
                    />
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300 ease-in-out"
                    style={{
                      maxHeight: openFaqIndex === index ? '500px' : '0px'
                    }}
                  >
                    <div
                      className="px-6 pb-5 pt-2 text-base md:text-lg leading-relaxed"
                      style={{ color: '#F2F2FF' }}
                    >
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative min-h-screen w-full snap-start snap-always flex-shrink-0 flex flex-col justify-center pointer-events-none"
        style={{
          backgroundColor: '#000022',
          borderTop: '1px solid rgba(242, 242, 255, 0.2)'
        }}
      >
        {/* Navigation Cards Section */}
        <div className="blacklight-nav-cards z-10">
          <div className="blacklight-nav-cards-container">
            <h2 className="blacklight-nav-cards-title">Get Started</h2>
            <div className="blacklight-nav-cards-grid">
              {/* Card 1: Node Dashboard */}
              <Link
                href="/nodes"
                className="blacklight-nav-card"
                ref={(el) => {
                  if (el) {
                    el.style.setProperty('pointer-events', 'auto', 'important');
                  }
                }}
              >
                <div className="blacklight-nav-card-title">Node Dashboard</div>
                <p className="blacklight-nav-card-description">
                  View and manage your staked operators and monitor their
                  performance.
                </p>
              </Link>

              {/* Card 2: Set up Node */}
              <Link
                href="/setup"
                className="blacklight-nav-card"
                ref={(el) => {
                  if (el) {
                    el.style.setProperty('pointer-events', 'auto', 'important');
                  }
                }}
              >
                <div className="blacklight-nav-card-title">Set up Node</div>
                <p className="blacklight-nav-card-description">
                  Configure a new verification node and start earning rewards.
                </p>
              </Link>

              {/* Card 3: Developers */}
              <Link
                href="/workloads"
                className="blacklight-nav-card blacklight-nav-card-full"
                ref={(el) => {
                  if (el) {
                    el.style.setProperty('pointer-events', 'auto', 'important');
                  }
                }}
              >
                <div className="blacklight-nav-card-header">
                  <div className="blacklight-nav-card-badge">NEW</div>
                  <div
                    className="blacklight-nav-card-title"
                    style={{ marginBottom: 0 }}
                  >
                    Submit TEE Workload
                  </div>
                </div>
                <p className="blacklight-nav-card-description">
                  For developers: Verify your apps and workloads running on TEE
                  providers.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
