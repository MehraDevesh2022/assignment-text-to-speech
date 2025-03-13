// App.jsx
import React, { useState, useRef } from 'react';
import './App.css';
import {  FaPlay, FaStop } from 'react-icons/fa';
import { VscAzure } from "react-icons/vsc";
import { SiHuggingface } from 'react-icons/si';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeModel, setActiveModel] = useState('azure'); // 'azure' or 'huggingface'
  const audioRef = useRef(null);

  const handleTextChange = (e) => {
    setText(e.target.value);
  }; 

  const handleModelSwitch = (model) => {
    setActiveModel(model);
  };

  const handleListen = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, model: activeModel }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to convert text to speech');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to convert text to speech. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.2 } }
  };

  const waveVariants = {
    initial: { scaleY: 0.1, opacity: 0.3 },
    animate: index => ({
      scaleY: [0.2, 1, 0.2],
      opacity: [0.4, 1, 0.4],
      transition: {
        duration: 1,
        repeat: Infinity,
        delay: index * 0.1,
        ease: "easeInOut"
      }
    })
  };

  return (
    <motion.div 
      className="app-wrapper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="app-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="app-header glass-effect" variants={itemVariants}>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            AI Voice Generator
          </motion.h1>
          <motion.div className="model-selector" variants={itemVariants}>
            <motion.button 
              className={`model-button glass-button ${activeModel === 'azure' ? 'active' : ''}`}
              onClick={() => handleModelSwitch('azure')}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <VscAzure /> Azure TTS
            </motion.button>
            <motion.button 
              className={`model-button glass-button ${activeModel === 'huggingface' ? 'active' : ''}`}
              onClick={() => handleModelSwitch('huggingface')}
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <SiHuggingface /> Hugging Face TTS
            </motion.button>
          </motion.div>
        </motion.div>

        <motion.div className="content-area" variants={itemVariants}>
          <motion.div 
            className="text-input-container glass-effect"
            variants={itemVariants}
          >
            <motion.textarea 
              value={text} 
              onChange={handleTextChange} 
              placeholder="Enter text to convert to speech..."
              rows={6}
              className="modern-textarea"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            />
            <AnimatePresence>
              {activeModel === 'huggingface' && text && (
                <motion.div 
                  className="animated-wave"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="wave-container">
                    {[...Array(5)].map((_, i) => (
                      <motion.div 
                        key={i}
                        className="wave-bar"
                        custom={i}
                        variants={waveVariants}
                        initial="initial"
                        animate="animate"
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div className="controls" variants={itemVariants}>
            <AnimatePresence mode="wait">
              {!isPlaying ? (
                <motion.button 
                  key="listen"
                  className="control-button listen-button glass-button"
                  onClick={handleListen}
                  disabled={!text.trim() || loading}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {loading ? (
                    <span className="loading-text">
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        Processing...
                      </motion.span>
                    </span>
                  ) : (
                    <>
                      <FaPlay /> Listen
                    </>
                  )}
                </motion.button>
              ) : (
                <motion.button 
                  key="stop"
                  className="control-button stop-button glass-button"
                  onClick={handleStop}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <FaStop /> Stop
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      </motion.div>
    </motion.div>
  );
}

export default App;