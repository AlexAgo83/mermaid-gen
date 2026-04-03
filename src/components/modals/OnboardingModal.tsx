import { ONBOARDING_STEPS } from "@/lib/onboarding";

type OnboardingModalProps = {
  isOpen: boolean;
  onboardingStep: number;
  onSkip: () => void;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => void;
};

export function OnboardingModal({
  isOpen,
  onboardingStep,
  onSkip,
  onBack,
  onNext,
  onFinish,
}: OnboardingModalProps) {
  if (!isOpen) {
    return null;
  }

  const step = ONBOARDING_STEPS[onboardingStep];

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        className="settings-modal onboarding-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <div className="modal-scroll-content modal-scroll-content-onboarding">
          <div className="onboarding-kicker">
            Step {onboardingStep + 1} of {ONBOARDING_STEPS.length}
          </div>
          <div className="panel-header">
            <div>
              <h2 id="onboarding-title">{step.title}</h2>
              <p className="panel-subtitle">{step.body}</p>
            </div>
          </div>
          <p className="onboarding-detail">{step.detail}</p>
          <div className="settings-actions">
            <button type="button" onClick={onSkip}>
              Skip
            </button>
            <div className="settings-actions-right">
              {onboardingStep > 0 ? (
                <button type="button" onClick={onBack}>
                  Back
                </button>
              ) : null}
              {onboardingStep < ONBOARDING_STEPS.length - 1 ? (
                <button className="button-primary" type="button" onClick={onNext}>
                  Next
                </button>
              ) : (
                <button className="button-primary" type="button" onClick={onFinish}>
                  Finish
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
