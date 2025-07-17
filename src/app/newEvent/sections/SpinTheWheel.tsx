import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import { Guest } from '../../../types/event';

interface SpinTheWheelProps {
  guests: Guest[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (challenge: string) => void;
}

// Colors for wheel segments
const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];

// Helper function to create wheel segments
const createWheelSegments = (guests: Guest[]) => {
  const segmentAngle = 360 / guests.length;
  const radius = 120;
  const centerX = 150;
  const centerY = 150;

  return guests.map((guest, index) => {
    const startAngle = index * segmentAngle;
    const endAngle = (index + 1) * segmentAngle;
    const midAngle = (startAngle + endAngle) / 2;
    
    // Convert angles to radians
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (endAngle - 90) * Math.PI / 180;
    
    // Calculate path for segment
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    
    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
    
    const path = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');

    // Calculate text position
    const textRadius = radius * 0.7;
    const textX = centerX + textRadius * Math.cos((midAngle - 90) * Math.PI / 180);
    const textY = centerY + textRadius * Math.sin((midAngle - 90) * Math.PI / 180);

    return {
      path,
      color: colors[index % colors.length],
      guest,
      textX,
      textY,
      rotation: midAngle
    };
  });
};

const SpinTheWheel: React.FC<SpinTheWheelProps> = ({ guests, isOpen, onClose, onSave }) => {
  const [challenge, setChallenge] = useState('');

  const handleSave = () => {
    onSave(challenge);
    setChallenge('');
  };

  const segments = createWheelSegments(guests);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Spin The Wheel">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-deep-sea mb-2">Challenge</label>
          <input
            type="text"
            value={challenge}
            onChange={e => setChallenge(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-dark-royalty/20 bg-white/50 focus:outline-none focus:ring-2 focus:ring-dark-royalty/50 focus:border-transparent transition-all duration-300"
            placeholder="Describe the challenge for the winner..."
          />
        </div>
        
        <div className="flex flex-col items-center">
          {/* Wheel */}
          <div className="relative">
            <svg width="300" height="300" className="mx-auto">
              {/* Wheel segments */}
              {segments.map((segment, index) => (
                <g key={index}>
                  <path
                    d={segment.path}
                    fill={segment.color}
                    stroke="#333"
                    strokeWidth="2"
                  />
                  <text
                    x={segment.textX}
                    y={segment.textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={segment.color === '#FFEAA7' || segment.color === '#96CEB4' ? '#333' : 'white'}
                    fontSize="12"
                    fontWeight="bold"
                    transform={`rotate(${segment.rotation}, ${segment.textX}, ${segment.textY})`}
                  >
                    {segment.guest.name}
                  </text>
                </g>
              ))}
              
              {/* Center circle */}
              <circle
                cx="150"
                cy="150"
                r="15"
                fill="white"
                stroke="#333"
                strokeWidth="2"
              />
            </svg>
            
            {/* Pointer */}
            <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
              <div className="w-0 h-0 border-l-[20px] border-l-gray-400 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent"></div>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="text-center mt-4 text-sm text-deep-sea/70">
            <p>Click to spin or press Ctrl+Enter</p>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t border-dark-royalty/10">
          <button
            onClick={handleSave}
            disabled={!challenge.trim()}
            className="px-6 py-3 bg-dark-royalty text-white rounded-xl hover:bg-dark-royalty/90 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Segment
          </button>
        </div>
      </div>
    </Modal>
  );
};

// Presentation Mode Component
interface SpinTheWheelPresentationProps {
  challenge: string;
  guests: Guest[];
  onSpin?: () => void;
}

export const SpinTheWheelPresentation: React.FC<SpinTheWheelPresentationProps> = ({ 
  challenge, 
  guests, 
  onSpin 
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Guest | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const spinWheel = () => {
    if (!guests || isSpinning) return;
    
    setIsSpinning(true);
    setWinner(null);
    
    // Random rotation (8-12 full spins + random segment)
    const spins = 8 + Math.random() * 4;
    const segmentAngle = 360 / guests.length;
    
    // Select a random winner
    const randomSegment = Math.floor(Math.random() * guests.length);
    
    // Calculate the angle needed to position the selected segment at the bottom
    // The bottom position is at 180 degrees (directly below the arrow)
    // We need to rotate the wheel so that the selected segment's center ends up at 180 degrees
    const segmentCenterAngle = randomSegment * segmentAngle + segmentAngle / 2;
    const targetAngle = 180; // Bottom position
    const finalAngle = spins * 360 + (targetAngle - segmentCenterAngle);
    
    // Apply spinning animation with CSS transition
    setRotation(finalAngle);
    
    // Stop spinning after 5 seconds and show winner
    setTimeout(() => {
      setIsSpinning(false);
      const selectedWinner = guests[randomSegment];
      setWinner(selectedWinner);
      setShowWinnerModal(true);
      if (onSpin) onSpin();
    }, 5000);
  };

  const segments = createWheelSegments(guests);

  return (
    <div className="mt-8 space-y-6">
      {/* Challenge Display */}
      <div className="bg-white/30 backdrop-blur-sm rounded-2xl p-8 border border-dark-royalty/20">
        <h3 className="text-2xl font-bold text-dark-royalty mb-4">Challenge:</h3>
        <p className="text-xl text-dark-royalty font-medium leading-relaxed">
          {challenge}
        </p>
      </div>

      {/* Wheel */}
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg 
            width="300" 
            height="300" 
            className="mx-auto"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 5s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
            }}
          >
            {/* Wheel segments */}
            {segments.map((segment, index) => (
              <g key={index}>
                <path
                  d={segment.path}
                  fill={segment.color}
                  stroke="#333"
                  strokeWidth="2"
                />
                <text
                  x={segment.textX}
                  y={segment.textY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={segment.color === '#FFEAA7' || segment.color === '#96CEB4' ? '#333' : 'white'}
                  fontSize="12"
                  fontWeight="bold"
                  transform={`rotate(${segment.rotation}, ${segment.textX}, ${segment.textY})`}
                >
                  {segment.guest.name}
                </text>
              </g>
            ))}
            
            {/* Center circle */}
            <circle
              cx="150"
              cy="150"
              r="15"
              fill="white"
              stroke="#333"
              strokeWidth="2"
            />
          </svg>
          
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
            <div className="w-0 h-0 border-t-[20px] border-t-gray-400 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent"></div>
          </div>
        </div>
        
        {/* Spin Button */}
        <button
          onClick={spinWheel}
          disabled={isSpinning}
          data-spin-wheel
          className={`px-8 py-4 rounded-xl transition-all duration-300 font-medium text-lg ${
            isSpinning
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:scale-105'
          }`}
        >
          {isSpinning ? 'Spinning...' : 'Spin The Wheel! (S)'}
        </button>
      </div>

      {/* Winner Modal */}
      {showWinnerModal && winner && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-dark-royalty/20 shadow-2xl text-center">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-3xl font-bold text-dark-royalty mb-2">The winner is...</h2>
            <h3 className="text-4xl font-bold text-purple-600 mb-6">{winner.name}</h3>
            <p className="text-lg text-deep-sea/70 mb-6">
              {challenge}
            </p>
            <button
              onClick={() => setShowWinnerModal(false)}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-medium"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpinTheWheel;
