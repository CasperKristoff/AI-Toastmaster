import React, { useState } from 'react';
import { Event, EventSegment } from '../../../types/event';
import PersonalFunfact from './PersonalFunfact';
import SpinTheWheel from './SpinTheWheel';
import Modal from '../../../components/Modal';

interface AISegmentsProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onAddSegment: (segment: EventSegment) => void;
}

const AISegments: React.FC<AISegmentsProps> = ({
  event,
  isOpen,
  onClose,
  onAddSegment
}) => {
  const [personalFunFacts, setPersonalFunFacts] = useState<Record<string, string>>({});
  const [showPersonalFunFactsModal, setShowPersonalFunFactsModal] = useState(false);
  const [showSpinTheWheelModal, setShowSpinTheWheelModal] = useState(false);

  const handleSavePersonalFacts = (funFacts: Record<string, string>) => {
    setPersonalFunFacts(funFacts);
    setShowPersonalFunFactsModal(false);
    onAddSegment({
      id: Date.now().toString(),
      title: 'Personal Fun Facts',
      type: 'game',
      description: 'Guess who each fun fact belongs to!',
      duration: Object.keys(funFacts).length * 2,
      content: 'Each fun fact will be shown individually.',
      order: 0,
      personalFunFacts: funFacts,
    });
  };

  const handleSaveSpinTheWheel = (challenge: string) => {
    setShowSpinTheWheelModal(false);
    onAddSegment({
      id: Date.now().toString(),
      title: 'Spin The Wheel',
      type: 'game',
      description: challenge,
      duration: 5,
      content: `Challenge: ${challenge}`,
      order: 0,
      isCustom: true,
    });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="AI Recommended Segments">
        <div className="space-y-4">
          {event.guests.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-deep-sea/70 mb-2 text-base">No guests added yet</p>
              <p className="text-sm text-deep-sea/50">Add guests first to create personal fun facts</p>
            </div>
          ) : (
            <>
              <div 
                className="group bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm rounded-lg p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-300 hover:shadow-lg cursor-pointer"
                onClick={() => setShowPersonalFunFactsModal(true)}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    👥
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-dark-royalty mb-1">
                      Personal Fun Facts
                    </h3>
                    <p className="text-deep-sea/70 text-sm">
                      Add fun facts about each guest for guessing games
                    </p>
                  </div>
                  <div className="text-2xl text-deep-sea/40 group-hover:text-dark-royalty transition-colors">
                    ➕
                  </div>
                </div>
              </div>
              <div
                className="group bg-gradient-to-br from-yellow-100 to-green-100 backdrop-blur-sm rounded-lg p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-300 hover:shadow-lg cursor-pointer"
                onClick={() => setShowSpinTheWheelModal(true)}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform duration-300">🎡</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-dark-royalty mb-1">
                      Spin The Wheel
                    </h3>
                    <p className="text-deep-sea/70 text-sm">
                      Randomly select a guest for a challenge
                    </p>
                  </div>
                  <div className="text-2xl text-deep-sea/40 group-hover:text-dark-royalty transition-colors">
                    ➕
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Personal Fun Facts Modal - Rendered outside the AISegments modal */}
      <PersonalFunfact
        guests={event.guests}
        funFacts={personalFunFacts}
        onFunFactsChange={handleSavePersonalFacts}
        isEditable={true}
        isModal={true}
        isOpen={showPersonalFunFactsModal}
        onClose={() => setShowPersonalFunFactsModal(false)}
      />
      {/* Spin The Wheel Modal - Rendered outside the AISegments modal */}
      <SpinTheWheel
        guests={event.guests}
        isOpen={showSpinTheWheelModal}
        onClose={() => setShowSpinTheWheelModal(false)}
        onSave={handleSaveSpinTheWheel}
      />
    </>
  );
};

export default AISegments; 