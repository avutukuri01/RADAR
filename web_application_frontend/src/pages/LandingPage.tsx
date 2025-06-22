import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  Radar, 
  Stethoscope, 
  Brain, 
  CheckCircle2, 
  Upload, 
  Edit3, 
  SplitSquareVertical, 
  Fingerprint,
  ArrowRight,
  Shield,
  Zap,
  MousePointerClick,
  Activity,
  HeartPulse,
  Microscope,
  Waves
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  // Floating animation variants
  const floatingAnimation = {
    initial: { y: 0 },
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Pulse animation variants
  const pulseAnimation = {
    initial: { scale: 1, opacity: 0.5 },
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 0.8, 0.5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Background shapes animation
  const shapes = Array(6).fill(null).map((_, i) => ({
    icon: [Activity, HeartPulse, Microscope, Waves][i % 4],
    position: `translate(${Math.random() * 100}%, ${Math.random() * 100}%)`,
    delay: i * 0.2
  }));

  const features = [
    {
      icon: <Stethoscope className="w-6 h-6" />,
      title: "Precise Annotation Tools",
      description: "Draw, edit, and manage bounding boxes with intuitive controls for accurate medical annotations."
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Recommendations",
      description: "Get intelligent suggestions for potential abnormalities you might have missed."
    },
    {
      icon: <CheckCircle2 className="w-6 h-6" />,
      title: "Interactive Review",
      description: "Accept or reject AI recommendations with a simple click in a split-view interface."
    }
  ];

  const workflowSteps = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: "Upload CXR Images",
      description: "Easily upload your chest X-ray images with our intuitive interface."
    },
    {
      icon: <Edit3 className="w-8 h-8" />,
      title: "Create Annotations",
      description: "Draw precise bounding boxes and add labels to mark regions of interest."
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Get AI Insights",
      description: "Receive intelligent recommendations for potential findings you might have missed."
    },
    {
      icon: <SplitSquareVertical className="w-8 h-8" />,
      title: "Review Side-by-Side",
      description: "Compare your annotations with AI suggestions in a split-view interface."
    }
  ];

  const benefits = [
    {
      icon: <Zap className="w-12 h-12 text-yellow-500" />,
      title: "Enhanced Efficiency",
      description: "Speed up your workflow with AI-assisted annotations and quick review tools."
    },
    {
      icon: <Shield className="w-12 h-12 text-green-500" />,
      title: "Improved Accuracy",
      description: "Reduce the chance of missed findings with AI-powered second opinions."
    },
    {
      icon: <MousePointerClick className="w-12 h-12 text-blue-500" />,
      title: "User-Friendly Interface",
      description: "Intuitive tools and controls designed for medical professionals."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm fixed w-full z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Radar className="h-8 w-8 text-blue-600" />
            </motion.div>
            <span className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
              RADAR
            </span>
          </div>
          <motion.button
            onClick={() => navigate('/app')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold
                     flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>Launch App</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </nav>
      </header>

      <main className="pt-16">
        {/* Enhanced Hero Section */}
        <motion.div 
          style={{ opacity, scale }}
          className="relative h-screen flex items-center justify-center overflow-hidden"
        >
          {/* Animated background shapes */}
          {shapes.map((shape, index) => (
            <motion.div
              key={index}
              className="absolute opacity-5"
              style={{ transform: shape.position }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 0.05, scale: 1 }}
              transition={{ delay: shape.delay, duration: 1 }}
            >
              {React.createElement(shape.icon, { size: 100 })}
            </motion.div>
          ))}

          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" />

          {/* Floating circles */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-blue-200 opacity-20 blur-xl"
            variants={floatingAnimation}
            initial="initial"
            animate="animate"
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-purple-200 opacity-20 blur-xl"
            variants={floatingAnimation}
            initial="initial"
            animate="animate"
          />

          {/* Pulsing ring */}
          <motion.div
            className="absolute w-[800px] h-[800px] border-2 border-blue-200 rounded-full"
            variants={pulseAnimation}
            initial="initial"
            animate="animate"
          />

          {/* Content */}
          <div className="relative text-center px-4 sm:px-6 lg:px-8 z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="mb-8"
            >
              <motion.div 
                className="flex justify-center items-center mb-6"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-full blur-lg opacity-20" />
                  <Radar className="h-16 w-16 text-blue-600 relative" />
                </div>
              </motion.div>
              <h1 className="text-5xl sm:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">
                AI-Based Radiology Companion System
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-xl text-gray-600 max-w-2xl mx-auto mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Enhance your radiological workflow with AI-assisted annotations and intelligent recommendations.
            </motion.p>

            <motion.button
              onClick={() => navigate('/app')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold
                       hover:shadow-lg transform hover:scale-105 transition-all duration-200
                       flex items-center space-x-2 mx-auto relative overflow-hidden group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <span className="relative z-10">Launch Application</span>
              <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.button>
          </div>
        </motion.div>

        {/* Key Features Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Powerful tools designed to enhance your radiological workflow
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-gray-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-blue-600 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section className="py-24 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                A streamlined workflow that combines human expertise with AI assistance
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {workflowSteps.map((step, index) => (
                <motion.div
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="text-blue-600 mb-4">{step.icon}</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                  {index < workflowSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                      <ArrowRight className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose RADAR</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Experience the benefits of AI-assisted radiology
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                >
                  <div className="mb-6 flex justify-center">{benefit.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-blue-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
                Experience the future of radiological analysis with RADAR's advanced tools and AI assistance.
              </p>
              <motion.button
                onClick={() => navigate('/app')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold
                         hover:shadow-lg transform hover:scale-105 transition-all duration-200
                         flex items-center space-x-2 mx-auto relative overflow-hidden group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="relative z-10">Launch Application</span>
                <ArrowRight className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </motion.button>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            © 2024 RADAR. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}