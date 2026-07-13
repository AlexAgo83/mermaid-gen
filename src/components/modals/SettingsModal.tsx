import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import type { RefObject } from "react";
import "./modal-shared.css";
import "./SettingsModal.css";
import { PROVIDERS, type ProviderId } from "@/lib/llm";
import type { ProviderSettings } from "@/lib/app-types";
import { getNextWrappedRadioValue } from "@/lib/radio-group";
import { t } from "@/i18n";

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
  const providerIds = PROVIDERS.map((provider) => provider.id);

  const handleProviderKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    providerId: ProviderId,
  ) => {
    onDismissEscape(event);

    const nextProviderId = getNextWrappedRadioValue(
      providerIds,
      providerId,
      event.key,
    );

    if (!nextProviderId) {
      return;
    }

    event.preventDefault();
    onSelectProvider(nextProviderId);
    event.currentTarget
      .closest('[role="radiogroup"]')
      ?.querySelector<HTMLButtonElement>(
        `[data-radio-value="${String(nextProviderId)}"]`,
      )
      ?.focus();
  };

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
              <h2 id="settings-title">{t("settings.title")}</h2>
              <p className="panel-subtitle">{t("settings.subtitle")}</p>
            </div>
            <span>
              {t(
                savedProviderCount === 1
                  ? "settings.savedKeyCount.one"
                  : "settings.savedKeyCount.other",
                { count: savedProviderCount },
              )}
            </span>
          </div>

          <form className="settings-form" onSubmit={onSave}>
            <div className="settings-provider-shell">
              <div
                className="settings-provider-nav"
                role="radiogroup"
                aria-label={t("settings.providerGroup")}
              >
                {PROVIDERS.map((provider) => {
                  const hasKey =
                    settingsDraft.providerKeys[provider.id].trim().length > 0;

                  return (
                    <button
                      key={provider.id}
                      type="button"
                      data-radio-value={provider.id}
                      className={`provider-nav-card${
                        settingsDraft.activeProviderId === provider.id
                          ? " is-active"
                          : ""
                      }`}
                      role="radio"
                      aria-label={provider.label}
                      aria-checked={
                        settingsDraft.activeProviderId === provider.id
                      }
                      tabIndex={
                        settingsDraft.activeProviderId === provider.id ? 0 : -1
                      }
                      onClick={() => {
                        onSelectProvider(provider.id);
                      }}
                      onKeyDown={(event) => {
                        handleProviderKeyDown(event, provider.id);
                      }}
                    >
                      <span className="provider-nav-label">
                        {provider.label}
                      </span>
                      <span className="provider-nav-copy">
                        {provider.description}
                      </span>
                      <span className="provider-nav-status">
                        {hasKey
                          ? t("settings.keySaved")
                          : t("settings.keyMissing")}
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
                      settingsDraft.providerKeys[activeProvider.id].trim()
                        .length > 0
                        ? " is-ready"
                        : ""
                    }`}
                  >
                    {settingsDraft.providerKeys[activeProvider.id].trim()
                      .length > 0
                      ? t("settings.providerReady")
                      : t("settings.providerNeedsKey")}
                  </span>
                </div>

                <div className="settings-provider-detail-body">
                  {activeProvider.id === "anthropic" ? (
                    <p className="settings-provider-warning" role="alert">
                      {t("settings.browserWarning")}
                    </p>
                  ) : null}
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
                        onChangeProviderKey(
                          activeProvider.id,
                          event.target.value,
                        );
                      }}
                      placeholder={activeProvider.keyPlaceholder}
                      autoComplete="off"
                      onKeyDown={onDismissEscape}
                    />
                    <button type="button" onClick={onToggleKeyVisibility}>
                      {isDraftKeyVisible
                        ? t("settings.hideKey")
                        : t("settings.revealKey")}
                    </button>
                  </div>
                  <p className="settings-help">
                    {t("settings.keyStorageHelp")}
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
                  {t("settings.removeKey")}
                </button>
                <button type="button" onClick={onReopenOnboarding}>
                  {t("settings.reopenOnboarding")}
                </button>
              </div>
              <div className="settings-actions-right">
                <button type="button" onClick={onClose}>
                  {t("common.close")}
                </button>
                <button className="button-primary" type="submit">
                  {t("common.save")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
