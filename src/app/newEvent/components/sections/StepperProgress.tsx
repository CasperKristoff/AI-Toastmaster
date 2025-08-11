import React from "react";

export type StepType = {
  id: string;
  label: string;
  icon?: string;
};

interface StepperProgressProps {
  steps: StepType[];
  currentStep: string;
  onStepChange: (stepId: string) => void;
  className?: string;
}

export default function StepperProgress({
  steps,
  currentStep,
  onStepChange,
  className = "",
}: StepperProgressProps) {
  const activeIdx = steps.findIndex((step) => step.id === currentStep);

  // Define completion logic for each section
  const getStepStatus = (stepId: string) => {
    const stepIndex = steps.findIndex((step) => step.id === stepId);
    const activeIndex = steps.findIndex((step) => step.id === currentStep);
    if (stepIndex < activeIndex) return "completed";
    if (stepIndex === activeIndex) return "current";
    return "upcoming";
  };

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      <div
        className="relative w-full flex items-center justify-between"
        style={{ minHeight: "80px" }}
      >
        {/* Progress line background */}
        <div
          className="absolute left-0 right-0 h-2 bg-gray-200 rounded-full"
          style={{ top: "40px", transform: "translateY(-50%)" }}
        />
        {/* Progress fill */}
        <div
          className="absolute h-2 bg-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{
            top: "40px",
            left: 0,
            width: `calc(${(100 / (steps.length - 1)) * activeIdx}%)`,
            transform: "translateY(-50%)",
          }}
        />
        {/* Circles */}
        {steps.map((step) => {
          const status = getStepStatus(step.id);
          const isCompleted = status === "completed";
          const isCurrent = status === "current";
          return (
            <div
              key={step.id}
              className="flex flex-col items-center relative z-10"
              style={{ flex: 1 }}
            >
              <button
                onClick={() => onStepChange(step.id)}
                className={`flex items-center justify-center w-20 h-20 rounded-full border-2 transition-all duration-300 shadow-sm bg-white cursor-pointer group
                  ${
                    isCompleted
                      ? "border-blue-500 bg-blue-500 hover:shadow-lg hover:scale-105"
                      : isCurrent
                        ? "border-blue-500 bg-white hover:shadow-lg hover:scale-105"
                        : "border-gray-300 bg-white hover:border-blue-300 hover:shadow-md hover:scale-105"
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
                title={`Click to go to ${step.label}`}
              >
                {isCompleted && (
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {/* Hover indicator for non-completed steps */}
                {!isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg
                      className="w-4 h-4 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </button>
              <span
                className={`mt-3 text-base font-medium transition-all duration-300 text-center
                  ${
                    isCompleted
                      ? "text-blue-600"
                      : isCurrent
                        ? "text-blue-600 font-semibold"
                        : "text-gray-400 group-hover:text-gray-600"
                  }
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
