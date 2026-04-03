import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import type { RefObject } from "react";
import { PROVIDERS, type ProviderId } from "../../lib/llm";
import type { ProviderSettings } from "../../lib/app-types";

type SettingsModalProps = {
  isOpen: boolean;
  dialogRef: RefObject<HTMLDivElement | null>;
  settingsDraft: ProviderSettings;
  isDraftKeyVisible: boolean;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onReopenOnboarding: () => void;
  onToggleKeyVisibility: () => void;
  onDismissEscape: (
    event: Pick<ReactKeyboardEvent<HTMLElement>, "key" | "code">,
  ) => void;
  onSelectProvider: (providerId: ProviderId) => void;
  onChangeProviderKey: (providerId: ProviderId, value: string) => void;
  onRemoveProviderKey: (providerId: ProviderId) => void;
};

export function SettingsModal({
  isOpen,
  dialogRef,
  settingsDraft,
  isDraftKeyVisible,
  onClose,
  onSave,
  onReopenOnboarding,
  onToggleKeyVisibility,
  onDismissEscape,
  onSelectProvider,
  onChangeProviderKey,
  onRemoveProviderKey,
}: SettingsModalProps) {
  if (!isOpen) {
    return null;
  }

  const activeProvider = PROVIDERS.find(
    (provider) => provider.id === settingsDraft.activeProviderId,
  )!;
  const savedProviderCount = PROVIDERS.filter(
    (provider) => settingsDraft.providerKeys[provider.id].trim().length > 0,
  ).length;

  return (
    <div className="modal-backdrop" role="presentation">
      <div
        ref={dialogRef}
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        tabIndex={-1}
        onKeyDownCapture={onDismissEscape}
      >
        <div className="modal-scroll-content">
          <div className="panel-header">
            <div>
              <h2 id="settings-title">Settings</h2>
              <p className="panel-subtitle">
                Choose the active provider, keep keys local to this browser, and
                review app release notes.
              </p>
            </div>
            <span>{savedProviderCount} provider keys saved locally</span>
          </div>

          <form className="settings-form" onSubmit={onSave}>
            <div className="settings-provider-shell">
              <div className="settings-provider-nav" role="radiogroup" aria-label="Provider">
                {PROVIDERS.map((provider) => {
                  const hasKey =
                    settingsDraft.providerKeys[provider.id].trim().length > 0;

                  return (
                    <button
                      key={provider.id}
                      type="button"
                      className={`provider-nav-card${
                        settingsDraft.activeProviderId === provider.id
                          ? " is-active"
                          : ""
                      }`}
                      role="radio"
                      aria-label={provider.label}
                      aria-checked={settingsDraft.activeProviderId === provider.id}
                      onClick={() => {
                        onSelectProvider(provider.id);
                      }}
                    >
                      <span className="provider-nav-label">{provider.label}</span>
                      <span className="provider-nav-copy">
                        {provider.description}
                      </span>
                      <span className="provider-nav-status">
                        {hasKey ? "Key saved locally" : "No key saved"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="settings-provider-detail">
                <div className="settings-provider-detail-header">
                  <div>
                    <h3>{activeProvider.label}</h3>
                    <p>{activeProvider.description}</p>
                  </div>
                  <span
                    className={`provider-status-pill${
                      settingsDraft.providerKeys[activeProvider.id].trim().length > 0
                        ? " is-ready"
                        : ""
                    }`}
                  >
                    {settingsDraft.providerKeys[activeProvider.id].trim().length > 0
                      ? "Ready on this device"
                      : "Needs a local key"}
                  </span>
                </div>

                <div className="settings-provider-detail-body">
                  <label className="settings-field" htmlFor="provider-key">
                    {activeProvider.keyLabel}
                  </label>
                  <div className="settings-key-row">
                    <input
                      id="provider-key"
                      className="settings-input"
                      type={isDraftKeyVisible ? "text" : "password"}
                      value={settingsDraft.providerKeys[activeProvider.id]}
                      onChange={(event) => {
                        onChangeProviderKey(activeProvider.id, event.target.value);
                      }}
                      placeholder={activeProvider.keyPlaceholder}
                      autoComplete="off"
                      onKeyDown={onDismissEscape}
                    />
                    <button type="button" onClick={onToggleKeyVisibility}>
                      {isDraftKeyVisible ? "Hide" : "Reveal"}
                    </button>
                  </div>
                  <p className="settings-help">
                    Keys stay on this device in local browser storage. You can keep
                    multiple provider keys and switch the active provider without
                    losing the others.
                  </p>
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <div className="settings-actions-left">
                <button
                  type="button"
                  onClick={() => {
                    onRemoveProviderKey(activeProvider.id);
                  }}
                >
                  Remove key
                </button>
                <button type="button" onClick={onReopenOnboarding}>
                  Reopen onboarding
                </button>
              </div>
              <div className="settings-actions-right">
                <button type="button" onClick={onClose}>
                  Close
                </button>
                <button className="button-primary" type="submit">
                  Save settings
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
