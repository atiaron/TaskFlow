/**
 * Play a pleasant completion sound
 * Similar to the Google Tasks completion sound
 */
export const playCompletionSound = () => {
  try {
    // Create an audio context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    
    // Create oscillator
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Connect the nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Set parameters
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    
    // Fade in
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
    
    // Frequency change
    oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime + 0.1); // D5
    
    // Fade out
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    
    // Start and stop
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
    
    return true;
  } catch (error) {
    console.error('Error playing completion sound:', error);
    return false;
  }
};

/**
 * Play a deletion sound
 */
export const playDeleteSound = () => {
  try {
    // Create an audio context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    
    // Create oscillator
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Connect the nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // Set parameters
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(392.00, audioCtx.currentTime); // G4
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    
    // Fade in
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
    
    // Frequency change
    oscillator.frequency.linearRampToValueAtTime(294.33, audioCtx.currentTime + 0.2); // D4
    
    // Fade out
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
    
    // Start and stop
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
    
    return true;
  } catch (error) {
    console.error('Error playing delete sound:', error);
    return false;
  }
};