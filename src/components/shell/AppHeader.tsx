import type { ReactNode } from "react";
import "./AppHeader.css";
import {
  BurgerIcon,
  ChangelogIcon,
  ExportIcon,
  FitIcon,
  FocusIcon,
  ResetIcon,
  SettingsIcon,
} from "@/components/icons";
import { t } from "@/i18n";

type ActionButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  emphasis?: "default" | "primary";
  variant?: "topbar" | "mobile-menu";
  children: ReactNode;
};

function ActionButton({
  label,
  onClick,
  disabled = false,
  active = false,
  emphasis = "default",
  variant = "topbar",
  children,
}: ActionButtonProps) {
  if (variant === "mobile-menu") {
    return (
      <button
        type="button"
        className={`mobile-menu-action${
          emphasis === "primary" ? " is-primary" : ""
        }${active ? " is-active" : ""}`}
        onClick={onClick}
        disabled={disabled}
      >
        <span className="mobile-menu-action-icon" aria-hidden="true">
          {children}
        </span>
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div className="topbar-action-item">
      <button
        type="button"
        className={`topbar-icon-button${
          emphasis === "primary" ? " is-primary" : ""
        }${active ? " is-active" : ""}`}
        aria-label={label}
        onClick={onClick}
        disabled={disabled}
      >
        {children}
      </button>
      <span className="topbar-action-tooltip" role="tooltip">
        {label}
      </span>
    </div>
  );
}

type AppHeaderProps = {
  isPreviewFocused: boolean;
  isMobileHeader: boolean;
  isMobileMenuOpen: boolean;
  canExport: boolean;
  onOpenSettings: () => void;
  onOpenExport: () => void;
  onOpenChangelog: () => void;
  onTogglePreviewFocus: () => void;
  onToggleMobileMenu: () => void;
  onCloseMobileMenu: () => void;
  onResetPreview: () => void;
  onFitPreview: () => void;
};

export function AppHeader({
  isPreviewFocused,
  isMobileHeader,
  isMobileMenuOpen,
  canExport,
  onOpenSettings,
  onOpenExport,
  onOpenChangelog,
  onTogglePreviewFocus,
  onToggleMobileMenu,
  onCloseMobileMenu,
  onResetPreview,
  onFitPreview,
}: AppHeaderProps) {
  return (
    <>
      <header className="topbar">
        <div className="brand">
          <img className="brand-mark" src="/icon.svg" alt="" />
          <div className="brand-copy">
            <h1>{t("header.title")}</h1>
          </div>
        </div>
        <div className="topbar-actions">
          {isPreviewFocused ? (
            <div className="focus-pill">{t("header.previewFocus")}</div>
          ) : null}
          {!isMobileHeader ? (
            <div className="topbar-action-row">
              <ActionButton
                label={t("header.resetPreview")}
                onClick={onResetPreview}
                disabled={!canExport}
              >
                <ResetIcon />
              </ActionButton>
              <ActionButton
                label={t("header.fitPreview")}
                onClick={onFitPreview}
                disabled={!canExport}
              >
                <FitIcon />
              </ActionButton>
              <ActionButton
                label={
                  isPreviewFocused
                    ? t("header.exitPreviewFocus")
                    : t("header.focusPreview")
                }
                onClick={onTogglePreviewFocus}
                disabled={!canExport}
                active={isPreviewFocused}
              >
                <FocusIcon />
              </ActionButton>
              <ActionButton
                label={t("header.openChangelog")}
                onClick={onOpenChangelog}
              >
                <ChangelogIcon />
              </ActionButton>
              <ActionButton
                label={t("header.openExport")}
                onClick={onOpenExport}
                disabled={!canExport}
                emphasis="primary"
              >
                <ExportIcon />
              </ActionButton>
              <ActionButton
                label={t("header.openSettings")}
                onClick={onOpenSettings}
              >
                <SettingsIcon />
              </ActionButton>
            </div>
          ) : (
            <button
              type="button"
              className="topbar-menu-toggle"
              aria-label={
                isMobileMenuOpen
                  ? t("header.closeNavigation")
                  : t("header.openNavigation")
              }
              aria-expanded={isMobileMenuOpen}
              onClick={onToggleMobileMenu}
            >
              <BurgerIcon />
            </button>
          )}
        </div>
      </header>

      {isMobileHeader && isMobileMenuOpen ? (
        <>
          <button
            type="button"
            className="mobile-menu-backdrop"
            aria-label={t("header.closeNavigation")}
            onClick={onCloseMobileMenu}
          />
          <div
            className="mobile-menu-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
          >
            <div className="mobile-menu-header">
              <div>
                <h2 id="mobile-menu-title">{t("header.navigationMenu")}</h2>
                <p className="panel-subtitle">{t("header.navigationHint")}</p>
              </div>
              <button
                type="button"
                className="mobile-menu-close"
                aria-label={t("header.closeNavigation")}
                onClick={onCloseMobileMenu}
              >
                {t("common.close")}
              </button>
            </div>
            <div className="mobile-menu-group">
              <ActionButton
                label={t("header.openSettings")}
                onClick={onOpenSettings}
                variant="mobile-menu"
              >
                <SettingsIcon />
              </ActionButton>
              <ActionButton
                label={t("header.openChangelog")}
                onClick={onOpenChangelog}
                variant="mobile-menu"
              >
                <ChangelogIcon />
              </ActionButton>
              <ActionButton
                label={t("header.openExport")}
                onClick={onOpenExport}
                disabled={!canExport}
                variant="mobile-menu"
                emphasis="primary"
              >
                <ExportIcon />
              </ActionButton>
            </div>
            <div className="mobile-menu-group">
              <ActionButton
                label={t("header.resetPreview")}
                onClick={onResetPreview}
                disabled={!canExport}
                variant="mobile-menu"
              >
                <ResetIcon />
              </ActionButton>
              <ActionButton
                label={t("header.fitPreview")}
                onClick={onFitPreview}
                disabled={!canExport}
                variant="mobile-menu"
              >
                <FitIcon />
              </ActionButton>
              <ActionButton
                label={
                  isPreviewFocused
                    ? t("header.exitPreviewFocus")
                    : t("header.focusPreview")
                }
                onClick={onTogglePreviewFocus}
                disabled={!canExport}
                active={isPreviewFocused}
                variant="mobile-menu"
              >
                <FocusIcon />
              </ActionButton>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
