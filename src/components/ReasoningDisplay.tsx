import React, { useState } from 'react';
import { ReasoningStep } from '../types';
import './ReasoningDisplay.css';

interface ReasoningDisplayProps {
  reasoning: ReasoningStep[];
  isVisible?: boolean;
}

export const ReasoningDisplay: React.FC<ReasoningDisplayProps> = ({ 
  reasoning, 
  isVisible = false 
}) => {
  const [expanded, setExpanded] = useState(isVisible);

  if (!reasoning || reasoning.length === 0) {
    return null;
  }

  return (
    <div className="reasoning-display">
      <div className="reasoning-header">
        <button
          onClick={() => setExpanded(!expanded)}
          className="reasoning-toggle"
        >
          🧠 איך אני חושב ({reasoning.length} שלבים)
          <span className={`arrow ${expanded ? 'expanded' : ''}`}>▼</span>
        </button>
      </div>
      
      {expanded && (
        <div className="reasoning-content">
          {reasoning.map((step, index) => (
            <div key={index} className="reasoning-step">
              <div className="step-header">
                <span className="step-type">{step.type}</span>
                {step.timestamp && (
                  <span className="step-time">
                    {step.timestamp.toLocaleTimeString('he-IL', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
              </div>
              <div className="step-content">
                <div className="step-main">{step.content}</div>
                <div className="step-reasoning">{step.reasoning}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReasoningDisplay;
