import React, { useState } from "react";
import { Event, EventSegment } from "../../../../types/event";
import PersonalFunfact from "../PersonalFunfact";
import SpinTheWheel from "../SpinTheWheel";
import SlideShow from "../SlideShow";
import Jeopardy from "../Jeopardy";
import Poll from "../Poll";
import LiveQuiz from "../LiveQuiz";
import Modal from "../../../../components/Modal";

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
  onAddSegment,
}) => {
  const [personalFunFacts, setPersonalFunFacts] = useState<
    Record<string, string>
  >({});
  const [showPersonalFunFactsModal, setShowPersonalFunFactsModal] =
    useState(false);
  const [showSpinTheWheelModal, setShowSpinTheWheelModal] = useState(false);
  const [showSlideShowModal, setShowSlideShowModal] = useState(false);
  const [showJeopardyModal, setShowJeopardyModal] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);

  const handleSavePersonalFacts = (funFacts: Record<string, string>) => {
    setPersonalFunFacts(funFacts);
    setShowPersonalFunFactsModal(false);
    onAddSegment({
      id: Date.now().toString(),
      title: "Personal Fun Facts",
      type: "game",
      description: "Guess who each fun fact belongs to!",
      duration: Object.keys(funFacts).length * 2,
      content: "Each fun fact will be shown individually.",
      order: 0,
      personalFunFacts: funFacts,
    });
    // Close the main AI segments modal and return to EventProgram
    onClose();
  };

  const handleSaveSpinTheWheel = (challenge: string) => {
    setShowSpinTheWheelModal(false);
    onAddSegment({
      id: Date.now().toString(),
      title: "Spin The Wheel",
      type: "game",
      description: challenge,
      duration: 5,
      content: `Challenge: ${challenge}`,
      order: 0,
      isCustom: true,
    });
    // Close the main AI segments modal and return to EventProgram
    onClose();
  };

  const handleSaveSlideShow = (segment: EventSegment) => {
    setShowSlideShowModal(false);
    onAddSegment(segment);
    // Close the main AI segments modal and return to EventProgram
    onClose();
  };

  const handleSaveJeopardy = (segment: EventSegment) => {
    setShowJeopardyModal(false);
    onAddSegment(segment);
    // Close the main AI segments modal and return to EventProgram
    onClose();
  };

  const handleSavePoll = (segment: EventSegment) => {
    setShowPollModal(false);
    onAddSegment(segment);
    // Close the main AI segments modal and return to EventProgram
    onClose();
  };

  const handleSaveQuiz = (segment: EventSegment) => {
    setShowQuizModal(false);
    onAddSegment(segment);
    // Close the main AI segments modal and return to EventProgram
    onClose();
  };

  const handleQuizUpdate = (updatedSegment: EventSegment) => {
    // This is called when the user clicks "Save Quiz & Close"
    handleSaveQuiz(updatedSegment);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="AI Recommended Segments">
        <div className="space-y-4">
          {event.guests.length === 0 ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-deep-sea/70 mb-2 text-base">
                No guests added yet
              </p>
              <p className="text-sm text-deep-sea/50">
                Add guests first to create personal fun facts
              </p>
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
                  <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="currentColor"
                      />
                      <path d="M12 2v20M12 2l-3 3M12 2l3 3" />
                      <circle cx="12" cy="12" r="3" fill="currentColor" />
                    </svg>
                  </div>
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
              <div
                className="group bg-gradient-to-br from-purple-100 to-pink-100 backdrop-blur-sm rounded-lg p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-300 hover:shadow-lg cursor-pointer"
                onClick={() => setShowSlideShowModal(true)}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    📸
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-dark-royalty mb-1">
                      Slide Show
                    </h3>
                    <p className="text-deep-sea/70 text-sm">
                      Upload photos for a beautiful slideshow
                    </p>
                  </div>
                  <div className="text-2xl text-deep-sea/40 group-hover:text-dark-royalty transition-colors">
                    ➕
                  </div>
                </div>
              </div>
              <div
                className="group bg-gradient-to-br from-blue-100 to-indigo-100 backdrop-blur-sm rounded-lg p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-300 hover:shadow-lg cursor-pointer"
                onClick={() => setShowJeopardyModal(true)}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    🎯
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-dark-royalty mb-1">
                      Jeopardy
                    </h3>
                    <p className="text-deep-sea/70 text-sm">
                      Create a quiz game with AI-generated questions
                    </p>
                  </div>
                  <div className="text-2xl text-deep-sea/40 group-hover:text-dark-royalty transition-colors">
                    ➕
                  </div>
                </div>
              </div>
              <div
                className="group bg-gradient-to-br from-green-100 to-teal-100 backdrop-blur-sm rounded-lg p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-300 hover:shadow-lg cursor-pointer"
                onClick={() => setShowPollModal(true)}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    📊
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-dark-royalty mb-1">
                      Live Poll
                    </h3>
                    <p className="text-deep-sea/70 text-sm">
                      Real-time voting with live results
                    </p>
                  </div>
                  <div className="text-2xl text-deep-sea/40 group-hover:text-dark-royalty transition-colors">
                    ➕
                  </div>
                </div>
              </div>
              <div
                className="group bg-gradient-to-br from-orange-100 to-red-100 backdrop-blur-sm rounded-lg p-6 border border-dark-royalty/10 hover:border-dark-royalty/30 transition-all duration-300 hover:shadow-lg cursor-pointer"
                onClick={() => setShowQuizModal(true)}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-3xl group-hover:scale-110 transition-transform duration-300">
                    🎯
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-dark-royalty mb-1">
                      Live Quiz
                    </h3>
                    <p className="text-deep-sea/70 text-sm">
                      Interactive quiz with real-time responses
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
      {/* Slide Show Modal - Rendered outside the AISegments modal */}
      <SlideShow
        event={event}
        isOpen={showSlideShowModal}
        onClose={() => setShowSlideShowModal(false)}
        onSave={handleSaveSlideShow}
      />
      {/* Jeopardy Modal - Rendered outside the AISegments modal */}
      <Jeopardy
        event={event}
        isOpen={showJeopardyModal}
        onClose={() => setShowJeopardyModal(false)}
        onSave={handleSaveJeopardy}
      />
      {/* Poll Modal - Rendered outside the AISegments modal */}
      <Modal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        title="Create Live Poll"
        onSave={() => {
          // The poll data will be saved through the Poll component's save button
          // This modal save is just a fallback
        }}
        saveDisabled={false}
      >
        <Poll
          segment={{
            id: Date.now().toString(),
            title: "Live Poll",
            type: "poll",
            description: "Real-time voting with live results",
            duration: 10,
            content: "Guests can vote via QR code or URL",
            order: 0,
            data: {
              question: "Who should take a shot?",
              options: ["Option 1", "Option 2", "Option 3"],
              showResultsLive: true,
              allowMultipleSelections: false,
              sessionCode: Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase(),
              votes: {},
              totalVotes: 0,
            },
          }}
          event={event}
          isEditMode={true}
          onUpdate={(updatedSegment) => {
            // Save the poll segment to the event program
            handleSavePoll(updatedSegment);
          }}
        />
      </Modal>

      {/* Quiz Modal - Rendered outside the AISegments modal */}
      <Modal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        title="Create Live Quiz"
        onSave={() => {
          // The quiz data will be saved through the LiveQuiz component's save button
          // This modal save is just a fallback
        }}
        saveDisabled={true}
      >
        <LiveQuiz
          segment={{
            id: Date.now().toString(),
            title: "Live Quiz",
            type: "quiz",
            description: "Interactive quiz with real-time responses",
            duration: 15,
            content: "Guests can join via QR code and answer questions",
            order: 0,
            data: {
              quizData: {
                sessionCode: Math.random()
                  .toString(36)
                  .substring(2, 8)
                  .toUpperCase(),
                questions: [
                  {
                    id: "1",
                    question: "How many counties are there in Norway?",
                    options: [
                      {
                        id: "a",
                        text: "10",
                        isCorrect: false,
                        color: "#FF6B6B",
                        icon: "▲",
                      },
                      {
                        id: "b",
                        text: "15",
                        isCorrect: true,
                        color: "#4ECDC4",
                        icon: "◆",
                      },
                      {
                        id: "c",
                        text: "13",
                        isCorrect: false,
                        color: "#FFE66D",
                        icon: "●",
                      },
                      {
                        id: "d",
                        text: "22",
                        isCorrect: false,
                        color: "#95E1D3",
                        icon: "■",
                      },
                    ],
                    timeLimit: 20,
                    pointType: "standard" as const,
                  },
                ],
                currentQuestionIndex: 0,
                isActive: false,
                responses: {},
                scores: {},
              },
            },
          }}
          event={event}
          isEditMode={true}
          isPresentation={false}
          onUpdate={(updatedSegment) => {
            // Save the quiz segment to the event program
            handleQuizUpdate(updatedSegment);
          }}
        />
      </Modal>
    </>
  );
};

export default AISegments;
